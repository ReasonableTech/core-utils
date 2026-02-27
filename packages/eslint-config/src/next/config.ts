import path from "node:path";
import type { Linter } from "eslint";
import { createNextjsIgnoreConfig } from "./ignores.js";
import { createNextjsRulesConfig } from "./rules.js";
import { createNextjsSettingsConfig } from "./settings.js";
import { createSharedReactComponentFileConfig } from "../shared/react-rules.js";
import { createStrictBooleanExpressionsConfig } from "../shared/strict-rules.js";
import { loadNextjsConfigs } from "./plugins.js";

/**
 * Complete Next.js ESLint configuration builder.
 *
 * This module orchestrates all Next.js-specific ESLint configurations
 * including ignores, plugins, rules, and settings into a coherent
 * configuration array.
 */

/**
 * Creates the complete Next.js ESLint configuration.
 *
 * This function combines all Next.js-specific configurations and handles
 * the complex logic of plugin availability, fallbacks, and conditional
 * rule application.
 *
 * Configuration includes:
 * - Next.js ESLint plugins (core-web-vitals, TypeScript)
 * - TypeScript parser configuration for type-aware rules
 * - React and React Hooks plugin setup
 * - Next.js-optimized rules using shared React patterns
 * - File-specific rule overrides for React components
 * @param projectDir - The root directory of the Next.js project
 * @returns Array of ESLint configurations for Next.js projects
 */
export const createNextjsConfigs = (projectDir: string): Linter.Config[] => {
  const baseDir = path.isAbsolute(projectDir)
    ? projectDir
    : path.resolve(projectDir);

  const nextCompatConfigs = loadNextjsConfigs(baseDir);

  const configs: Linter.Config[] = [
    // Global ignores must be first - standardized Next.js ignore patterns
    createNextjsIgnoreConfig(),

    // Next.js base configurations (includes React, TypeScript plugins)
    ...nextCompatConfigs,

    // TypeScript parser options - REQUIRED for type-aware rules (exclude config files)
    {
      files: [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "instrumentation.ts", // Include instrumentation script
        "instrumentation-client.ts", // Include client instrumentation
        "sentry.*.config.ts", // Include Sentry config files
      ],
      ignores: ["**/*.config.*", "**/eslint.config.*", "!sentry.*.config.ts"],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: projectDir,
          ecmaFeatures: {
            jsx: true,
            globalReturn: true,
          },
          requireConfigFile: false,
          allowImportExportEverywhere: true,
        },
      },
    },

    // Settings configuration (React detection, Next.js root directory)
    createNextjsSettingsConfig(baseDir),

    // Rules configuration - React Hooks now handled by Next.js
    createNextjsRulesConfig(),

    // Strict boolean expressions rule (rules-only, no plugin conflicts)
    createStrictBooleanExpressionsConfig(baseDir),

    // File-specific configurations for React components (shared with React config)
    createSharedReactComponentFileConfig(),
  ].filter(Boolean); // Remove any undefined/null configs

  return configs;
};
