import type { Linter } from "eslint";
import { typeAwareRules } from "../shared-rules.js";

/**
 * Strict TypeScript rules that should be applied to all projects.
 *
 * This module provides rules-only configurations that can be safely
 * added to any ESLint setup without conflicting with existing plugins.
 * These rules ensure consistent type safety across all project types.
 */

/**
 * Creates a rules-only configuration for strict TypeScript checking.
 *
 * This configuration contains only rules and does not define any plugins,
 * making it safe to add to configurations that already have TypeScript
 * ESLint plugins configured (like Next.js configs).
 * @returns ESLint configuration with strict TypeScript rules
 */
export const createStrictTypeScriptRulesConfig = (): Linter.Config => ({
  rules: {
    // Include all type-aware rules from our base configuration
    ...typeAwareRules,
  },
});

/**
 * Creates a rules-only configuration for strict boolean expressions specifically.
 *
 * This is a focused configuration that only includes the strict-boolean-expressions
 * rule, which is often the most impactful rule for React/Next.js projects.
 * @param projectDir - The project directory for TypeScript parser configuration (required for type-aware rules)
 * @returns ESLint configuration with strict boolean expression rule and parser options
 */
export const createStrictBooleanExpressionsConfig = (
  projectDir: string,
): Linter.Config => ({
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: projectDir,
    },
  },
  rules: {
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      {
        // Require explicit boolean checks - critical for AI-generated code safety
        allowString: false, // Prevent truthy string checks
        allowNumber: false, // Prevent truthy number checks
        allowNullableObject: false, // Require explicit null checks
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
        allowAny: false, // Critical: prevent `any` in conditions
      },
    ],
  },
});
