#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { intro, log, outro } from "@clack/prompts";
import { runCommand, runCommandWithTaskLog } from "./lib/shell.mjs";

function ensureCleanWorkingTree() {
  const status = runCommand("git", ["status", "--porcelain"]);

  if (status.status !== 0) {
    log.error("Unable to read Git status.");
    return false;
  }

  if (status.stdout !== "") {
    log.error(
      "Working tree is not clean. Commit or stash local changes before publishing.",
    );
    return false;
  }

  return true;
}

async function runOrExit(title, command, args) {
  const result = await runCommandWithTaskLog(title, command, args);
  if (!result.ok) {
    process.exit(result.status);
  }
}

async function main() {
  const preflightOnly = process.argv.includes("--preflight");
  const publish = process.argv.includes("--publish");

  intro("Core Utils Publish");

  await runOrExit("Doctor preflight (pnpm bootstrap:doctor)", "pnpm", [
    "bootstrap:doctor",
  ]);
  await runOrExit("Workspace verification (pnpm setup:verify)", "pnpm", [
    "setup:verify",
  ]);

  if (preflightOnly) {
    outro("Preflight complete.");
    return;
  }

  if (!publish) {
    log.error("Specify either --preflight or --publish.");
    process.exit(1);
  }

  if (!ensureCleanWorkingTree()) {
    process.exit(1);
  }

  // Auto-generate changeset from commits (matches CI/CD workflow)
  await runOrExit(
    "Generate auto changeset (scripts/release/create-auto-changeset.mjs)",
    "node",
    ["./scripts/release/create-auto-changeset.mjs"],
  );

  await runOrExit("Versioning packages (pnpm version-packages)", "pnpm", [
    "version-packages",
  ]);

  // Commit version changes
  const diff = execFileSync("git", ["diff", "--quiet"], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (diff === "") {
    log.warn(
      "No version changes detected. This may indicate no publishable changes.",
    );
  } else {
    execFileSync("git", ["config", "user.name", "automated-release"], {
      stdio: "inherit",
    });
    execFileSync("git", ["config", "user.email", "release@reasonabletech.com"], {
      stdio: "inherit",
    });
    execFileSync("git", ["add", "-A"], { stdio: "inherit" });
    execFileSync("git", ["commit", "-m", "chore(release): version packages"], {
      stdio: "inherit",
    });
    execFileSync("git", ["push"], { stdio: "inherit" });
  }

  await runOrExit("Publishing release (pnpm release)", "pnpm", ["release"]);

  outro("Publish complete.");
}

void main();
