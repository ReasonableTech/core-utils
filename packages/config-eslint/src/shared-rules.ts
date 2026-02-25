/**
 * Shared ESLint rules for the monorepo
 *
 * This module defines the standard ESLint rules used across all configurations
 * to ensure consistent code quality and style throughout the monorepo.
 */

import type { Linter } from "eslint";

/**
 * Base ESLint rules applied to all JavaScript and TypeScript files.
 *
 * These rules focus on code quality, consistency, and catching common errors
 * without requiring TypeScript type information.
 */
export const baseRules: Linter.RulesRecord = {
  // Possible Problems
  "no-await-in-loop": "error",
  "no-duplicate-imports": "error",
  "no-self-compare": "error",
  "no-template-curly-in-string": "error",
  "no-unmodified-loop-condition": "error",
  "no-unreachable-loop": "error",
  "no-unused-private-class-members": "error",
  "require-atomic-updates": "error",

  // Suggestions
  "consistent-return": "error",
  curly: "error",
  "default-case-last": "error",
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-else-return": "error",
  "no-implicit-coercion": "error",
  "no-lonely-if": "error",
  "no-nested-ternary": "error",
  "no-param-reassign": "error",
  "no-throw-literal": "error",
  "no-return-assign": "error",
  "no-unneeded-ternary": "error",
  "no-useless-concat": "error",
  "no-useless-return": "error",
  "no-var": "error",
  "object-shorthand": "error",
  "one-var": ["error", "never"],
  "prefer-arrow-callback": "error",
  "prefer-const": "error",
  "prefer-object-spread": "error",
  "prefer-promise-reject-errors": "error",
  "prefer-template": "error",
  "spaced-comment": [
    "error",
    "always",
    {
      markers: ["/"], // Allow /// for TypeScript triple-slash directives
    },
  ],

  // Layout & Formatting (handled by Prettier mostly)
  "max-len": [
    "error",
    {
      code: 100,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    },
  ],
};

/**
 * TypeScript-aware ESLint rules that require type information.
 *
 * These rules leverage TypeScript's type system to catch more sophisticated
 * errors and enforce type safety best practices. They are essential for
 * AI-generated code safety and maintaining high code quality standards.
 *
 * Each rule is carefully selected to:
 * - Prevent runtime errors that static analysis alone cannot catch
 * - Enforce consistent code patterns that improve maintainability
 * - Catch subtle bugs that are common in AI-generated or rapidly written code
 * - Ensure type safety without being overly restrictive
 */
