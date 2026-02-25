import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const tempDir = mkdtempSync(path.join(tmpdir(), "config-tsup-pack-"));

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

try {
  const output = run(
    "pnpm",
    ["pack", "--json", "--pack-destination", tempDir],
    packageDir,
  );
  const packResult = parsePackResult(output);

  const files = (packResult.files ?? []).map((file) => file.path);
  const requiredFiles = [
    "dist/index.js",
    "dist/src/index.d.ts",
    "dist/src/config.d.ts",
  ];
  const missingFiles = requiredFiles.filter((requiredPath) => {
    return !files.includes(requiredPath);
  });

  const leakedWorkspacePaths = files.filter((filePath) => {
    return (
      filePath.startsWith("dist/core-utils/") ||
      filePath.includes("/packages/config-tsup/")
    );
  });

  if (missingFiles.length > 0) {
    throw new Error(
      `Pack is missing required files: ${missingFiles.join(", ")}`,
    );
  }

  if (leakedWorkspacePaths.length > 0) {
    throw new Error(
      `Pack contains leaked workspace paths: ${leakedWorkspacePaths.join(", ")}`,
    );
  }

  console.log("Pack verification passed.");
  console.log(`Validated ${files.length} files.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
