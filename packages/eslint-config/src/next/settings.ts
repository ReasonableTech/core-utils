import type { Linter } from "eslint";

/**
 * Settings and configuration objects for Next.js projects.
 * 
 * This module provides settings that configure how ESLint plugins
 * and rules behave in Next.js project contexts.
 */

/**
 * React-specific settings for Next.js projects.
 * 
 * Configures the React ESLint plugin to automatically detect
 * the React version being used.
 */
export const nextjsReactSettings = {
  react: { 
    version: "detect" 
  },
} as const;

/**
 * Next.js-specific settings.
 *
 * Configures Next.js ESLint plugins with the project root directory
 * for proper context resolution.
 * @param projectDir - The root directory of the Next.js project
 * @returns ESLint settings object configured for Next.js projects
 */
export const createNextjsSettings = (projectDir: string) => ({
  next: {
    rootDir: projectDir,
  },
}) as const;

/**
 * Creates the complete settings configuration for Next.js projects.
 *
 * Combines React and Next.js settings into a single configuration
 * object for easy application.
 * @param projectDir - The root directory of the Next.js project
 * @returns Combined settings configuration
 */
export const createNextjsSettingsConfig = (projectDir: string): Linter.Config => ({
  settings: {
    ...nextjsReactSettings,
    ...createNextjsSettings(projectDir),
  },
});