import type { Linter } from "eslint";
import { createCombinedReactPluginConfig } from "./plugins.js";
import { allReactRules } from "./rules.js";
import { createSharedReactComponentFileConfig } from "../shared/react-rules.js";

/**
 * Configuration builders for React projects.
 * 
 * This module combines React plugins, rules, and file-specific
 * configurations into complete ESLint configurations.
 */

/**
 * Base React rules configuration.
 * 
 * Applies all React rules (shared and React-specific) to the
 * ESLint configuration.
 * @returns ESLint configuration object with React rules
 */
export const createReactRulesConfig = (): Linter.Config => ({
  rules: {
    ...allReactRules,
  },
});

/**
 * Complete React configuration builder.
 * 
 * Combines all React-specific configurations including plugins,
 * rules, and file-specific overrides into a comprehensive
 * configuration array.
 * 
 * Configuration includes:
 * - React and React Hooks plugins with browser globals
 * - All React rules (core, hooks, TypeScript overrides)
 * - JSDoc rule exemptions for React component files
 * @returns Array of ESLint configurations for React projects
 */
export const createReactConfigs = (): Linter.Config[] => [
  ...createCombinedReactPluginConfig(),
  createReactRulesConfig(),
  createSharedReactComponentFileConfig(),
];