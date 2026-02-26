#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { intro, log, outro } from "@clack/prompts";
import { logSubline, promptConfirm } from "./lib/ui.mjs";
import { runCommand, runCommandWithTask } from "./lib/shell.mjs";
import {
  configureTurboRemoteCache,
  normalizeTeamSlug,
  parseEnvFile,
} from "./lib/turbo-remote-cache.mjs";

function checkNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isNaN(major) || major < 22) {
    return { ok: false, detail: `${process.versions.node} (requires >= 22)` };
  }
  return { ok: true, detail: process.versions.node };
}

function checkCli(command, versionArg = "--version") {
  const result = runCommand(command, [versionArg]);
  const singleLineOutput = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return {
    ok: result.status === 0,
    detail: result.status === 0 ? (singleLineOutput ?? result.stdout) : `${command} not found`,
  };
}

function parseGitHubRepoFromOrigin() {
  const remote = runCommand("git", ["remote", "get-url", "origin"]);
  if (remote.status !== 0) {
    return null;
  }

  const value = remote.stdout;
  const sshMatch = /^git@github\.com:([^/]+)\/(.+?)(\.git)?$/.exec(value);
  if (sshMatch !== null) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  const httpsMatch = /^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/.exec(
    value,
  );
  if (httpsMatch !== null) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  return null;
}

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function isInteractiveTerminal() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function createLoginEnv() {
  const env = { ...process.env };
  const noisyConfigKeys = [
    "npm_config_strict_peer_dependencies",
    "npm_config_verify_deps_before_run",
    "npm_config_node_linker",
    "npm_config_store_dir",
    "npm_config_auto_install_peers",
  ];

  for (const key of noisyConfigKeys) {
    delete env[key];
    delete env[key.toUpperCase()];
  }

  return env;
}

async function ensureLocalNpmAuth({ interactive }) {
  const current = runCommand("pnpm", ["whoami"]);
  if (current.status === 0) {
    return true;
  }

  if (!interactive || !isInteractiveTerminal()) {
    log.warn("NPM auth not configured.");
    return false;
  }

  const loginNow = await promptConfirm(
    "NPM auth is missing. Run `pnpm login` now?",
    true,
  );
  if (!loginNow) {
    log.warn("Skipped NPM login.");
    return false;
  }

  log.step("Running `pnpm login`");
  const login = spawnSync(
    "pnpm",
    ["login", "--registry", "https://registry.npmjs.org/"],
    {
      cwd: homedir(),
      env: createLoginEnv(),
      stdio: "inherit",
      shell: false,
    },
  );
  const loginStatus = login.status ?? 1;
  if (loginStatus !== 0) {
    log.warn("`pnpm login` did not complete.");
    return false;
  }

  const verify = runCommand("pnpm", ["whoami"]);
  if (verify.status === 0) {
    log.success(`NPM auth configured as ${verify.stdout}.`);
    return true;
  }

  log.warn("NPM auth is still not configured.");
  return false;
}

function resolveGitHubRepoContext() {
  const repo = parseGitHubRepoFromOrigin();
  if (repo === null) {
    return {
      ok: false,
      repo: null,
      reason: "could not resolve GitHub origin remote",
    };
  }

  const ghAuth = runCommand("gh", ["auth", "status"]);
  if (ghAuth.status !== 0) {
    return {
      ok: false,
      repo,
      reason: "GitHub CLI is not authenticated",
    };
  }

  return {
    ok: true,
    repo,
    reason: null,
  };
}

