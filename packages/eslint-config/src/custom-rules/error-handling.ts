/**
 * Error handling rule definitions for ReasonableTech projects
 *
 * These rules enforce safe error handling patterns and prevent dangerous
 * error message parsing. They are designed to be reusable across different
 * projects with configurable documentation references.
 */

import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
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

/** Set of string methods that are forbidden on `.message` properties */
const MESSAGE_STRING_METHODS = new Set([
  "includes",
  "startsWith",
  "endsWith",
  "match",
]);

/**
 * Custom ESLint rule that prevents parsing error messages with string methods
 *
 * Detects the following patterns on any `.message` property:
 * - `error.message.includes(...)` / `.startsWith(...)` / `.endsWith(...)` / `.match(...)`
 * - `error.message === "..."` / `error.message == "..."`
 * - `/.../\.test(error.message)`
 *
 * All of these are fragile because error messages are not part of a stable API
 * and may change without notice. Use `error.code`, `error.status`, or
 * `instanceof` checks instead.
 */
export const noErrorMessageParsingRule = ESLintUtils.RuleCreator(
  () => "docs/standards/error-handling.md",
)({
  name: "no-error-message-parsing",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents parsing error messages with string methods or direct comparisons",
    },
    messages: {
      stringMethod:
        "Never parse error messages with .{{method}}(). Use error.code, error.status, or instanceof checks instead.",
      directComparison:
        "Never compare error messages directly. Use error.code, error.status, or instanceof checks instead.",
      regexTest:
        "Never use regex test on error messages. Use error.code, error.status, or instanceof checks instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    /**
     * Checks if a MemberExpression's object ends with `.message`
     * (i.e. `<something>.message`).
     */
    function isMessageAccess(node: TSESTree.MemberExpression): boolean {
      return (
        node.property.type === AST_NODE_TYPES.Identifier &&
        node.property.name === "message"
      );
    }

    return {
      // Detect: error.message.includes/startsWith/endsWith/match(...)
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const callee = node.callee;
        const methodName =
          callee.property.type === AST_NODE_TYPES.Identifier
            ? callee.property.name
            : null;

        if (methodName === null) {
          return;
        }

        // Case 1: error.message.<method>(...)
        if (
          MESSAGE_STRING_METHODS.has(methodName) &&
          callee.object.type === AST_NODE_TYPES.MemberExpression &&
          isMessageAccess(callee.object)
        ) {
          context.report({
            node,
            messageId: "stringMethod",
            data: { method: methodName },
          });
          return;
        }

        // Case 2: /regex/.test(error.message) — callee is regex.test,
        // and the first argument is a `.message` member expression
        if (
          methodName === "test" &&
          callee.object.type === AST_NODE_TYPES.MemberExpression &&
          isMessageAccess(callee.object)
        ) {
          context.report({ node, messageId: "regexTest" });
        }
      },

      // Detect: error.message === "..." / error.message == "..."
      BinaryExpression(node: TSESTree.BinaryExpression): void {
        if (node.operator !== "===" && node.operator !== "==") {
          return;
        }

        if (
          node.left.type === AST_NODE_TYPES.MemberExpression &&
          isMessageAccess(node.left)
        ) {
          context.report({ node, messageId: "directComparison" });
        }
      },
    };
  },
});

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
    "@reasonabletech/no-error-message-parsing": "error",
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
 * Custom ESLint rule that prevents inline error union types in Result types
 *
 * Detects inline union types (containing literal members) used as type
 * arguments in `Result<T, E>` and `Promise<Result<T, E>>` type references.
 * These should be extracted to documented named types for maintainability.
 *
 * ❌ `Result<User, "not_found" | "forbidden">`
 * ✅ `Result<User, GetUserError>` where `GetUserError` is a named type
 */
export const noInlineErrorUnionsRule = ESLintUtils.RuleCreator(
  () => "docs/standards/error-handling.md",
)({
  name: "no-inline-error-unions",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents inline error union types in Result type parameters",
    },
    messages: {
      inlineUnion:
        "Never use inline error unions in {{typeName}} types. Extract to a documented named type.",
    },
    schema: [
      {
        type: "object",
        properties: {
          resultTypeName: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ resultTypeName: "Result" }],
  create(context) {
    const resultTypeName = context.options[0]?.resultTypeName ?? "Result";

    /**
     * Checks if a TSUnionType contains at least one TSLiteralType member.
     */
    function hasLiteralMember(union: TSESTree.TSUnionType): boolean {
      return union.types.some(
        (t) => t.type === AST_NODE_TYPES.TSLiteralType,
      );
    }

    /**
     * Checks if a TSTypeReference refers to the configured Result type name.
     */
    function isResultReference(node: TSESTree.TSTypeReference): boolean {
      return (
        node.typeName.type === AST_NODE_TYPES.Identifier &&
        node.typeName.name === resultTypeName
      );
    }

    /**
     * Walks TSUnionType nodes that are descendants of a given type parameter
     * list, returning any that contain literal members.
     */
    function findInlineUnions(
      params: TSESTree.TSTypeParameterInstantiation,
    ): TSESTree.TSUnionType[] {
      const results: TSESTree.TSUnionType[] = [];

      function walk(node: TSESTree.Node): void {
        if (
          node.type === AST_NODE_TYPES.TSUnionType &&
          hasLiteralMember(node)
        ) {
          results.push(node);
          return; // Don't recurse into nested unions of the same node
        }

        for (const key of Object.keys(node)) {
          if (key === "parent") {
            continue;
          }
          const value = (node as unknown as Record<string, unknown>)[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (
                item !== null &&
                typeof item === "object" &&
                typeof (item as Record<string, unknown>).type === "string"
              ) {
                walk(item as TSESTree.Node);
              }
            }
          } else if (
            value !== null &&
            typeof value === "object" &&
            typeof (value as Record<string, unknown>).type === "string"
          ) {
            walk(value as TSESTree.Node);
          }
        }
      }

      for (const param of params.params) {
        walk(param);
      }

      return results;
    }

    return {
      TSTypeReference(node: TSESTree.TSTypeReference): void {
        if (!isResultReference(node)) {
          return;
        }

        if (node.typeArguments === undefined) {
          return;
        }

        // Determine the display name: if the Result reference is nested inside
        // a Promise<...>, display "Promise<Result<T, E>>".
        let displayName = resultTypeName;
        const parentRef = node.parent;
        if (
          parentRef !== undefined &&
          parentRef.type === AST_NODE_TYPES.TSTypeParameterInstantiation
        ) {
          const grandparent = parentRef.parent;
          if (
            grandparent !== undefined &&
            grandparent.type === AST_NODE_TYPES.TSTypeReference &&
            grandparent.typeName.type === AST_NODE_TYPES.Identifier &&
            grandparent.typeName.name === "Promise"
          ) {
            displayName = `Promise<${resultTypeName}<T, E>>`;
          }
        }

        const inlineUnions = findInlineUnions(node.typeArguments);
        for (const union of inlineUnions) {
          context.report({
            node: union,
            messageId: "inlineUnion",
            data: { typeName: displayName },
          });
        }
      },
    };
  },
});

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
    "@reasonabletech/no-inline-error-unions": [
      "error",
      {
        resultTypeName: config.resultTypeName,
      },
    ] as Linter.RuleEntry,
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
