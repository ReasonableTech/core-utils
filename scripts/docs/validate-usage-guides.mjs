import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const packagesRoot = path.join(repoRoot, "packages");

const REQUIRED_README_HEADINGS = [
  "Installation",
  "Usage",
  "Additional References",
];

const BANNED_README_PATTERNS = [
  {
    pattern: /(^|\n)##\s+Package Commands\s*(\n|$)/m,
    message: "README.md must not include ## Package Commands",
  },
  {
    pattern: /pnpm\s+--filter\b/m,
    message: "README.md must not include pnpm --filter commands",
  },
  {
    pattern: /turbo\s+run\b/m,
    message: "README.md must not include turbo run commands",
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasUsageGuideLink(readmeContent) {
  return readmeContent.includes("./docs/guides/usage-guide.md");
}

function getMarkdownHeadings(readmeContent) {
  return Array.from(readmeContent.matchAll(/^##\s+(.+)$/gm)).map((match) => ({
    title: match[1]?.trim() ?? "",
    index: match.index ?? -1,
  }));
}

function getHeadingIndex(headings, title) {
  const heading = headings.find((entry) => entry.title === title);
  return heading?.index ?? -1;
}

function getDocsLinks(readmeContent) {
  const docsLinks = [];
  const linkPattern = /\[[^\]]+\]\((\.\/docs\/[^)]+)\)/g;
  for (const match of readmeContent.matchAll(linkPattern)) {
    const rawPath = match[1] ?? "";
    const cleanPath = rawPath.split("#")[0]?.split("?")[0] ?? "";
    docsLinks.push(cleanPath);
  }
  return docsLinks;
}

function packagePublishesDocs(files) {
  return files.some((entry) => {
    const normalized = entry.replaceAll("\\", "/").replaceAll(/^\.\//g, "");
    return (
      normalized === "docs" ||
      normalized === "docs/" ||
      normalized === "docs/*" ||
      normalized === "docs/**" ||
      normalized === "docs/**/*" ||
      normalized.startsWith("docs/")
    );
  });
}

const packageDirs = fs
  .readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const failures = [];
let checkedPackages = 0;

for (const packageDirName of packageDirs) {
  const packageDir = path.join(packagesRoot, packageDirName);
  const packageJsonPath = path.join(packageDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  checkedPackages += 1;

  const packageJson = readJson(packageJsonPath);
  const packageName =
    typeof packageJson.name === "string" && packageJson.name.length > 0
      ? packageJson.name
      : packageDirName;

  const usageGuidePath = path.join(
    packageDir,
    "docs",
    "guides",
    "usage-guide.md",
  );
  const readmePath = path.join(packageDir, "README.md");

  if (!fs.existsSync(usageGuidePath)) {
    failures.push(
      `${packageName}: missing docs/guides/usage-guide.md at ${path.relative(repoRoot, usageGuidePath)}`,
    );
  }

  if (!fs.existsSync(readmePath)) {
    failures.push(
      `${packageName}: missing README.md at ${path.relative(repoRoot, readmePath)}`,
    );
    continue;
  }

  const readmeContent = fs.readFileSync(readmePath, "utf8");
  const headings = getMarkdownHeadings(readmeContent);

  if (!hasUsageGuideLink(readmeContent)) {
    failures.push(
      `${packageName}: README.md is missing a link to ./docs/guides/usage-guide.md`,
    );
  }

  const exportedEntryPointsIndex = getHeadingIndex(
    headings,
    "Exported Entry Points",
  );
  const exportedApiIndex = getHeadingIndex(headings, "Exported API");
  const exportedIndex =
    exportedEntryPointsIndex >= 0 ? exportedEntryPointsIndex : exportedApiIndex;

  if (exportedIndex < 0) {
    failures.push(
      `${packageName}: README.md is missing ## Exported Entry Points or ## Exported API`,
    );
  }

  for (const heading of REQUIRED_README_HEADINGS) {
    if (getHeadingIndex(headings, heading) < 0) {
      failures.push(`${packageName}: README.md is missing ## ${heading}`);
    }
  }

  const installationIndex = getHeadingIndex(headings, "Installation");
  const usageIndex = getHeadingIndex(headings, "Usage");
  const additionalReferencesIndex = getHeadingIndex(
    headings,
    "Additional References",
  );

  if (
    installationIndex >= 0 &&
    exportedIndex >= 0 &&
    usageIndex >= 0 &&
    additionalReferencesIndex >= 0
  ) {
    const validOrder =
      installationIndex < exportedIndex &&
      exportedIndex < usageIndex &&
      usageIndex < additionalReferencesIndex;

    if (!validOrder) {
      failures.push(
        `${packageName}: README.md sections must be ordered as Installation -> Exported -> Usage -> Additional References`,
      );
    }
  }

  for (const banned of BANNED_README_PATTERNS) {
    if (banned.pattern.test(readmeContent)) {
      failures.push(`${packageName}: ${banned.message}`);
    }
  }

  const docsLinks = getDocsLinks(readmeContent);
  if (docsLinks.length > 0) {
    const files = Array.isArray(packageJson.files) ? packageJson.files : null;
    if (files !== null && !packagePublishesDocs(files)) {
      failures.push(
        `${packageName}: README.md links to ./docs/* but package.json files does not publish docs`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Usage guide validation failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Usage guide validation passed for ${checkedPackages} package${checkedPackages === 1 ? "" : "s"}.`,
);
