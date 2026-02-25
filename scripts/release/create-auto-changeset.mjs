#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CommitParser } from "conventional-commits-parser";

const RELEASE_LEVEL_ORDER = {
  patch: 1,
  minor: 2,
  major: 3,
};

const COMMIT_PARSER = new CommitParser({
  headerPattern: /^(\w*)(?:\(([\w$.\-* ,@/]+)\))?(!)?: (.*)$/u,
  headerCorrespondence: ["type", "scope", "breaking", "subject"],
});

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function maxLevel(left, right) {
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }
  return RELEASE_LEVEL_ORDER[right] > RELEASE_LEVEL_ORDER[left] ? right : left;
}

function resolveDiffRange() {
  const head = process.env.GITHUB_SHA ?? "HEAD";
  const beforeFromEvent = process.env.GITHUB_EVENT_BEFORE;
  const before =
    beforeFromEvent !== undefined &&
    beforeFromEvent !== "" &&
    !/^0+$/u.test(beforeFromEvent)
      ? beforeFromEvent
      : run("git", ["rev-parse", `${head}~1`]);

  return { before, head };
}

function listChangedFiles() {
  const { before, head } = resolveDiffRange();
  const raw = run("git", ["diff", "--name-only", before, head]);
  if (raw === "") {
    return [];
  }
  return raw.split(/\r?\n/u).filter(Boolean);
}

function listCommitMessages() {
  const { before, head } = resolveDiffRange();
  const raw = run("git", ["log", "--format=%B%x1E", `${before}..${head}`]);
  if (raw === "") {
    return [];
  }
  return raw
    .split("\x1E")
    .map((message) => message.trim())
    .filter(Boolean);
}

function listExistingChangesetFiles() {
  if (!existsSync(".changeset")) {
    return [];
  }

  return readdirSync(".changeset").filter((name) => {
    return name.endsWith(".md") && name !== "README.md";
  });
}

function readPackageMeta(packageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (parsed.private === true || typeof parsed.name !== "string") {
    return null;
  }

  return {
    name: parsed.name,
    directory: path.basename(packageDir),
    shortName: parsed.name.includes("/")
      ? parsed.name.split("/")[1]
      : parsed.name,
  };
}