function resolveTurboTeamValue(turboScope) {
  if (typeof turboScope === "string" && turboScope.trim().length > 0) {
    const normalized = normalizeTeamSlug(turboScope);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  const envValues = parseEnvFile(envPath);
  const rawTeam = stripWrappingQuotes(envValues.get("TURBO_TEAM") ?? "");
  const normalized = normalizeTeamSlug(rawTeam);
  return normalized.length > 0 ? normalized : null;
}

function setGitHubVariable(repo, key, value) {
  return runCommand(
    "gh",
    ["variable", "set", key, "--repo", repo, "--body", value],
  );
}

function setGitHubSecret(repo, key, value) {
  return runCommand(
    "gh",
    ["secret", "set", key, "--repo", repo],
    {
      input: value,
    },
  );
}

function resolveVercelAuthTokenFromDisk() {
  const candidatePaths = [
    path.join(homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json"),
    path.join(homedir(), ".config", "com.vercel.cli", "auth.json"),
    path.join(homedir(), ".vercel", "auth.json"),
  ];

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(candidatePath, "utf8"));
      const token = parsed?.token;
      if (typeof token === "string" && token.trim().length > 0) {
        return token.trim();
      }
    } catch {
      // Continue trying the next known auth location.
    }
  }

  return null;
}

function resolveTurboToken() {
  const envToken = process.env.TURBO_TOKEN?.trim() ?? "";
  if (envToken.length > 0) {
    return envToken;
  }
  const vercelToken = process.env.VERCEL_TOKEN?.trim() ?? "";
  if (vercelToken.length > 0) {
    return vercelToken;
  }
  const diskToken = resolveVercelAuthTokenFromDisk();
  if (diskToken != null) {
    return diskToken;
  }

  return null;
}

function discoverPublishablePackages() {
  const packagesRoot = path.resolve(process.cwd(), "packages");
  if (!existsSync(packagesRoot)) {
    return [];
  }

  const packageNames = [];
  const entries = readdirSync(packagesRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = path.join(packagesRoot, entry.name, "package.json");
    if (!existsSync(manifestPath)) {
      continue;
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (manifest.private === true || typeof manifest.name !== "string") {
        continue;
      }
      packageNames.push(manifest.name);
    } catch {
      // Ignore malformed manifests when rendering setup guidance.
    }
  }

  return packageNames.sort((left, right) => left.localeCompare(right));
}

function logNpmTrustedPublishingGuide(repo) {
  const parts = repo.split("/", 2);
  const owner = parts[0] ?? "";
  const repoName = parts[1] ?? "";
  if (owner.length === 0 || repoName.length === 0) {
    log.error(
      "Unable to render npm Trusted Publishing guidance: repository owner/name could not be derived.",
    );
    return;
  }
  const publishablePackages = discoverPublishablePackages();

  log.step("npm Trusted Publishing setup (one-time per package)");
  logSubline("npm currently has no CLI/API for trusted publisher configuration.");
  logSubline("Trusted publishing is configured per package after it exists on npm.");
  if (publishablePackages.length > 0) {
    logSubline("Packages in this repository:");
    for (const packageName of publishablePackages) {
      logSubline(`   - ${packageName}`);
    }
  }
  logSubline(
    "1. For any package not yet published, run one token-based publish to create it on npm.",
  );
  logSubline("2. Open npmjs.com and go to each package: Settings > Trusted Publisher.");
  logSubline("3. Select GitHub Actions and enter:");
  logSubline(`   - Organization or user: ${owner}`);
  logSubline(`   - Repository: ${repoName}`);
  logSubline("   - Workflow filename: release.yml");
  logSubline("   - Environment: leave blank unless you enforce one in GitHub.");
  logSubline(
    "4. Save and re-run release; publishing will use OIDC (no long-lived npm token).",
  );
}

