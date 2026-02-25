import path from "node:path";
import { createRequire } from "node:module";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import type { Linter } from "eslint";
import { removeProjectParserOption } from "../shared/parser-options.js";
import { stripPluginConfigs } from "../shared/plugin-utils.js";

/**
 * Next.js plugin configurations and integrations.
 *
 * This module handles the complex setup of Next.js ESLint plugins,
 * including React integration and Next.js-specific configurations
 * using FlatCompat for legacy plugin support.
 */

/**
 * Attempts to load Next.js ESLint configurations.
 *
 * Uses eslint-config-next flat configs directly to avoid legacy
 * compatibility shims. Gracefully handles cases where Next.js
 * ESLint configs are not available.
 * @param projectDir - The project directory for FlatCompat context
 * @returns Array of Next.js ESLint configurations, or empty array if unavailable
 */
export const loadNextjsConfigs = (projectDir: string): Linter.Config[] => {
  const baseDir = path.isAbsolute(projectDir)
    ? projectDir
    : path.resolve(projectDir);

  try {
    const requireFromBase = createRequire(path.join(baseDir, "package.json"));
    const nextCoreWebVitals: unknown = requireFromBase(
      "eslint-config-next/core-web-vitals",
    );
    const nextTypescript: unknown = requireFromBase(
      "eslint-config-next/typescript",
    );

    const nextCoreWebVitalsConfigs = assertConfigArray(
      nextCoreWebVitals,
      "core-web-vitals",
    );
    const nextTypescriptConfigs = assertConfigArray(
      nextTypescript,
      "typescript",
    );

    return [...nextCoreWebVitalsConfigs, ...nextTypescriptConfigs].map(
      removeProjectParserOption,
    );
  } catch (error) {
    console.warn(
      "Next.js ESLint config not available, using base React setup",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
};

const isConfigArray = (value: unknown): value is Linter.Config[] =>
  Array.isArray(value) &&
  value.every((entry) => typeof entry === "object" && entry !== null);

const assertConfigArray = (value: unknown, label: string): Linter.Config[] => {
  if (!isConfigArray(value)) {
    throw new Error(
      `eslint-config-next must provide flat config arrays (v16+). Missing ${label}.`,
    );
  }
  return value;
};

/**
 * Creates React plugin configuration for Next.js projects.
 *
 * This is used as fallback when Next.js configs are not available,
 * providing the necessary React setup for Next.js development.
 *
 * Note: We manually construct the config to avoid circular references
 * that exist in reactPlugin.configs.flat.recommended (which contains
 * plugins.react pointing back to itself, causing JSON serialization errors).
 * @returns Array of ESLint configurations for React in Next.js projects
 */
export const createReactPluginForNextjs = (): Linter.Config[] => {
  const recommendedConfig = reactPlugin.configs.flat
    .recommended as Linter.Config;

  // Extract rules and settings without the circular plugin reference
  // Only include settings if it exists and is an object (ESLint requirement)
  const baseConfig: Linter.Config = {
    plugins: {
      react: stripPluginConfigs(reactPlugin),
    },
    rules: recommendedConfig.rules,
    languageOptions: {
      ...recommendedConfig.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  };

  // Conditionally add settings only if present
  if (
    recommendedConfig.settings !== undefined &&
    typeof recommendedConfig.settings === "object"
  ) {
    baseConfig.settings = recommendedConfig.settings;
  }

  return [baseConfig];
};

/**
 * Creates the complete plugin configuration for Next.js projects.
 *
 * Attempts to load Next.js configs first, falling back to React
 * configurations if Next.js plugins are unavailable.
 * @param projectDir - The project directory for configuration context
 * @returns Object containing Next.js configs and whether fallback is needed
 */
export const createNextjsPluginConfig = (
  projectDir: string,
): {
  nextConfigs: Linter.Config[];
  fallbackConfigs: Linter.Config[];
  usesFallback: boolean;
} => {
  const nextConfigs = loadNextjsConfigs(projectDir);
  const usesFallback = nextConfigs.length === 0;

  const fallbackConfigs = usesFallback ? createReactPluginForNextjs() : [];

  return {
    nextConfigs,
    fallbackConfigs,
    usesFallback,
  };
};
