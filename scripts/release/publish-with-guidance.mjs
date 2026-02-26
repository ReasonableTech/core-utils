#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
  });
}

function parseGitHubRepoFromOrigin() {
  const remote = run("git", ["remote", "get-url", "origin"]);
  if ((remote.status ?? 1) !== 0) {
    return null;
  }

  const value = String(remote.stdout ?? "").trim();
  const sshMatch = /^git@github\.com:([^/]+)\/(.+?)(\.git)?$/u.exec(value);
  if (sshMatch !== null) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  const httpsMatch = /^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/u.exec(value);
  if (httpsMatch !== null) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  return null;
}

function nonEmptyLine(output) {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function looksLikeTrustedPublishingIssue(output) {
  const patterns = [
    /trusted publishing/iu,
    /trusted publisher/iu,
    /not authorized to publish/iu,
    /authentication/i,
    /requires an otp/iu,
    /one-time password/iu,
  ];
  return patterns.some((pattern) => pattern.test(output));
}

function logTrustedPublishingGuidance() {
  const repo = parseGitHubRepoFromOrigin();
  const parts = repo == null ? [] : repo.split("/", 2);
  const owner = parts[0] ?? "";
  const repoName = parts[1] ?? "";

  console.error("npm Trusted Publishing is not configured for this workflow.");
  console.error("Trusted publishing is configured per package after it exists on npm.");
  console.error("If this is a brand-new package, do one initial token-based publish first.");
  console.error("Then configure npm Trusted Publisher with:");
  if (owner.length > 0) {
    console.error(`- Organization or user: ${owner}`);
  }
  if (repoName.length > 0) {
    console.error(`- Repository: ${repoName}`);
  }
  console.error("- Workflow filename: release.yml");
  console.error("- Branch: main");
}

function main() {
  const publish = run("pnpm", ["exec", "changeset", "publish"]);
  const status = publish.status ?? 1;
  const stdout = String(publish.stdout ?? "").trim();
  const stderr = String(publish.stderr ?? "").trim();
  const combinedOutput = [stderr, stdout].filter((text) => text.length > 0).join("\n");

  if (status === 0) {
    if (stdout.length > 0) {
      console.log(stdout);
    }
    if (stderr.length > 0) {
      console.error(stderr);
    }
    return;
  }

  if (looksLikeTrustedPublishingIssue(combinedOutput)) {
    logTrustedPublishingGuidance();
    process.exit(status);
  }

  const summary = nonEmptyLine(combinedOutput) ?? "unknown publish error";
  console.error(summary);
  process.exit(status);
}

main();
