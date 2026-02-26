#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { intro, log, outro, password } from "@clack/prompts";
import { logSubline, promptConfirm, promptOrExit } from "./lib/ui.mjs";
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

function resolveNpmToken() {
  const fromEnv = process.env.NPM_TOKEN;
  if (fromEnv !== undefined && fromEnv !== "") {
    return fromEnv;
  }

  const npmrcPath = path.join(homedir(), ".npmrc");
  if (!existsSync(npmrcPath)) {
    return null;
  }

  const lines = readFileSync(npmrcPath, "utf8").split(/\r?\n/u);
  for (const line of lines) {
    const match = /^\/\/registry\.npmjs\.org\/:_authToken=(.+)$/u.exec(line.trim());
    if (match === null) {
      continue;
    }
    const token = match[1].trim();
    if (token === "" || token.startsWith("${")) {
      continue;
    }
    return token;
  }

  return null;
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

async function configureGitHubPublishingSecret({ interactive }) {
  const repo = parseGitHubRepoFromOrigin();
  if (repo === null) {
    log.warn(
      "Skipped GitHub secret setup: could not resolve GitHub origin remote.",
    );
    return;
  }

  const ghAuth = runCommand("gh", ["auth", "status"]);
  if (ghAuth.status !== 0) {
    log.warn(
      "Skipped GitHub secret setup: GitHub CLI is not authenticated.",
    );
    return;
  }

  let npmToken = resolveNpmToken();
  if (npmToken === null && interactive && isInteractiveTerminal()) {
    const setNow = await promptConfirm(
      `GitHub secret NPM_TOKEN is missing for ${repo}. Set it now?`,
      true,
    );
    if (setNow) {
      const entered = await promptOrExit(
        password({
          message: "Enter your NPM automation token",
          mask: "*",
        }),
      );
      const value = String(entered).trim();
      if (value !== "") {
        npmToken = value;
      }
    }
  }

  if (npmToken === null) {
    log.warn(
      "Skipped GitHub secret setup: NPM token not found (env var, ~/.npmrc, or prompt).",
    );
    return;
  }

  const setResult = runCommand(
    "gh",
    ["secret", "set", "NPM_TOKEN", "--repo", repo],
    {
      input: npmToken,
    },
  );

  if (setResult.status !== 0) {
    log.error(`Failed to configure GitHub secret NPM_TOKEN for ${repo}.`);
    return;
  }

  log.success(`Configured GitHub secret NPM_TOKEN for ${repo}.`);
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

async function resolveTurboToken({ interactive, repo }) {
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

  if (!interactive || !isInteractiveTerminal()) {
    return null;
  }

  const entered = await promptOrExit(
    password({
      message: `Enter Turbo remote cache token for ${repo}`,
      mask: "*",
    }),
  );
  const value = String(entered).trim();
  return value.length > 0 ? value : null;
}

async function configureGitHubTurboSettings({
  interactive,
  turboScope,
  requireTurboToken,
}) {
  const repo = parseGitHubRepoFromOrigin();
  if (repo === null) {
    const message =
      "GitHub Turbo settings failed: could not resolve GitHub origin remote.";
    if (requireTurboToken) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  const ghAuth = runCommand("gh", ["auth", "status"]);
  if (ghAuth.status !== 0) {
    const message =
      "GitHub Turbo settings failed: GitHub CLI is not authenticated.";
    if (requireTurboToken) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  const turboTeam = resolveTurboTeamValue(turboScope);
  if (turboTeam !== null) {
    const setTeam = setGitHubVariable(repo, "TURBO_TEAM", turboTeam);

    if (setTeam.status === 0) {
      log.success(`Configured GitHub variable TURBO_TEAM for ${repo}.`);
    } else {
      log.warn(`Failed to configure GitHub variable TURBO_TEAM for ${repo}.`);
    }
  } else {
    log.warn(
      "Skipped GitHub variable TURBO_TEAM: no Turbo team scope was detected.",
    );
  }

  const turboToken = await resolveTurboToken({
    interactive,
    repo,
  });
  if (turboToken == null) {
    const message =
      "GitHub secret TURBO_TOKEN was not provided. Set TURBO_TOKEN/VERCEL_TOKEN or provide it at prompt.";
    if (requireTurboToken) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  const setToken = setGitHubSecret(repo, "TURBO_TOKEN", turboToken);

  if (setToken.status !== 0) {
    const message = `Failed to configure GitHub secret TURBO_TOKEN for ${repo}.`;
    if (requireTurboToken) {
      log.error(message);
      return false;
    }
    log.warn(message);
    return true;
  }

  log.success(`Configured GitHub secret TURBO_TOKEN for ${repo}.`);
  return true;
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

  if (!skipRemote) {
    await configureGitHubPublishingSecret({ interactive: !doctorMode });
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
    const turboSettingsConfigured = await configureGitHubTurboSettings({
      interactive: !doctorMode,
      turboScope: turboRemoteCache.scope,
      requireTurboToken: turboRemoteCache.linked,
    });
    if (!turboSettingsConfigured) {
      process.exit(1);
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
