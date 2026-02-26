#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: options.env ?? process.env,
    }).trim();
  } catch (error) {
    const stdout = String(error.stdout ?? "").trim();
    const stderr = String(error.stderr ?? "").trim();
    const message = [stderr, stdout].filter((part) => part.length > 0).join("\n");
    if (message.length > 0) {
      throw new Error(message);
    }
    throw error;
  }
}

function parseArgs(argv) {
  let packDir = null;
  let statusFile = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--pack-dir") {
      packDir = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--status-file") {
      statusFile = argv[index + 1] ?? null;
      index += 1;
    }
  }

  const mode = packDir == null ? "dry-run" : "pack";
  const defaultStatusFile =
    mode === "dry-run"
      ? path.join(".release-preflight", "release-status.json")
      : path.join(".release-artifacts", "release-status.json");

  return {
    mode,
    packDir:
      packDir == null
        ? null
        : path.resolve(process.cwd(), packDir),
    statusFile:
      statusFile == null
        ? path.resolve(process.cwd(), defaultStatusFile)
        : path.resolve(process.cwd(), statusFile),
  };
}

function loadReleasePackagesFromChangesets(statusFilePath) {
  mkdirSync(path.dirname(statusFilePath), { recursive: true });
  const repoRelativeStatusPath = path.relative(process.cwd(), statusFilePath);
  run("pnpm", ["exec", "changeset", "status", "--output", repoRelativeStatusPath], {
    env: {
      ...process.env,
      CI: "1",
    },
  });

  const parsed = JSON.parse(readFileSync(statusFilePath, "utf8"));
  if (!Array.isArray(parsed.releases)) {
    throw new Error("Changeset status output did not include a releases array.");
  }

  const names = new Set();
  for (const release of parsed.releases) {
    if (release == null || typeof release !== "object") {
      continue;
    }
    if (release.type === "none") {
      continue;
    }
    if (typeof release.name !== "string" || release.name.length === 0) {
      continue;
    }
    names.add(release.name);
  }

  return [...names];
}

function listPublishablePackages() {
  const packagesRoot = path.resolve(process.cwd(), "packages");
  const entries = readdirSync(packagesRoot, { withFileTypes: true });
  const byName = new Map();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const directory = path.join(packagesRoot, entry.name);
    const packageJsonPath = path.join(directory, "package.json");
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    if (manifest.private === true || typeof manifest.name !== "string") {
      continue;
    }

    byName.set(manifest.name, {
      name: manifest.name,
      directory,
      manifest,
    });
  }

  return byName;
}

function collectExportTargets(value, targets) {
  if (typeof value === "string") {
    targets.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectExportTargets(item, targets);
    }
    return;
  }
  if (value != null && typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectExportTargets(nested, targets);
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function assertExportTargetsExistInPacklist(packageName, manifest, packFiles) {
  if (manifest.exports == null) {
    return;
  }

  const exportTargets = new Set();
  collectExportTargets(manifest.exports, exportTargets);
  const missingTargets = [];

  for (const target of exportTargets) {
    if (!target.startsWith("./")) {
      continue;
    }

    const normalized = target.slice(2);
    if (normalized.length === 0) {
      continue;
    }

    if (normalized.includes("*")) {
      const matcher = new RegExp(
        `^${normalized.split("*").map((part) => escapeRegExp(part)).join(".*")}$`,
        "u",
      );
      const matched = [...packFiles].some((filePath) => matcher.test(filePath));
      if (!matched) {
        missingTargets.push(target);
      }
      continue;
    }

    if (!packFiles.has(normalized)) {
      missingTargets.push(target);
    }
  }

  if (missingTargets.length > 0) {
    throw new Error(
      `${packageName}: exports target(s) missing from package contents: ${missingTargets.join(", ")}`,
    );
  }
}

function parseNpmPackJson(rawOutput, packageName) {
  const parsed = JSON.parse(rawOutput);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed[0] == null) {
    throw new Error(`${packageName}: npm pack did not return JSON metadata.`);
  }
  return parsed[0];
}

function runPackCheck(pkg, options) {
  const args = ["pack", "--json"];
  if (options.mode === "dry-run") {
    args.splice(1, 0, "--dry-run");
  } else if (options.packDir != null) {
    args.push("--pack-destination", options.packDir);
  }

  const raw = run("npm", args, { cwd: pkg.directory });
  const metadata = parseNpmPackJson(raw, pkg.name);
  const files = Array.isArray(metadata.files) ? metadata.files : [];
  const packFiles = new Set(
    files
      .map((entry) =>
        entry != null && typeof entry === "object" && typeof entry.path === "string"
          ? entry.path
          : null,
      )
      .filter((value) => value != null),
  );

  if (packFiles.size === 0) {
    throw new Error(`${pkg.name}: npm pack reported zero packaged files.`);
  }

  assertExportTargetsExistInPacklist(pkg.name, pkg.manifest, packFiles);
  return metadata;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode === "pack" && options.packDir != null) {
    mkdirSync(options.packDir, { recursive: true });
  }

  const releasePackageNames = loadReleasePackagesFromChangesets(options.statusFile);
  if (releasePackageNames.length === 0) {
    console.log("Release preflight: no packages scheduled for release.");
    return;
  }

  const publishablePackages = listPublishablePackages();
  const packaged = [];

  for (const packageName of releasePackageNames) {
    const pkg = publishablePackages.get(packageName);
    if (pkg == null) {
      throw new Error(
        `Release preflight: package ${packageName} is in changeset status but was not found in packages/.`,
      );
    }

    const metadata = runPackCheck(pkg, options);
    packaged.push({
      packageName,
      filename: String(metadata.filename ?? ""),
      files: Number(metadata.entryCount ?? 0),
    });
  }

  for (const item of packaged) {
    if (options.mode === "dry-run") {
      console.log(
        `Preflight ok: ${item.packageName} (npm pack --dry-run, ${String(item.files)} files)`,
      );
      continue;
    }
    console.log(
      `Packed: ${item.packageName} -> ${item.filename}`,
    );
  }
}

function exitWithCliError(error) {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}

try {
  main();
} catch (error) {
  exitWithCliError(error);
}
