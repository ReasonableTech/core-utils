import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const tempDir = mkdtempSync(path.join(tmpdir(), "config-typescript-pack-"));

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function parsePackResult(output) {
  const parsed = JSON.parse(output);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed[0];
  }
  if (typeof parsed === "object" && parsed !== null) {
    return parsed;
  }
  throw new Error("Unexpected PNPM pack output.");
}

const EXPECTED_EXPORTS = [
  "./app.json",
  "./base.json",
  "./browser-library.json",
  "./chrome-extension.json",
  "./docs.json",
  "./eslint.json",
  "./library.json",
  "./nextjs.json",
  "./platform-library.json",
  "./react-app.json",
  "./react-library.json",
  "./server.json",
  "./strict.json",
  "./tooling.json",
  "./vscode-extension.json",
];

function getExportTargets() {
  const packageJsonPath = path.join(packageDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const exportsField = packageJson.exports ?? {};
  const exportKeys = Object.keys(exportsField).sort();
  const expectedExportKeys = [...EXPECTED_EXPORTS].sort();

  if (JSON.stringify(exportKeys) !== JSON.stringify(expectedExportKeys)) {
    throw new Error(
      `Unexpected export map. Expected ${expectedExportKeys.join(", ")}, received ${exportKeys.join(", ")}`,
    );
  }

  return expectedExportKeys.map((exportKey) => {
    const targetPath = exportsField[exportKey];
    if (typeof targetPath !== "string") {
      throw new TypeError(`Export ${exportKey} must resolve to a string target.`);
    }
    return targetPath.startsWith("./") ? targetPath.slice(2) : targetPath;
  });
}

try {
  const output = run(
    "pnpm",
    ["pack", "--json", "--pack-destination", tempDir],
    packageDir,
  );
  const packResult = parsePackResult(output);
  const requiredFiles = getExportTargets();
  const rootWrapperFiles = requiredFiles.map((requiredPath) => {
    return path.basename(requiredPath);
  });

  const files = (packResult.files ?? []).map((file) => file.path);
  const missingFiles = requiredFiles.filter((requiredPath) => {
    return !files.includes(requiredPath);
  });
  const duplicatedRootWrappers = rootWrapperFiles.filter((wrapperPath) => {
    return files.includes(wrapperPath);
  });

  if (missingFiles.length > 0) {
    throw new Error(
      `Pack is missing required files: ${missingFiles.join(", ")}`,
    );
  }
  if (duplicatedRootWrappers.length > 0) {
    throw new Error(
      `Pack should not include duplicated root wrappers: ${duplicatedRootWrappers.join(", ")}`,
    );
  }

  console.log("Pack verification passed.");
  console.log(`Validated ${files.length} files.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
