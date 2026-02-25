/**
 * Workspace utility functions for discovering monorepo structure
 *
 * These are extracted from global-setup.ts so they can be reused by
 * the Vitest config factories (e.g. auto self-package aliasing).
 * @module @reasonabletech/config-vitest/workspace
 */

import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

/**
 * Walks up the directory tree from `startDir` until it finds a directory
 * containing `pnpm-workspace.yaml`, which marks the monorepo root.
 *
 * Returns `startDir` unchanged if no workspace root is found (e.g. when
 * running outside the monorepo).
 * @param startDir - The directory to start searching from
 * @returns The absolute path to the monorepo root, or `startDir` if not found
 */
export function findRepoRoot(startDir: string): string {
  let currentDir = startDir;
  for (;;) {
    if (existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

/**
 * Reads the `name` field from the `package.json` in the given directory.
 *
 * Returns `null` when:
 * - No `package.json` exists at `packageDir`
 * - The file cannot be parsed as JSON
 * - The `name` field is missing, empty, or not a string
 * @param packageDir - The directory containing the package.json to read
 * @returns The package name string, or `null` if unavailable
 */
export function readPackageName(packageDir: string): string | null {
  const packageJsonPath = path.join(packageDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
      name?: unknown;
    };
    return typeof parsed.name === "string" && parsed.name.length > 0
      ? parsed.name
      : null;
  } catch {
    return null;
  }
}