function readLinkedGroups() {
  const configPath = path.join(".changeset", "config.json");
  if (!existsSync(configPath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  if (!Array.isArray(parsed.linked)) {
    return [];
  }

  return parsed.linked.filter((group) => Array.isArray(group));
}

function normalizeScope(rawScope) {
  const trimmed = rawScope.trim().toLowerCase();
  if (trimmed.startsWith("@reasonabletech/")) {
    return trimmed.replace("@reasonabletech/", "");
  }
  return trimmed;
}

function parseCommit(message) {
  const parsed = COMMIT_PARSER.parse(message);
  if (typeof parsed.type !== "string" || parsed.type.trim() === "") {
    return null;
  }

  const type = parsed.type.toLowerCase();
  const rawScopes = typeof parsed.scope === "string" ? parsed.scope : "";
  const scopes =
    rawScopes === ""
      ? []
      : rawScopes
          .split(",")
          .map((scope) => normalizeScope(scope))
          .filter((scope) => scope !== "");

  const noteList = Array.isArray(parsed.notes) ? parsed.notes : [];
  const hasBreakingNote = noteList.some((note) => {
    if (typeof note !== "object" || note === null) {
      return false;
    }
    const title = String(note.title ?? "").toUpperCase();
    return title.includes("BREAKING");
  });

  const isBreaking = parsed.breaking === "!" || hasBreakingNote;

  return { type, scopes, isBreaking };
}

function releaseLevelForCommit(commit) {
  if (commit.isBreaking) {
    return "major";
  }

  if (commit.type === "feat") {
    return "minor";
  }

  if (
    commit.type === "fix" ||
    commit.type === "perf" ||
    commit.type === "refactor" ||
    commit.type === "revert"
  ) {
    return "patch";
  }

  return null;
}

function packageAliases(pkg) {
  const aliases = new Set();
  aliases.add(pkg.directory.toLowerCase());
  aliases.add(pkg.shortName.toLowerCase());
  aliases.add(pkg.name.toLowerCase());
  aliases.add(pkg.name.toLowerCase().replace("@reasonabletech/", ""));
  return aliases;
}

function computeBaseReleaseTypes(changedPackages, commitMessages) {
  const parsedCommits = commitMessages
    .map(parseCommit)
    .filter((commit) => commit !== null)
    .map((commit) => {
      return {
        ...commit,
        level: releaseLevelForCommit(commit),
      };
    })
    .filter((commit) => commit.level !== null);

  const scopedCommits = parsedCommits.filter((commit) => commit.scopes.length > 0);
  const unscopedCommits = parsedCommits.filter((commit) => commit.scopes.length === 0);

  const releaseTypes = new Map();

  for (const pkg of changedPackages) {
    const aliases = packageAliases(pkg);
    const matchingScoped = scopedCommits.filter((commit) => {
      return commit.scopes.some((scope) => aliases.has(scope));
    });

    const sourceCommits =
      matchingScoped.length > 0 ? matchingScoped : unscopedCommits;

    let releaseLevel = null;
    for (const commit of sourceCommits) {
      releaseLevel = maxLevel(releaseLevel, commit.level);
    }

    releaseTypes.set(pkg.name, releaseLevel ?? "patch");
  }

  return releaseTypes;
}

function applyLinkedGroupRules(baseReleaseTypes) {
  const linkedGroups = readLinkedGroups();
  const finalTypes = new Map(baseReleaseTypes);

  for (const group of linkedGroups) {
    const affected = group.filter((packageName) => finalTypes.has(packageName));
    if (affected.length === 0) {
      continue;
    }

    let groupLevel = null;
    for (const packageName of affected) {
      groupLevel = maxLevel(groupLevel, finalTypes.get(packageName));
    }

    for (const packageName of group) {
      finalTypes.set(packageName, maxLevel(finalTypes.get(packageName) ?? null, groupLevel));
    }
  }

  return finalTypes;
}

function writeAutoChangeset(releaseTypes) {
  if (releaseTypes.size === 0) {
    return null;
  }

  const head = (process.env.GITHUB_SHA ?? "HEAD").slice(0, 7);
  const filename = `auto-${Date.now()}-${head}.md`;
  const changesetPath = path.join(".changeset", filename);

  const entries = Array.from(releaseTypes.entries()).sort(([left], [right]) => {
    return left.localeCompare(right);
  });

  const frontmatter = entries
    .map(([packageName, level]) => `"${packageName}": ${level}`)
    .join("\n");

  const content = `---\n${frontmatter}\n---\n\nAutomated release generated from package-scoped Conventional Commits.\n`;
  writeFileSync(changesetPath, content);
  return { changesetPath, entries };
}

function main() {
  const changedFiles = listChangedFiles();
  const commitMessages = listCommitMessages();
  const changedPackageDirs = new Set();

  for (const file of changedFiles) {
    if (!file.startsWith("packages/")) {
      continue;
    }
    const [root, directory] = file.split("/", 3);
    if (root === "packages" && directory !== undefined && directory !== "") {
      changedPackageDirs.add(path.join("packages", directory));
    }
  }

  const changedPackages = Array.from(changedPackageDirs)
    .map(readPackageMeta)
    .filter((pkg) => pkg !== null);

  if (changedPackages.length === 0) {
    console.log("Auto changeset: no publishable package changes detected.");
    return;
  }

  const existingChangesets = listExistingChangesetFiles();
  if (existingChangesets.length > 0) {
    console.log(
      `Auto changeset: existing changeset files detected (${existingChangesets.length}), skipping auto-generation.`,
    );
    return;
  }

  const baseReleaseTypes = computeBaseReleaseTypes(changedPackages, commitMessages);
  const finalReleaseTypes = applyLinkedGroupRules(baseReleaseTypes);
  const created = writeAutoChangeset(finalReleaseTypes);

  if (created === null) {
    console.log("Auto changeset: nothing to release.");
    return;
  }

  const formatted = created.entries
    .map(([packageName, level]) => `${packageName}@${level}`)
    .join(", ");
  console.log(`Auto changeset: created ${created.changesetPath} for ${formatted}`);
}

main();
