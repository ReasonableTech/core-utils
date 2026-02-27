/**
 * Error handling rule definitions for ReasonableTech projects
 *
 * These rules enforce safe error handling patterns and prevent dangerous
 * error message parsing. They are designed to be reusable across different
 * projects with configurable documentation references.
 */

import type { Linter } from "eslint";
import { mergeRuleConfigurations } from "./utils.js";

/**
 * Configuration options for error handling rules
 */
export interface ErrorHandlingRuleOptions {
  /** Base URL for documentation references */
  docBaseUrl?: string;
  /** Pattern for error type names (default: ".*Error$") */
  errorTypePattern?: string;
  /** Name of Result type to check for inline unions (default: "Result") */
  resultTypeName?: string;
  /** Whether to require JSDoc on error types (default: true) */
  requireErrorTypeJSDoc?: boolean;
}

/**
 * Default configuration for ReasonableTech error handling rules
 */
const DEFAULT_OPTIONS: Required<ErrorHandlingRuleOptions> = {
  docBaseUrl: "docs/standards/error-handling.md",
  errorTypePattern: ".*Error$",
  resultTypeName: "Result",
  requireErrorTypeJSDoc: true,
};

/**
 * Creates rules that prevent dangerous error message parsing patterns
 *
 * These rules block the use of string methods on error.message properties,
 * enforcing the use of structured error detection instead.
 * @param _options Configuration options for error handling rules (reserved for future use)
 * @returns ESLint rules that prevent error message parsing
 */
export function createErrorMessageParsingRules(
  _options: ErrorHandlingRuleOptions = {},
): Linter.RulesRecord {
  return {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.property.name='includes'][callee.object.property.name='message']",
        message: `❌ FORBIDDEN: Never parse error messages with .includes(). Use error.code, error.status, or instanceof checks instead.`,
      },
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.property.name='startsWith'][callee.object.property.name='message']",
        message:
          "❌ FORBIDDEN: Never parse error messages with .startsWith(). Use error.code, error.status, or instanceof checks instead.",
      },
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.property.name='endsWith'][callee.object.property.name='message']",
        message:
          "❌ FORBIDDEN: Never parse error messages with .endsWith(). Use error.code, error.status, or instanceof checks instead.",
      },
      {
        selector:
          "BinaryExpression[operator='==='][left.type='MemberExpression'][left.property.name='message']",
        message:
          "❌ FORBIDDEN: Never compare error messages directly. Use error.code, error.status, or instanceof checks instead.",
      },
      {
        selector:
          "BinaryExpression[operator='=='][left.type='MemberExpression'][left.property.name='message']",
        message:
          "❌ FORBIDDEN: Never compare error messages directly. Use error.code, error.status, or instanceof checks instead.",
      },
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.property.name='match'][callee.object.property.name='message']",
        message:
          "❌ FORBIDDEN: Never use regex on error messages. Use error.code, error.status, or instanceof checks instead.",
      },
      {
        selector:
          "CallExpression[callee.type='MemberExpression'][callee.property.name='test'][callee.object.type='MemberExpression'][callee.object.property.name='message']",
        message:
          "❌ FORBIDDEN: Never use regex test on error messages. Use error.code, error.status, or instanceof checks instead.",
      },
    ],
  };
}

/**
 * Creates rules that enforce JSDoc documentation on error types
 *
 * Requires comprehensive documentation on all exported error type aliases
 * to ensure error codes are properly documented and understood.
 * @param options Configuration options for error handling rules
 * @returns ESLint rules that enforce JSDoc documentation on error types
 */
export function createErrorTypeDocumentationRules(
  options: ErrorHandlingRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!config.requireErrorTypeJSDoc) {
    return {};
  }

  return {
    "jsdoc/require-jsdoc": [
      "error",
      {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
        contexts: [
          // Enforce JSDoc on all exported type aliases that match the error pattern
          `ExportNamedDeclaration > TSTypeAliasDeclaration[id.name=/${config.errorTypePattern}/]`,
        ],
      },
    ],
  };
}

/**
 * Creates rules that enforce consistent error type naming conventions
 *
 * Enforces PascalCase with "Error" suffix for error types and
 * lowercase_with_underscores for error code literals.
 * @param options Configuration options for error handling rules
 * @returns ESLint rules that enforce consistent error type naming
 */
export function createErrorTypeNamingRules(
  options: ErrorHandlingRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        // Enforce PascalCase with "Error" suffix for error types
        selector: "typeAlias",
        filter: {
          regex: config.errorTypePattern,
          match: true,
        },
        format: ["PascalCase"],
        suffix: ["Error"],
      },
    ],
  };
}

/**
 * Creates rules that detect inline error unions in Result types
 *
 * Prevents the use of inline union types in Result<T, E> signatures,
 * enforcing extraction to documented named types.
 * @param options Configuration options for error handling rules
 * @returns ESLint rules that detect inline error unions in Result types
 */
export function createInlineErrorUnionRules(
  options: ErrorHandlingRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return {
    "no-restricted-syntax": [
      "error",
      // Detect inline error unions in Result types
      {
        selector: `TSTypeReference[typeName.name='${config.resultTypeName}'] TSUnionType:has(TSLiteralType)`,
        message: `❌ FORBIDDEN: Never use inline error unions in ${config.resultTypeName} types. Extract to a documented named type.`,
      },
      {
        selector: `TSTypeReference[typeName.name='Promise'] TSTypeParameterInstantiation TSTypeReference[typeName.name='${config.resultTypeName}'] TSUnionType:has(TSLiteralType)`,
        message: `❌ FORBIDDEN: Never use inline error unions in Promise<${config.resultTypeName}<T, E>> types. Extract to a documented named type.`,
      },
    ],
  };
}

/**
 * Creates a complete set of error handling rules with all components
 *
 * This is the main function that combines all error handling rules
 * into a single configuration object.
 * @param options Configuration options for error handling rules
 * @returns Complete set of error handling ESLint rules
 */
export function createErrorHandlingRules(
  options: ErrorHandlingRuleOptions = {},
): Linter.RulesRecord {
  const messageParsingRules = createErrorMessageParsingRules(options);
  const documentationRules = createErrorTypeDocumentationRules(options);
  const namingRules = createErrorTypeNamingRules(options);
  const inlineUnionRules = createInlineErrorUnionRules(options);

  return mergeRuleConfigurations(
    messageParsingRules,
    documentationRules,
    namingRules,
    inlineUnionRules,
  );
}

/**
 * Preset for Platform-specific error handling rules
 * @returns ESLint rules configured for platform projects
 */
export function createPlatformErrorHandlingRules(): Linter.RulesRecord {
  return createErrorHandlingRules({
    docBaseUrl: "docs/standards/error-handling.md",
    errorTypePattern: ".*Error$",
    resultTypeName: "Result",
    requireErrorTypeJSDoc: true,
  });
}
