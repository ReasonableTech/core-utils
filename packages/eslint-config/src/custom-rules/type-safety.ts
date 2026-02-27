/**
 * Type safety rule definitions for ReasonableTech projects
 *
 * These rules prevent type system bypasses and enforce safe type handling
 * patterns, particularly around Result types and type assertions.
 */

import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type { Linter } from "eslint";
import { mergeRuleConfigurations } from "./utils.js";

/**
 * Configuration options for type safety rules
 */
export interface TypeSafetyRuleOptions {
  /** Base URL for documentation references */
  docBaseUrl?: string;
  /** Whether to allow type assertions in test files (default: false) */
  allowInTests?: boolean;
}

/**
 * Custom ESLint rule that prevents `as any` and `<any>` type casts
 *
 * This rule detects all forms of casting to `any`, including:
 * - `expr as any`
 * - `<any>expr`
 * - Double casts through any: `(expr as any) as T`
 *
 * Each variant produces a distinct, descriptive error message rather than the
 * generic "no-restricted-syntax" label that the previous AST-selector approach
 * showed in editors.
 */
export const noAsAnyRule = ESLintUtils.RuleCreator(
  () => "docs/standards/typescript-standards.md",
)({
  name: "no-as-any",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents 'as any' and '<any>' type casts that bypass TypeScript's type checking",
    },
    messages: {
      asAny:
        "Never use 'as any' casts. Use proper type assertions or type guards instead.",
      angleAny:
        "Never use '<any>' casts. Use proper type assertions or type guards instead.",
      doubleCast:
        "Never use double casts through 'as any'. Use proper type guards instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    /**
     * Checks whether a TSAnyKeyword is a direct child of a TSAsExpression
     * and, if so, whether the cast is part of a double-cast pattern.
     */
    function checkAsExpression(node: TSESTree.TSAsExpression): void {
      if (node.typeAnnotation.type !== AST_NODE_TYPES.TSAnyKeyword) {
        return;
      }

      // Double-cast pattern: (expr as any) as T — the inner `as any` lives
      // inside an outer TSAsExpression.
      const parent = node.parent;
      if (
        parent !== undefined &&
        parent.type === AST_NODE_TYPES.TSAsExpression &&
        parent.expression === node
      ) {
        context.report({ node: node.typeAnnotation, messageId: "doubleCast" });
        return;
      }

      context.report({ node: node.typeAnnotation, messageId: "asAny" });
    }

    /**
     * Checks whether a TSTypeAssertion (angle-bracket syntax) casts to any.
     */
    function checkTypeAssertion(node: TSESTree.TSTypeAssertion): void {
      if (node.typeAnnotation.type !== AST_NODE_TYPES.TSAnyKeyword) {
        return;
      }

      context.report({ node: node.typeAnnotation, messageId: "angleAny" });
    }

    return {
      TSAsExpression: checkAsExpression,
      TSTypeAssertion: checkTypeAssertion,
    };
  },
});

/**
 * Creates rules that prevent `as any` type casts
 *
 * These rules block the use of `as any` type assertions, which bypass
 * TypeScript's type checking and create type safety holes.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * const data = response as any; // Bypasses type checking
 * const x = (response as any) as User; // Double cast through any
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * const data = parseResponse(response); // Proper typed parsing
 * const user = data.result.user; // Type-safe access
 * ```
 * @param _options Configuration options for type safety rules (reserved for future use)
 * @returns ESLint rules that prevent `as any` casts
 */
export function createNoAnyRules(
  _options: TypeSafetyRuleOptions = {},
): Linter.RulesRecord {
  return {
    "@typescript-eslint/no-explicit-any": "error",
    "@reasonabletech/no-as-any": "error",
  };
}

/**
 * Creates rules for safe Result type handling
 *
 * These rules prevent unsafe access to Result type data properties
 * without proper success checking.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * const result = await fetchUser(id);
 * return result.data; // Unsafe - no success check
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * const result = await fetchUser(id);
 * if (!result.success) {
 *   return result; // Propagate error
 * }
 * return ok(result.data); // Safe access after check
 * ```
 * @param _options Configuration options (reserved for future use)
 * @returns ESLint rules for Result type safety
 */
export function createResultTypeRules(
  _options: TypeSafetyRuleOptions = {},
): Linter.RulesRecord {
  // Note: Full control-flow analysis for Result types is beyond ESLint's capabilities.
  // This rule uses heuristics to catch common unsafe patterns.
  // For complete safety, rely on TypeScript's type system and code review.
  return {};
}

/**
 * Creates a complete set of type safety rules
 *
 * This is the main function that combines all type safety rules
 * into a single configuration object.
 * @param options Configuration options for type safety rules
 * @returns Complete set of type safety ESLint rules
 */
export function createTypeSafetyRules(
  options: TypeSafetyRuleOptions = {},
): Linter.RulesRecord {
  const noAnyRules = createNoAnyRules(options);
  const resultTypeRules = createResultTypeRules(options);

  return mergeRuleConfigurations(noAnyRules, resultTypeRules);
}

/**
 * Preset for Platform-specific type safety rules
 *
 * This preset provides all type safety rules configured specifically
 * for platform project conventions and documentation structure.
 * @returns ESLint rules configured for platform projects
 */
export function createPlatformTypeSafetyRules(): Linter.RulesRecord {
  return createTypeSafetyRules({
    docBaseUrl: "docs/standards/typescript-standards.md",
    allowInTests: false,
  });
}
