/**
 * React-specific Vitest configuration
 * @module @reasonabletech/config-vitest/react
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  defaultClientConditions,
  defaultServerConditions,
  type PluginOption,
} from "vite";
import { defineConfig } from "vitest/config";
import type { InlineConfig } from "vitest/node";
import react from "@vitejs/plugin-react";
import { baseConfig, type DeepReadonly } from "./index.js";
import { readPackageName } from "./workspace.js";

type VitestConfig = DeepReadonly<{
  test?: InlineConfig;
  resolve?: {
    alias?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}>;

// Empty readonly config and plugins array for default parameters
const EMPTY_CONFIG = {} as const satisfies VitestConfig;
const EMPTY_PLUGINS = [] as const satisfies readonly PluginOption[];

/**
 * Generates resolve aliases mapping a package's own name to its source directory.
 * @param projectDir - Absolute path to the project directory
 * @returns A record mapping the package name to its `src/` directory
 * @see index.ts for the equivalent function used in the base config
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

/**
 * React-specific configuration options
 */
export const reactConfig = {
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Suppress vitest's unhandled error reporting for expected test errors
    silent: false,
    onConsoleLog: (): boolean | undefined => {
      // Allow packages to customize console filtering in their own config
      return undefined;
    },
  },
};

/** @overload */
/**
 * Creates a Vitest configuration for React-based packages.
 * @param projectDirOrConfig - Either the absolute project directory or an existing configuration to merge.
 * @param customConfig - Additional configuration options for the project-dir overload.
 * @returns A Vitest configuration optimized for React components.
 */
export function createReactConfig(
  projectDirOrConfig?: string | VitestConfig,
  customConfig?: VitestConfig,
): ReturnType<typeof defineConfig> {
  // Handle overloaded parameters
  let projectDir: string | undefined;
  let config: VitestConfig;

  if (typeof projectDirOrConfig === "string") {
    projectDir = projectDirOrConfig;
    config = customConfig ?? ({} as const);
  } else {
    projectDir = undefined;
    config = projectDirOrConfig ?? ({} as const);
  }

  if (projectDir !== undefined) {
    return createReactConfigWithPlugins([react()], projectDir, config);
  }
  return createReactConfigWithPlugins([react()], config);
}

/** @overload */
/**
 * Creates a Vitest configuration for React-based packages with plugins.
 * @param plugins - Array of Vite plugins to include.
 * @param projectDirOrConfig - Either the absolute project directory or an existing configuration to merge.
 * @param customConfig - Additional configuration options for the project-dir overload.
 * @returns A Vitest configuration optimized for React components with plugins.
 */
export function createReactConfigWithPlugins(
  plugins: readonly PluginOption[] = EMPTY_PLUGINS,
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
    plugins: [...plugins],
    ...baseConfig,
    ...reactConfig,
    ...config,
    test: {
      ...baseConfig.test,
      ...reactConfig.test,
      // Auto-detect setupFiles if not explicitly provided
      ...(autoSetupFiles.length > 0 && { setupFiles: autoSetupFiles }),
      // Auto-detect include patterns if not explicitly provided
      ...(autoIncludePatterns.length > 0 && { include: autoIncludePatterns }),
      ...config.test,
      coverage: {
        ...baseConfig.test.coverage,
        ...config.test?.coverage,
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
          "**/.next/**",
          "**/vitest.setup.ts",
          "**/types.ts",
        ],
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
      // Deduplicate React to prevent multiple-instance issues in tests.
      // This is Vite's standard API for singleton enforcement — no filesystem
      // paths needed, Vite resolves from the project root automatically.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      alias: {
        // Auto-generate self-package alias
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
    ssr: {
      resolve: {
        conditions: ["source", ...defaultServerConditions],
        externalConditions: ["source"],
      },
    },
  });
}

export default createReactConfig;
