import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { BuildOptions } from "esbuild";
import type { Options } from "tsup";

import type { createTsupConfig } from "../../src/index.js";

export type TsupConfig = ReturnType<typeof createTsupConfig>;
export type EsbuildOptionsFunction = (options: BuildOptions) => BuildOptions;

/**
 * Normalizes tsup config exports to an object shape for assertions.
 * @param config - config returned by createTsupConfig or presets
 * @returns normalized tsup options object
 */
export const getConfigObject = (config: TsupConfig): Options => {
  if (typeof config === "function") {
    throw new Error("Expected tsup config to resolve to an object.");
  }
  if (Array.isArray(config)) {
    const first: Options | undefined = config[0] as Options | undefined;
    if (first === undefined) {
      throw new Error("Expected tsup config array to have at least one entry.");
    }
    return first;
  }
  return config;
};

/**
 * Executes work from a temporary working directory and always restores cwd.
 * @param callback - callback run from temporary cwd
 * @returns callback result
 */
export function withTemporaryCwd<T>(callback: (tempDir: string) => T): T {
  const originalCwd = process.cwd();
  const tempDir = mkdtempSync(path.join(tmpdir(), "config-tsup-test-"));
  process.chdir(tempDir);

  try {
    return callback(tempDir);
  } finally {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Temporarily sets an env var value for the callback scope.
 * @param key - environment variable name
 * @param value - temporary value (undefined removes the key)
 * @param callback - callback run with temporary env
 * @returns callback result
 */
export function withEnvironmentVariable<T>(
  key: string,
  value: string | undefined,
  callback: () => T,
): T {
  const originalValue = process.env[key];

  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  try {
    return callback();
  } finally {
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}
