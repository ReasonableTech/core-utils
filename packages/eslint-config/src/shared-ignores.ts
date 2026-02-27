/**
 * Shared ignore patterns for ESLint configurations
 *
 * This module defines the standard ignore patterns used across all ESLint
 * configurations in the monorepo to ensure consistent behavior
 * and avoid linting generated files, build outputs, and dependencies.
 */

/**
 * Standard ignore patterns for all ESLint configurations.
 *
 * These patterns exclude common build outputs, generated files,
 * and dependencies that should not be linted.
 */
export const sharedIgnores: string[] = [
  // Build outputs
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/coverage/**",

  // Dependencies
  "**/node_modules/**",

  // Generated files
  "**/*.generated.*",
  "**/*.d.ts",
  "**/*.d.ts.map",
  "**/*.js",
  "**/*.mts",
  "**/generated/**",
  "**/schema.ts",
  "**/types/generated/**",
  "**/.webpack/**",

  // Config files that don't need linting
  "**/tsconfig*.json",
  "**/package.json",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/*.config.*",
  "**/vitest.config.*",
  "**/vite.config.*",
  "**/eslint.config.*",
  "**/postcss.config.*",
  "**/next.config.*",
  "**/webpack.config.*",
  "**/tsup.config.*",
  "**/vitest.setup.ts",

  // IDE and editor files
  "**/.vscode/**",
  "**/.idea/**",
  "**/*.log",

  // Test outputs
  "**/test-results/**",
  "**/playwright-report/**",

  // Platform-specific outputs
  "**/.expo/**",
  "**/.vercel/**",
  "**/.netlify/**",

  // Cache directories
  "**/.turbo/**",
  "**/.cache/**",
  "**/tmp/**",
  "**/temp/**",

  // Examples and documentation code
  "**/examples/**",
];
