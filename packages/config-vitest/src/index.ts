/**
 * Base Vitest configuration for all packages
 * @module @reasonabletech/config-vitest
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { defaultClientConditions, defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";
import type { InlineConfig } from "vitest/node";
import { readPackageName } from "./workspace.js";

/** Recursively makes all properties of T readonly */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends Array<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

/**
 * Immutable configuration object accepted by {@link createVitestConfig} and
 * related helpers.
 */
export type VitestConfig = DeepReadonly<{
  test?: InlineConfig;
  resolve?: {
    conditions?: string[];
    alias?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}>;

// Empty readonly config for default parameters
const EMPTY_CONFIG = {} as const satisfies VitestConfig;

/**
 * Base configuration options that apply to all test environments
 */
export const baseConfig = {
  test: {
    testTimeout: 10000, // 10 seconds default timeout
    hookTimeout: 10000, // 10 seconds for setup/teardown hooks
    coverage: {
      provider: "v8" as const,
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./generated/test-coverage",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/tests/**",
        "**/*.d.ts",
        "**/*.config.{js,ts,mjs,mts}",
        "**/coverage/**",
        "**/examples/**",
        "**/src/index.ts",
        "**/src/*/index.ts",
        "**/src/types/**",
        "tsup.config.ts",
        "vitest.config.mts",
        "tailwind.config.mjs",
        "**/vitest.setup.ts",
      ],
      thresholds:
        process.env.VITEST_COVERAGE_THRESHOLDS_DISABLED === "true"
          ? {
              lines: 0,
              functions: 0,
              branches: 0,
              statements: 0,
            }
          : {
              lines: 100,
              functions: 100,
              branches: 100,
              statements: 100,
            },
    },
  },
};

/**
 * Generates resolve aliases that map a package's own name back to its source
 * directory. This allows test files to `import { foo } from "@reasonabletech/my-pkg"`
 * and have Vite resolve it to the local `src/` tree instead of requiring a prior
 * build step.
 *
 * Placed before user-supplied aliases so consumers can override if needed.
 * @param projectDir - Absolute path to the project directory
 * @returns A record mapping the package name to its `src/` directory
 */
function generateSelfPackageAliases(
  projectDir: string,
): Record<string, string> {
  const packageName = readPackageName(projectDir);
  if (packageName === null) {
    return {};
  }
  return {
    [packageName]: `${projectDir}/src`,
  };
}

/**
 * Auto-detects setup files in a project directory
 * @param projectDir - The project directory path
 * @returns Array of detected setup file paths
 */
function autoDetectSetupFiles(projectDir?: string): string[] {
  if (projectDir === undefined || projectDir === "") {
    return [];
  }

  const vitestSetupPath = join(projectDir, "vitest.setup.ts");
  if (existsSync(vitestSetupPath)) {
    return ["./vitest.setup.ts"];
  }

  const testsSetupPath = join(projectDir, "tests/setup.ts");
  if (existsSync(testsSetupPath)) {
    return ["./tests/setup.ts"];
  }

  return [];
}

/**
 * Auto-detects test include patterns based on project structure
 * @returns Array of include patterns
 */
function autoDetectIncludePatterns(): string[] {
  return ["tests/**/*.test.{ts,tsx,js,jsx}"];
}

/** @overload */
/**
 * Creates a merged configuration from the base and any custom options.
 * @param projectDirOrConfig - Either the absolute project directory (use `import.meta.dirname`) or a prebuilt config.
 * @param customConfig - Additional configuration to merge when a project directory is provided.
 * @returns A merged Vitest configuration tailored for the caller.
 */
