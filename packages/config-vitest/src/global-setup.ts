import { spawnSync } from "node:child_process";
import { findRepoRoot, readPackageName } from "./workspace.js";

/**
 * Builds the pnpm + turbo CLI arguments needed to build all upstream
 * workspace dependencies of the given package.
 * @param packageName - The package name (e.g. `@reasonabletech/utils`)
 * @returns An array of CLI arguments for `spawnSync("pnpm", ...)`
 */
export function getTurboBuildArgs(packageName: string): readonly string[] {
  return [
    "-w",
    "turbo",
    "run",
    "build",
    `--filter=${packageName}^...`,
  ] as const;
}

/**
 * Vitest global setup that builds workspace dependencies before tests run.
 *
 * Skipped when `RT_VITEST_SKIP_DEP_BUILD=true` is set or when
 * a parent build is already in progress (re-entrancy guard).
 */
export default function globalSetup(): void {
  if (process.env.RT_VITEST_SKIP_DEP_BUILD === "true") {
    return;
  }

  if (process.env.RT_VITEST_DEP_BUILD_RUNNING === "true") {
    return;
  }

  const packageDir = process.cwd();
  const packageName = readPackageName(packageDir);
  if (packageName === null) {
    return;
  }

  const repoRoot = findRepoRoot(packageDir);
  const args = getTurboBuildArgs(packageName);

  const result = spawnSync("pnpm", args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      RT_VITEST_DEP_BUILD_RUNNING: "true",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `Failed to build workspace dependencies (exit code: ${result.status ?? "unknown"})`,
    );
  }
}
