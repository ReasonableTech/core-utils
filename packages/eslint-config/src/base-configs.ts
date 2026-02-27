/**
 * Base ESLint Configuration Builders - Foundation for consistent linting across the monorepo
 *
 * This module provides the core configuration builders used to create consistent ESLint
 * configurations across all projects in the monorepo. It combines shared rules,
 * ignore patterns, and TypeScript configurations into reusable base configurations
 * that ensure consistency while reducing code duplication.
 *
 * The implementation follows several architectural principles:
 * - Centralized base configuration to ensure consistency across all projects
 * - Separation of concerns between basic and type-aware configurations
 * - Modular composition using shared rules and ignore patterns
 * - TypeScript-first approach with comprehensive type checking capabilities
 * - Extensible design that supports framework-specific customizations
 * Base ESLint configuration builders for the monorepo
 * @author ReasonableTech Team
 * @since 0.1.0
 */

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import { configs as tsConfigs } from "typescript-eslint";
import type { Linter } from "eslint";

import { reasonableTechPlugin } from "./plugin.js";
import { sharedIgnores } from "./shared-ignores.js";
import { baseRules, typeAwareRules } from "./shared-rules.js";
import { createPlatformRulePreset } from "./custom-rules/index.js";
import { createNoTypeofInExpectRules } from "./custom-rules/test-quality.js";

/**
 * Creates a comprehensive type-aware ESLint configuration with TypeScript project analysis.
 *
 * This function generates the recommended ESLint configuration for all projects.
 * It includes all base rules plus advanced type-aware rules that leverage TypeScript's
 * type system to catch subtle bugs, unsafe operations, and logical inconsistencies
 * that would be missed by syntax-only analysis. This is essential for AI-generated
 * code safety and maintaining high code quality standards.
 *
 * The configuration includes:
 * - JavaScript and TypeScript recommended rules
 * - Prettier compatibility layer
 * - TypeScript type-aware analysis rules
 * - Comprehensive ignore patterns for build outputs and generated files
 * - Strict type safety rules optimized for AI-generated code
 * @param projectDir - The absolute path to the directory containing the TypeScript project.
 *                     This is used to configure TypeScript's project references for type checking.
 * @returns Array of ESLint configuration objects with full type-aware analysis enabled
 * @example
 * ```typescript
 * import { createTypeAwareBaseConfig } from './base-configs.js';
 *
 * // For a standard project
 * const config = createTypeAwareBaseConfig(import.meta.dirname);
 *
 * // For framework-specific projects, extend the base
 * const reactConfig = [
 *   ...createTypeAwareBaseConfig(import.meta.dirname),
 *   // React-specific configurations
 * ];
 * ```
 */
export function createTypeAwareBaseConfig(projectDir: string): Linter.Config[] {
  return [
    js.configs.recommended,
    eslintConfigPrettier,
    jsdoc.configs["flat/recommended-typescript"],
    ...tsConfigs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          // projectService auto-discovers the correct tsconfig for each file and
          // creates in-memory projects for files outside any tsconfig. This
          // eliminates the need for separate .tsconfig.typeaware-tests.json files
          // and the RT_ESLINT_PROJECT env var override.
          projectService: true,
          tsconfigRootDir: projectDir,
        },
      },
    },
    {
      plugins: {
        "@reasonabletech": reasonableTechPlugin,
      },
    },
    {
      // Report unused ESLint disable directives across all projects
      linterOptions: {
        reportUnusedDisableDirectives: "error",
      },
    },
    {
      ignores: [...sharedIgnores, "**/*.mjs", "**/vitest.config.mts"],
    },
    {
      rules: {
        ...baseRules,
        ...typeAwareRules,
        ...createPlatformRulePreset(),
      },
    },
    {
      // Test-quality rules applied specifically to test files.
      // These ban low-value patterns that AI agents use to inflate coverage
      // without verifying real behaviour.
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/tests/**/*.ts",
        "**/tests/**/*.tsx",
      ],
      rules: createNoTypeofInExpectRules(),
    },
  ] as Linter.Config[];
}