export function createVitestConfig(
  projectDirOrConfig?: string | VitestConfig,
  customConfig?: VitestConfig,
): ReturnType<typeof defineConfig> {
  // Handle overloaded parameters
  let projectDir: string | undefined;
  let config: VitestConfig;

  if (typeof projectDirOrConfig === "string") {
    projectDir = projectDirOrConfig;
    config = customConfig ?? EMPTY_CONFIG;
  } else {
    projectDir = undefined;
    config = projectDirOrConfig ?? EMPTY_CONFIG;
  }

  // Auto-detect configuration if not explicitly provided
  const autoSetupFiles =
    config.test?.setupFiles !== undefined && config.test.setupFiles.length > 0
      ? []
      : autoDetectSetupFiles(projectDir);
  const autoIncludePatterns =
    config.test?.include !== undefined && config.test.include.length > 0
      ? []
      : autoDetectIncludePatterns();

  return defineConfig({
    ...baseConfig,
    ...config,
    test: {
      ...baseConfig.test,
      // Auto-detect setupFiles if not explicitly provided
      ...(autoSetupFiles.length > 0 && { setupFiles: autoSetupFiles }),
      // Auto-detect include patterns if not explicitly provided
      ...(autoIncludePatterns.length > 0 && { include: autoIncludePatterns }),
      ...config.test,
      coverage: {
        ...baseConfig.test.coverage,
        ...config.test?.coverage,
      },
    },
    resolve: {
      // Prefer "source" condition in package.json exports, allowing
      // Vitest to resolve workspace dependencies directly to TypeScript source
      // files without requiring a prior build step.
      //
      // Since Vite 6, resolve.conditions REPLACES the defaults instead of
      // extending them. We must include defaultClientConditions to preserve
      // standard conditions like "module", "browser", "development|production".
      conditions: ["source", ...defaultClientConditions],
      alias: {
        // Work around packages whose "module" entry is bundler-oriented but not
        // directly Node.js ESM-resolvable in Vitest (e.g. extensionless internal
        // specifiers). Prefer the Node/CJS build for tests.
        "@opentelemetry/api": "@opentelemetry/api/build/src/index.js",
        // Auto-generate self-package alias (e.g. "@reasonabletech/utils" → "./src")
        ...(projectDir !== undefined &&
          projectDir !== "" &&
          generateSelfPackageAliases(projectDir)),
        // Standard "@" → src alias
        ...(projectDir !== undefined &&
          projectDir !== "" && { "@": `${projectDir}/src` }),
        // Consumer-provided aliases override everything above
        ...config.resolve?.alias,
      },
      ...config.resolve,
    },
    // Vitest runs in Vite's SSR mode. Since Vite 6, ssr.resolve.conditions is
    // independent from resolve.conditions and defaults to defaultServerConditions.
    // We must explicitly include "source" in ssr.resolve.conditions so
    // workspace dependencies resolve to TypeScript source during test execution.
    // Additionally, ssr.resolve.externalConditions passes "source" to
    // Node.js when it natively resolves externalized packages.
    //
    // Note: We intentionally omit the "module" export condition for SSR tests.
    // Some third-party packages expose a "module" build that is bundler-friendly
    // but not directly Node.js ESM-resolvable (for example: extensionless internal
    // specifiers). For tests, preferring Node-compatible ("node"/"default") entry
    // points avoids runtime import failures.
    ssr: {
      resolve: {
        conditions: [
          "source",
          ...defaultServerConditions.filter(
            (condition) => condition !== "module",
          ),
        ],
        externalConditions: ["source"],
      },
    },
  });
}

/** @overload */
/**
 * Creates a configuration with extended timeouts for long-running tests.
 * @param projectDirOrConfig - Either the absolute project directory or an existing configuration to extend.
 * @param customConfig - Additional configuration to merge when a project directory is supplied.
 * @returns A Vitest configuration suited for long-running suites.
 */
export function createLongRunningTestConfig(
  projectDirOrConfig?: string | VitestConfig,
  customConfig?: VitestConfig,
): ReturnType<typeof defineConfig> {
  // Handle overloaded parameters
  let projectDir: string | undefined;
  let config: VitestConfig;

  if (typeof projectDirOrConfig === "string") {
    projectDir = projectDirOrConfig;
    config = customConfig ?? EMPTY_CONFIG;
  } else {
    projectDir = undefined;
    config = projectDirOrConfig ?? EMPTY_CONFIG;
  }

  const longRunningConfig: VitestConfig = {
    ...config,
    test: {
      testTimeout: 30000, // 30 seconds for long-running tests
      hookTimeout: 30000, // 30 seconds for setup/teardown hooks
      ...config.test,
    },
  };

  if (projectDir !== undefined) {
    return createVitestConfig(projectDir, longRunningConfig);
  }
  return createVitestConfig(longRunningConfig);
}

// Re-export for convenience
export { createReactConfig, createReactConfigWithPlugins } from "./react.js";

export default createVitestConfig;
