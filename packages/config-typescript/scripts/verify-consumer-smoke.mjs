import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const packTempDir = mkdtempSync(path.join(tmpdir(), "config-typescript-pack-"));
const consumerTempDir = mkdtempSync(
  path.join(tmpdir(), "config-typescript-consumer-"),
);

function run(command, args, cwd, inheritOutput = true) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: inheritOutput ? "inherit" : ["ignore", "pipe", "pipe"],
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

function writeTsconfig(filename, extendPath, sourcePath) {
  writeFileSync(
    path.join(consumerTempDir, filename),
    JSON.stringify(
      {
        extends: extendPath,
        compilerOptions: {
          noEmit: true,
        },
        include: [sourcePath],
      },
      null,
      2,
    ),
  );
}

try {
  const output = run(
    "pnpm",
    ["pack", "--json", "--pack-destination", packTempDir],
    packageDir,
    false,
  );
  const packResult = parsePackResult(output);
  const tarballPath = path.isAbsolute(packResult.filename)
    ? packResult.filename
    : path.join(packTempDir, packResult.filename);

  writeFileSync(
    path.join(consumerTempDir, "package.json"),
    JSON.stringify(
      {
        name: "config-typescript-consumer-smoke",
        private: true,
        type: "module",
        scripts: {
          "typecheck:base": "tsc --noEmit -p tsconfig.base.json",
          "typecheck:app": "tsc --noEmit -p tsconfig.app.json",
          "typecheck:server": "tsc --noEmit -p tsconfig.server.json",
        },
      },
      null,
      2,
    ),
  );

  mkdirSync(path.join(consumerTempDir, "src"), { recursive: true });
  writeFileSync(path.join(consumerTempDir, "src/base.ts"), "export const base = 1;\n");
  writeFileSync(path.join(consumerTempDir, "src/app.ts"), "export const app = 2;\n");
  writeFileSync(
    path.join(consumerTempDir, "src/server.ts"),
    "export const server = 3;\n",
  );

  writeTsconfig(
    "tsconfig.base.json",
    "@reasonabletech/config-typescript/base.json",
    "src/base.ts",
  );
  writeTsconfig(
    "tsconfig.app.json",
    "@reasonabletech/config-typescript/app.json",
    "src/app.ts",
  );
  writeTsconfig(
    "tsconfig.server.json",
    "@reasonabletech/config-typescript/server.json",
    "src/server.ts",
  );

  run(
    "pnpm",
    ["add", "-D", "typescript", "@types/node", tarballPath],
    consumerTempDir,
  );
  run("pnpm", ["typecheck:base"], consumerTempDir);
  run("pnpm", ["typecheck:app"], consumerTempDir);
  run("pnpm", ["typecheck:server"], consumerTempDir);

  console.log("Consumer smoke verification passed.");
} finally {
  rmSync(packTempDir, { recursive: true, force: true });
  rmSync(consumerTempDir, { recursive: true, force: true });
}
