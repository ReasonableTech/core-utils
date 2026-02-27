import { createTypeAwareConfig } from "./index.js";
import { createReactConfigs } from "./react/config.js";
import type { Linter } from "eslint";

/**
 * Creates a type-aware ESLint configuration for React projects.
 *
 * This configuration extends the base TypeScript configuration with React-specific
 * rules, plugins, and optimizations. It provides a comprehensive setup for modern
 * React development with TypeScript.
 *
 * Key features:
 * - Browser and service worker globals
 * - React hooks validation with exhaustive dependencies
 * - TypeScript rule overrides for React patterns
 * - JSDoc requirement exemptions for React components
 * - Modern JSX transform support (no React import required)
 * @param projectDir - The directory containing the TypeScript project
 * @returns A comprehensive type-aware ESLint configuration for React
 * @example
 * ```typescript
 * // In your eslint.config.mjs
 * import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";
 * 
 * export default createTypeAwareReactConfig(import.meta.dirname);
 * ```
 */
export function createTypeAwareReactConfig(
  projectDir: string,
): Linter.Config[] {
  return [
    // Base TypeScript configuration with type-aware rules
    ...createTypeAwareConfig(projectDir),
    
    // React-specific configurations (plugins, rules, file overrides)
    ...createReactConfigs(),
  ] as Linter.Config[];
}

export default createTypeAwareReactConfig;
