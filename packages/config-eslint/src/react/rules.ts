import { createSharedReactRules } from "../shared/react-rules.js";
import type { Linter } from "eslint";

/**
 * React-specific ESLint rules for standalone React projects.
 * 
 * This module provides rules specifically tailored for React projects
 * that are not using Next.js. It leverages shared React rules while
 * adding React-specific configurations.
 */

/**
 * Complete React rules configuration for standalone React projects.
 * 
 * Uses shared React rules configured for modern React development
 * with the new JSX transform.
 */
export const reactRules = createSharedReactRules("react");

/**
 * Additional React-specific rules that don't apply to Next.js.
 * 
 * These rules are specific to standalone React applications and
 * may not be appropriate or necessary for Next.js projects.
 */
export const reactOnlyRules = {
  // Add any React-only rules here if needed in the future
} as const satisfies Record<string, Linter.RuleEntry>;

/**
 * Combined React rules for standalone React projects.
 * 
 * Merges shared React rules with React-only rules to create
 * a complete rule set for React projects.
 */
export const allReactRules = {
  ...reactRules,
  ...reactOnlyRules,
} as const;
