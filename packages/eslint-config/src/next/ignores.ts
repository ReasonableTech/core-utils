import type { Linter } from "eslint";

/**
 * Next.js-specific ignore patterns for ESLint.
 *
 * These patterns exclude files and directories that should not be linted
 * in Next.js projects, including generated files, build outputs, and
 * configuration files that don't need linting.
 */

/**
 * Generated files and build outputs that Next.js creates.
 */
export const nextjsBuildIgnores = [
  ".next/**",
  "out/**",
  "dist/**",
  "build/**",
  "generated/**",
  "next-env.d.ts",
  "next.config.*",
] as const;

/**
 * Test files and testing configuration.
 */
export const testFileIgnores = [
  "tests/**/*",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "vitest.config.*",
  "playwright.config.*",
  "playwright.ci.config.*", // CI-specific playwright configs
  "playwright-report/**",
  "test-results/**",
] as const;

/**
 * Configuration files that don't need linting.
 */
export const configFileIgnores = [
  "eslint.config.*", // ESLint configuration files
  "postcss.config.*",
  "tailwind.config.*",
  "**/*.config.mts",
  "**/*.stories.ts",
  "**/*.stories.tsx",
] as const;

/**
 * Next.js application-specific ignores.
 */
export const nextjsAppIgnores = ["app/.well-known/**/*"] as const;

/**
 * Complete list of all ignore patterns for Next.js projects.
 */
export const allNextjsIgnores = [
  ...nextjsBuildIgnores,
  ...testFileIgnores,
  ...configFileIgnores,
  ...nextjsAppIgnores,
] as const;

/**
 * Creates the ignore configuration for Next.js projects.
 *
 * This configuration must be first in the ESLint config array
 * and should only contain ignore patterns.
 * @returns ESLint configuration object with ignore patterns for Next.js
 */
export const createNextjsIgnoreConfig = (): Linter.Config => ({
  ignores: [...allNextjsIgnores],
});
