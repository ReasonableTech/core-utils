#!/usr/bin/env node

/**
 * Creates a GitHub Release for each package tag created by `changeset publish`.
 *
 * `changeset publish` tags each published package as `@scope/package@version`.
 * This script enumerates those tags pointing at HEAD, reads the latest version
 * section from each package's CHANGELOG.md, and creates a GitHub Release.
 *
 * Requires: GITHUB_TOKEN env var, `gh` CLI available.
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const REPO = "ReasonableTech/core-utils";
const TAG_PATTERN = /^@reasonabletech\//u;

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function getTagsAtHead() {
  const head = run("git", ["rev-parse", "HEAD"]);
  const allTags = run("git", ["tag", "--points-at", head]);
  if (allTags === "") {
    return [];
  }
  return allTags.split(/\r?\n/u).filter((tag) => TAG_PATTERN.test(tag));
}

function parseTag(tag) {
  // Tags are formatted as `@reasonabletech/package@version`
  const match = /^(@reasonabletech\/[^@]+)@(.+)$/u.exec(tag);
  if (match === null) {
    return null;
  }
  return { packageName: match[1], version: match[2] };
}

function findPackageDir(packageName) {
  const shortName = packageName.replace("@reasonabletech/", "");
  const candidate = path.join("packages", shortName);
  if (existsSync(path.join(candidate, "package.json"))) {
    return candidate;
  }

  // Fall back to scanning all packages
  for (const dir of readdirSync("packages")) {
    const pkgPath = path.join("packages", dir, "package.json");
    if (!existsSync(pkgPath)) {
      continue;
    }
    const { name } = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (name === packageName) {
      return path.join("packages", dir);
    }
  }

  return null;
}

function extractChangelogSection(packageDir, version) {
  const changelogPath = path.join(packageDir, "CHANGELOG.md");
  if (!existsSync(changelogPath)) {
    return null;
  }

  const content = readFileSync(changelogPath, "utf8");
  const lines = content.split(/\r?\n/u);

  // Find the heading for this version (e.g. `## 0.1.1`)
  const startIndex = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (startIndex === -1) {
    return null;
  }

  // Collect lines until the next `##` heading or end of file
  const sectionLines = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      break;
    }
    sectionLines.push(lines[i]);
  }

  return sectionLines.join("\n").trim() || null;
}

function createRelease(tag, packageName, version, notes) {
  const args = [
    "release",
    "create",
    tag,
    "--repo",
    REPO,
    "--title",
    `${packageName}@${version}`,
    "--notes",
    notes ?? `Release ${packageName}@${version}`,
    "--verify-tag",
  ];

  try {
    run("gh", args, { stdio: ["ignore", "pipe", "inherit"] });
    console.log(`Created GitHub Release: ${tag}`);
  } catch {
    console.error(`Failed to create GitHub Release for ${tag}`);
    process.exitCode = 1;
  }
}

function main() {
  const tags = getTagsAtHead();

  if (tags.length === 0) {
    console.log("GitHub releases: no package tags found at HEAD, skipping.");
    return;
  }

  console.log(`GitHub releases: found ${tags.length} tag(s): ${tags.join(", ")}`);

  for (const tag of tags) {
    const parsed = parseTag(tag);
    if (parsed === null) {
      console.warn(`GitHub releases: skipping unrecognized tag format: ${tag}`);
      continue;
    }

    const { packageName, version } = parsed;
    const packageDir = findPackageDir(packageName);

    if (packageDir === null) {
      console.warn(`GitHub releases: could not find package directory for ${packageName}`);
      continue;
    }

    const notes = extractChangelogSection(packageDir, version);
    createRelease(tag, packageName, version, notes);
  }
}

main();