function configureGitHubTurboSettings({
  repo,
  turboScope,
  required,
}) {
  const turboTeam = resolveTurboTeamValue(turboScope);
  if (turboTeam === null) {
    const message =
      "GitHub variable TURBO_TEAM was not auto-discovered (Turbo link scope or .env.local).";
    if (required) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  const setTeam = setGitHubVariable(repo, "TURBO_TEAM", turboTeam);
  if (setTeam.status !== 0) {
    const message = `Failed to configure GitHub variable TURBO_TEAM for ${repo}.`;
    if (required) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }
  log.success(`Configured GitHub variable TURBO_TEAM for ${repo}.`);

  const turboToken = resolveTurboToken();
  if (turboToken == null) {
    const message =
      "GitHub secret TURBO_TOKEN was not auto-discovered (TURBO_TOKEN/VERCEL_TOKEN/env or local Vercel auth).";
    if (required) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  const setToken = setGitHubSecret(repo, "TURBO_TOKEN", turboToken);

  if (setToken.status !== 0) {
    const message = `Failed to configure GitHub secret TURBO_TOKEN for ${repo}.`;
    if (required) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  log.success(`Configured GitHub secret TURBO_TOKEN for ${repo}.`);
  return true;
}

function configureGitHubReleaseDependencies({
  turboScope,
  required,
}) {
  log.step("GitHub release dependencies");

  const context = resolveGitHubRepoContext();
  if (!context.ok || context.repo === null) {
    const message = `GitHub release dependency setup failed: ${context.reason ?? "unknown error"}.`;
    if (required) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  return configureGitHubTurboSettings({
    repo: context.repo,
    turboScope,
    required,
  });
}

function logFollowUpItems(title, items) {
  if (items.length === 0) {
    return;
  }

  log.step(title);
  for (const item of items) {
    logSubline(item);
  }
}

async function main() {
  const doctorMode = process.argv.includes("--doctor");
  const skipInstall = process.argv.includes("--skip-install");
  const skipVerify = process.argv.includes("--skip-verify");
  const skipRemote = process.argv.includes("--skip-remote");
  const skipAuth = process.argv.includes("--skip-auth");

  intro("Core Utils Bootstrap");
  log.step("Prerequisites");

  const checks = [
    { name: "Node.js", ...checkNodeVersion() },
    { name: "PNPM", ...checkCli("pnpm") },
    { name: "NPM Auth", ...(() => {
      const result = runCommand("pnpm", ["whoami"]);
      return {
        ok: result.status === 0,
        detail: result.status === 0 ? `Authenticated as ${result.stdout}` : "Not authenticated",
      };
    })() },
    { name: "GitHub CLI", ...checkCli("gh") },
  ];

  for (const check of checks) {
    if (check.ok) {
      log.success(`${check.name}: ${check.detail}`);
    } else {
      log.warn(`${check.name}: ${check.detail}`);
    }
  }

  if (!checks[0].ok || !checks[1].ok) {
    log.error("Bootstrap cannot continue until Node.js and PNPM are available.");
    process.exit(1);
  }

  if (!doctorMode && !skipAuth) {
    await ensureLocalNpmAuth({ interactive: true });
  }

  if (doctorMode) {
    outro("Doctor check complete.");
    return;
  }

  if (!skipInstall) {
    const install = await runCommandWithTask(
      "Installing workspace dependencies (pnpm install --frozen-lockfile)",
      "pnpm",
      ["install", "--frozen-lockfile"],
    );
    if (!install.ok) {
      process.exit(install.status);
    }
  }

  if (!skipRemote) {
    const turboRemoteCache = await configureTurboRemoteCache();
    logFollowUpItems(
      "Turbo remote cache follow-up",
      turboRemoteCache.followUpItems,
    );
    const releaseDependenciesConfigured = configureGitHubReleaseDependencies({
      turboScope: turboRemoteCache.scope,
      required: true,
    });
    if (!releaseDependenciesConfigured) {
      process.exit(1);
    }
    const context = resolveGitHubRepoContext();
    if (context.ok && context.repo !== null) {
      logNpmTrustedPublishingGuide(context.repo);
    }
  }

  if (!skipVerify) {
    const verify = await runCommandWithTask(
      "Running workspace verification (pnpm setup:verify)",
      "pnpm",
      ["setup:verify"],
    );
    if (!verify.ok) {
      process.exit(verify.status);
    }
  }

  outro("Bootstrap complete.");
}

void main();