export const typeAwareRules: Linter.RulesRecord = {
  // TypeScript-specific rules for consistency and safety
  "@typescript-eslint/array-type": ["error", { default: "array-simple" }], // Consistent array syntax: T[] over Array<T>
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      // Allow TS comments but require descriptive explanations to prevent abuse
      "ts-expect-error": "allow-with-description",
      "ts-ignore": "allow-with-description",
      "ts-nocheck": "allow-with-description",
      "ts-check": false,
      minimumDescriptionLength: 10,
    },
  ],

  // Critical TypeScript safety rules
  "@typescript-eslint/no-explicit-any": "error", // Prevent any usage
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ], // Catch unused variables; underscore prefix marks intentionally unused
  "@typescript-eslint/explicit-function-return-type": "error", // Require explicit return types
  "@typescript-eslint/no-require-imports": "error", // Use ES6 imports only
  "@typescript-eslint/no-non-null-assertion": "error", // Prevent dangerous ! operator
  "@typescript-eslint/require-array-sort-compare": "error", // Require compare function for array.sort()
  "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Prefer interfaces over type aliases for objects
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "separate-type-imports" }, // Import types as types for better bundling
  ],

  // Runtime safety rules - catch dangerous operations
  "@typescript-eslint/no-base-to-string": "error", // Prevent "[object Object]" in string conversions
  "@typescript-eslint/no-confusing-void-expression": "error", // Prevent accidentally using void in expressions
  "@typescript-eslint/no-duplicate-type-constituents": "error", // Clean up redundant union/intersection types
  "@typescript-eslint/no-floating-promises": "error", // Ensure promises are properly handled
  "@typescript-eslint/no-for-in-array": "error", // Use for-of loops for arrays, not for-in
  "@typescript-eslint/no-meaningless-void-operator": "error", // Prevent unnecessary void operator usage
  "@typescript-eslint/no-misused-promises": "error", // Prevent using promises where sync values expected
  "@typescript-eslint/no-redundant-type-constituents": "error", // Remove redundant types from unions

  // Code quality and optimization rules
  "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error", // Simplify boolean comparisons
  "@typescript-eslint/no-unnecessary-condition": "error", // Remove conditions that are always true/false
  "@typescript-eslint/no-unnecessary-type-assertion": "error", // Remove redundant type assertions

  // Critical type safety rules - prevent `any` contamination and unsafe operations
  "@typescript-eslint/no-unsafe-argument": "error", // Prevent passing `any` as arguments
  "@typescript-eslint/no-unsafe-assignment": "error", // Prevent assigning `any` to typed variables
  "@typescript-eslint/no-unsafe-call": "error", // Prevent calling `any` as function
  "@typescript-eslint/no-unsafe-member-access": "error", // Prevent accessing properties on `any`
  "@typescript-eslint/no-unsafe-return": "error", // Prevent returning `any` from typed functions

  // Modern JavaScript/TypeScript best practices
  "@typescript-eslint/prefer-includes": "error", // Use .includes() instead of .indexOf() >= 0
  "@typescript-eslint/prefer-nullish-coalescing": "error", // Use ?? instead of || for null checks
  "@typescript-eslint/prefer-optional-chain": "error", // Use ?. instead of manual null checks
  "@typescript-eslint/prefer-readonly": "error", // Make class properties readonly when possible
  "@typescript-eslint/prefer-reduce-type-parameter": "error", // Better generics in reduce calls
  "@typescript-eslint/prefer-string-starts-ends-with": "error", // Use .startsWith()/.endsWith() instead of regex
  "@typescript-eslint/require-await": "error", // Async functions must use await
  "@typescript-eslint/restrict-plus-operands": "error", // Prevent mixing types in + operations
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    {
      // Allow safe types in template literals, prevent dangerous ones
      allowNumber: true,
      allowBoolean: true,
      allowAny: false, // Critical: prevent `any` in templates
      allowNullish: false, // Prevent null/undefined interpolation
      allowRegExp: false,
    },
  ],
  "@typescript-eslint/strict-boolean-expressions": [
    "error",
    {
      // Require explicit boolean checks - critical for AI-generated code safety
      allowString: false, // Prevent truthy string checks
      allowNumber: false, // Prevent truthy number checks
      allowNullableObject: false, // Require explicit null checks
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false, // Critical: prevent `any` in conditions
    },
  ],
  "@typescript-eslint/switch-exhaustiveness-check": "error", // Ensure all enum cases are handled
  "@typescript-eslint/unbound-method": "error", // Prevent method extraction without binding

  // Overrides for base rules when using TypeScript - use TypeScript-aware versions
  "no-implied-eval": "off", // Disable base rule
  "@typescript-eslint/no-implied-eval": "error", // Use TypeScript-aware version that understands types
  "dot-notation": "off", // Disable base rule
  "@typescript-eslint/dot-notation": "error", // Use TypeScript version that respects optional properties
  "no-return-await": "off", // Disable base rule
  "@typescript-eslint/return-await": ["error", "always"], // Always return await for better stack traces
};

// Import the new modular error handling rules
import { createPlatformRulePreset } from "./custom-rules/index.js";

/**
 * Error handling rules that enforce error type standards.
 *
 * These rules implement the mandatory error handling patterns defined in:
 * - docs/standards/error-handling.md
 * - docs/standards/error-type-standards.md
 *
 * CRITICAL: These rules prevent dangerous error message parsing patterns
 * and enforce documented error type extraction requirements.
 * @deprecated Use createPlatformRulePreset() from ./custom-rules instead.
 * This export is maintained for backward compatibility.
 */
export const errorHandlingRules: Linter.RulesRecord =
  createPlatformRulePreset();
