import path from "node:path";
import type { Linter } from "eslint";

import { createTypeAwareBaseConfig } from "./base-configs.js";

// Re-export shared React component rules for use in root config
export { sharedReactComponentRules } from "./shared/react-rules.js";

/**
 * Creates a comprehensive type-aware ESLint configuration for TypeScript projects.
 *
 * This is the **mandatory base configuration** for all projects.
 * It provides essential TypeScript linting rules that ensure code quality, type safety,
 * and consistency across the entire monorepo.
 *
 * ## Key Features
 *
 * - **Type-aware analysis**: Leverages TypeScript's type checker for advanced linting
 * - **Strict type safety**: Enforces patterns that prevent runtime type errors
 * - **AI code compatibility**: Optimized for AI-generated code validation
 * - **Monorepo consistency**: Standardized rules across all packages
 * - **Performance optimized**: Configured for fast incremental type checking
 *
 * ## Usage Patterns
 *
 * **Standalone TypeScript projects:**
 * ```typescript
 * import { createTypeAwareConfig } from "@reasonabletech/eslint-config";
 * export default createTypeAwareConfig(import.meta.dirname);
 * ```
 *
 * **Extended configurations:**
 * ```typescript
 * import { createTypeAwareConfig } from "@reasonabletech/eslint-config";
 * import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";
 *
 * // React config automatically extends this base config
 * export default createTypeAwareReactConfig(import.meta.dirname);
 * ```
 *
 * ## Configuration Details
 *
 * The configuration includes:
 * - TypeScript ESLint parser with type information
 * - Recommended TypeScript ESLint rules
 * - JSDoc documentation requirements
 * - Import/export validation
 * - Strict null checks and type assertions
 * - Performance-optimized type checking
 * @param projectDir - The absolute path to the directory containing the TypeScript project.
 *                     This is used for TypeScript's project service and type checking.
 * @returns A complete ESLint configuration array optimized for TypeScript development
 * @see {@link https://typescript-eslint.io/getting-started | TypeScript ESLint Documentation}
 * @see {@link ../../README.md | Package README} for complete usage examples
 * @example
 * ```typescript
 * // Basic usage in eslint.config.mjs
 * import { createTypeAwareConfig } from "@reasonabletech/eslint-config";
 *
 * export default createTypeAwareConfig(import.meta.dirname);
 * ```
 * @example
 * ```typescript
 * // Extending with custom rules
 * import { createTypeAwareConfig } from "@reasonabletech/eslint-config";
 *
 * export default [
 *   ...createTypeAwareConfig(import.meta.dirname),
 *   {
 *     rules: {
 *       // Project-specific overrides
 *       "@typescript-eslint/no-unused-vars": "warn",
 *     },
 *   },
 * ];
 * ```
 */
export function createTypeAwareConfig(projectDir: string): Linter.Config[] {
  const baseDir = path.isAbsolute(projectDir)
    ? projectDir
    : path.resolve(projectDir);

  return createTypeAwareBaseConfig(baseDir);
}
