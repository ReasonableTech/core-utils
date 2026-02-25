import type { Linter } from "eslint";

/**
 * Shared React ESLint rules used across both React and Next.js configurations.
 *
 * This module provides reusable rule configurations that are common between
 * standalone React projects and Next.js projects, reducing duplication and
 * ensuring consistency across project types.
 */

/**
 * Core React rules that apply to all React-based projects.
 *
 * These rules enforce modern React best practices and are suitable
 * for both standalone React applications and Next.js applications.
 */
export const sharedReactCoreRules = {
  "react/no-unescaped-entities": "error", // Prevent HTML entity issues
} as const satisfies Record<string, Linter.RuleEntry>;

/**
 * React JSX scope rules with framework-specific variations.
 *
 * The JSX scope rule behavior differs between standalone React and Next.js:
 * - Next.js: Always off (built-in JSX transform)
 * - React: Off for modern setups with new JSX transform
 */
export const reactJSXScopeRules = {
  /** For Next.js projects where JSX transform is built-in */
  nextjs: {
    "react/react-in-jsx-scope": "off",
  },

  /** For modern React projects with new JSX transform */
  modern: {
    "react/react-in-jsx-scope": "off",
  },
} as const satisfies Record<string, Record<string, Linter.RuleEntry>>;

/**
 * TypeScript rule overrides for React development.
 *
 * These overrides disable specific TypeScript rules that conflict with
 * React patterns while maintaining strict type safety standards.
 * The same overrides apply to both React and Next.js projects.
 *
 * NOTE: strict-boolean-expressions is NOT disabled for React - we enforce
 * explicit boolean checks even in conditional rendering to prevent bugs
 * and maintain consistent architecture across the platform.
 */
export const sharedReactTypeScriptRules = {
  "@typescript-eslint/prefer-readonly-parameter-types": "off", // Too restrictive for React props
  "@typescript-eslint/require-await": "off", // React event handlers often don't need await
  "@typescript-eslint/unbound-method": "off", // Known issue with React event handlers
} as const satisfies Record<string, Linter.RuleEntry>;

/**
 * Rules for React component files.
 *
 * React components often have obvious return types (React.JSX.Element) and
 * don't need explicit return type annotations or `@returns` documentation.
 * This applies to both React and Next.js projects.
 *
 * Additionally, React components use destructured props with well-documented
 * Props interfaces. ESLint's jsdoc plugin options are configured to skip
 * destructured parameter documentation:
 * - `checkDestructured: false` - don't require `@param` for individual properties
 * - `checkDestructuredRoots: false` - don't require `@param` for the root parameter
 *
 * This prevents conflicts with TypeDoc which warns about unused `@param` tags
 * when Props interfaces already document the properties.
 */
export const sharedReactComponentRules = {
  // Disable explicit return types for React components - JSX.Element is obvious
  // Note: This is applied via file-specific overrides in createSharedReactComponentFileConfig
  // JSDoc return documentation not needed with explicit TypeScript types
  "jsdoc/require-returns": "off",
  "jsdoc/require-returns-description": "off",
  // Disable requiring @param for destructured props - Props interfaces document these
  // checkDestructuredRoots: false prevents the "Missing @param root0" warning
  "jsdoc/require-param": [
    "warn",
    { checkDestructured: false, checkDestructuredRoots: false },
  ],
  // check-param-names only supports checkDestructured (not checkDestructuredRoots)
  "jsdoc/check-param-names": ["warn", { checkDestructured: false }],
} as const satisfies Record<string, Linter.RuleEntry>;

/**
 * Creates a complete React rules configuration for a specific framework.
 *
 * Combines all shared React rules with framework-specific JSX scope rules
 * to create a comprehensive rule set.
 * @param framework - The target framework ("react" or "nextjs")
 * @returns Combined React rules configuration
 */
export const createSharedReactRules = (
  framework: "react" | "nextjs",
): Record<string, Linter.RuleEntry> => ({
  ...sharedReactCoreRules,
  ...(framework === "nextjs"
    ? reactJSXScopeRules.nextjs
    : reactJSXScopeRules.modern),
  ...sharedReactTypeScriptRules,
});

/**
 * Creates a file-specific configuration for React components.
 *
 * Applies rule overrides to React component files (.tsx, .jsx) including:
 * - Disables explicit return type requirements for React components only (JSX.Element is obvious)
 * - Disables JSDoc return documentation requirements
 * This configuration is identical for both React and Next.js projects.
 * @returns ESLint configuration object for React component files
 */
export const createSharedReactComponentFileConfig = (): Linter.Config => ({
  files: ["**/*.tsx", "**/*.jsx"],
  rules: {
    ...sharedReactComponentRules,
    // Only disable explicit return types for React component functions
    // This uses overrides to target functions that return JSX elements
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        // Allow JSX-returning functions to omit return types
        allowedNames: [],
        allowFunctionsWithoutTypeParameters: false,
      },
    ],
  },
});
