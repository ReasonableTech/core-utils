import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const packTempDir = mkdtempSync(path.join(tmpdir(), "config-tsup-pack-"));
const consumerTempDir = mkdtempSync(
  path.join(tmpdir(), "config-tsup-consumer-"),
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

function writeConsumerConfig(content) {
  writeFileSync(path.join(consumerTempDir, "tsup.config.ts"), content);
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
        name: "config-tsup-consumer-smoke",
        private: true,
        type: "module",
        scripts: {
          build: "tsup --config tsup.config.ts",
        },
      },
      null,
      2,
    ),
  );

  mkdirSync(path.join(consumerTempDir, "src"), { recursive: true });
  writeFileSync(
    path.join(consumerTempDir, "src/index.ts"),
    "export const smokeValue = 42;\n",
  );

  run("pnpm", ["add", "-D", "tsup", "typescript", tarballPath], consumerTempDir);

  writeConsumerConfig(
    `import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  dts: false,
});
`,
  );
  run("pnpm", ["build"], consumerTempDir);

  writeConsumerConfig(
    `import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
`,
  );
  run("pnpm", ["build"], consumerTempDir);

  console.log("Consumer smoke verification passed.");
} finally {
  rmSync(packTempDir, { recursive: true, force: true });
  rmSync(consumerTempDir, { recursive: true, force: true });
}
