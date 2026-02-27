import { createSharedReactRules } from "../shared/react-rules.js";
import type { Linter } from "eslint";

/**
 * Rule configurations for Next.js projects.
 *
 * These rules leverage shared React rules while adding Next.js-specific
 * configurations and handling conditional plugin setups.
 */

/**
 * Next.js React rules using shared configurations.
 *
 * Uses shared React rules configured specifically for Next.js,
 * which includes built-in JSX transform support.
 */
export const nextjsReactRules = createSharedReactRules("nextjs");

/**
 * Additional Next.js-specific rules that don't apply to standalone React.
 *
 * These rules are specific to Next.js applications and their
 * particular patterns and optimizations.
 */
export const nextjsOnlyRules = {
  // Add any Next.js-only rules here if needed in the future
} as const satisfies Record<string, Linter.RuleEntry>;

/**
 * React Hooks rules removed - Next.js includes built-in hooks support
 */

/**
 * Combined Next.js rules.
 *
 * Merges shared React rules with Next.js-specific rules.
 */
export const allNextjsRules = {
  ...nextjsReactRules,
  ...nextjsOnlyRules,
} as const;

/**
 * Creates the main rules configuration for Next.js projects.
 *
 * Combines all rule categories. React Hooks rules are now provided
 * by Next.js built-in configuration.
 * @returns Combined rules configuration
 */
export const createNextjsRulesConfig = (): Linter.Config => ({
  rules: {
    ...allNextjsRules,
  },
});
