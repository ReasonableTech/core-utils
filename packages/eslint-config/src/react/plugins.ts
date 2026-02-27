import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import type { Linter } from "eslint";

/**
 * React plugin configurations for ESLint.
 *
 * This module provides pre-configured plugin setups for React development,
 * including the base React plugin and React Hooks plugin with appropriate
 * browser globals and settings.
 */

/**
 * Base React plugin configuration.
 *
 * Provides the core React ESLint plugin with browser and service worker
 * globals enabled for modern React applications.
 * @returns Array of ESLint configurations for React projects
 */
export const createReactPluginConfig = (): Linter.Config[] => {
  const reactConfig = reactPlugin.configs.flat.recommended as Linter.Config;

  return [
    reactConfig,
    {
      languageOptions: {
        ...reactConfig.languageOptions,
        globals: {
          ...globals.serviceworker,
          ...globals.browser,
        },
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  ];
};

/**
 * Combined React plugin configuration.
 *
 * Returns React plugin configurations.
 * @returns Array of ESLint configurations for React
 */
export const createCombinedReactPluginConfig = (): Linter.Config[] => {
  return createReactPluginConfig();
};
