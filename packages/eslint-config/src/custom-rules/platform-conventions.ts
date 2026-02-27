/**
 * Platform-specific convention rules
 *
 * These rules enforce conventions specific to the platform's
 * standard library and architectural patterns, ensuring consistent use
 * of platform utilities across the codebase.
 */

import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import type { Linter } from "eslint";
import { mergeRuleConfigurations } from "./utils.js";
import {
  createUILibraryImportRules,
  type UILibraryImportRuleOptions,
} from "./ui-library-imports.js";

/**
 * Configuration options for platform convention rules
 */
export interface PlatformConventionRuleOptions {
  /** Base URL for documentation references */
  docBaseUrl?: string;
  /** Whether to enforce Result helper usage (default: true) */
  enforceResultHelpers?: boolean;
  /**
   * Legacy alias for discouraging UI library barrel imports.
   * Prefer `discourageUILibraryBarrelImports`.
   */
  discourageUIBarrelImports?: boolean;
  /**
   * UI import boundary options for the shared UI library.
   */
  uiImportBoundaries?: UILibraryImportRuleOptions;
}

/**
 * Default configuration for platform convention rules
 */
const DEFAULT_OPTIONS: Required<PlatformConventionRuleOptions> = {
  docBaseUrl: "",
  enforceResultHelpers: true,
  discourageUIBarrelImports: true,
  uiImportBoundaries: {
    discourageUILibraryBarrelImports: true,
  },
};

/**
 * Custom ESLint rule that enforces using ok() and err() helpers from `@reasonabletech/utils`
 *
 * This rule prevents manual Result object construction, ensuring developers use
 * the platform's standard utility functions for consistency and type safety.
 *
 * **Core Principle**: Always use ok() and err() helpers for Result types instead
 * of manually constructing objects with { success: true/false, ... }
 *
 * ❌ FORBIDDEN (Manual Result construction):
 * ```typescript
 * // Wrong: Manual success result
 * return { success: true, data: user };
 *
 * // Wrong: Manual error result
 * return { success: false, error: "not_found" };
 *
 * // Wrong: Inline object literals
 * const result = { success: true, data: value };
 * ```
 *
 * ✅ CORRECT (Using platform helpers):
 * ```typescript
 * // Right: Use ok() for success
 * import { ok } from "@reasonabletech/utils";
 * return ok(user);
 *
 * // Right: Use err() for errors
 * import { err } from "@reasonabletech/utils";
 * return err("not_found");
 *
 * // Right: Import and use consistently
 * import { ok, err, type Result } from "@reasonabletech/utils";
 *
 * async function getUser(id: string): Promise<Result<User, "not_found">> {
 *   const user = await db.user.findUnique({ where: { id } });
 *   if (!user) return err("not_found");
 *   return ok(user);
 * }
 * ```
 *
 * **Why this matters**:
 * - Ensures consistent Result construction across the platform
 * - Leverages type inference from helper functions
 * - Makes refactoring easier (change implementation in one place)
 * - Provides better editor autocomplete and type checking
 * - Prevents typos in manual object construction ({ sucess: true })
 */
export const useResultHelpersRule = ESLintUtils.RuleCreator(() => "")({
  name: "use-result-helpers",
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforces using ok() and err() helpers from @reasonabletech/utils instead of manual Result construction",
    },
    messages: {
      useOkHelper:
        "❌ FORBIDDEN: Use ok() from @reasonabletech/utils instead of manually constructing { success: true, data: ... }",
      useErrHelper:
        "❌ FORBIDDEN: Use err() from @reasonabletech/utils instead of manually constructing { success: false, error: ... }",
    },
    schema: [
      {
        type: "object",
        properties: {
          docBaseUrl: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      docBaseUrl: "",
    },
  ],
  create(context) {
    /**
     * Checks if an object expression looks like a manual Result construction
     * @param node - AST node representing an object expression
     * @returns True if the object looks like a Result type
     */
    function isResultLikeObject(node: TSESTree.ObjectExpression): {
      isResult: boolean;
      isSuccess: boolean | null;
    } {
      let hasSuccess = false;
      let successValue: boolean | null = null;
      let hasData = false;
      let hasError = false;

      for (const prop of node.properties) {
        if (
          prop.type === AST_NODE_TYPES.Property &&
          prop.key.type === AST_NODE_TYPES.Identifier
        ) {
          const keyName = prop.key.name;

          if (keyName === "success") {
            hasSuccess = true;

            // Try to determine if success is true or false
            if (
              prop.value.type === AST_NODE_TYPES.Literal &&
              typeof prop.value.value === "boolean"
            ) {
              successValue = prop.value.value;
            }
          } else if (keyName === "data") {
            hasData = true;
          } else if (keyName === "error") {
            hasError = true;
          }
        }
      }

      // Result type has 'success' and either 'data' or 'error'
      const isResult = hasSuccess && (hasData || hasError);

      return { isResult, isSuccess: successValue };
    }

    return {
      ObjectExpression(node): void {
        const { isResult, isSuccess } = isResultLikeObject(node);

        if (!isResult) {
          return;
        }

        // Check if this is a success result (use ok helper)
        if (isSuccess === true) {
          context.report({
            node,
            messageId: "useOkHelper",
          });
        }

        // Check if this is an error result (use err helper)
        if (isSuccess === false) {
          context.report({
            node,
            messageId: "useErrHelper",
          });
        }

        // If we can't determine the success value (e.g., variable), still report
        // because manual construction should be avoided
        if (isSuccess === null) {
          // Check which property exists to give better message
          const hasData = node.properties.some(
            (prop) =>
              prop.type === AST_NODE_TYPES.Property &&
              prop.key.type === AST_NODE_TYPES.Identifier &&
              prop.key.name === "data",
          );

          if (hasData) {
            context.report({
              node,
              messageId: "useOkHelper",
            });
          } else {
            context.report({
              node,
              messageId: "useErrHelper",
            });
          }
        }
      },
    };
  },
});

/**
 * Creates rules that enforce Result helper usage
 *
 * Uses the `@reasonabletech/use-result-helpers` custom rule which detects manual
 * Result construction including non-literal success values, spread elements,
 * and computed property keys.
 * @param options Configuration options for platform convention rules
 * @returns ESLint rules that enforce Result helper usage
 */
export function createResultHelperRules(
  options: PlatformConventionRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!config.enforceResultHelpers) {
    return {};
  }

  return {
    "@reasonabletech/use-result-helpers": [
      "error",
      {
        docBaseUrl: config.docBaseUrl,
      },
    ] as Linter.RuleEntry,
  };
}

/**
 * Creates UI library import-boundary rules.
 *
 * This is a thin adapter that keeps the platform-conventions API stable while
 * delegating UI-library specifics to the dedicated `ui-library-imports` module.
 * @param options Configuration options for platform convention rules
 * @returns ESLint rules that discourage UI library barrel imports
 */
export function createUIBarrelImportRules(
  options: PlatformConventionRuleOptions = {},
): Linter.RulesRecord {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
    uiImportBoundaries: {
      ...DEFAULT_OPTIONS.uiImportBoundaries,
      ...options.uiImportBoundaries,
    },
  };

  return createUILibraryImportRules({
    discourageUILibraryBarrelImports:
      (config.uiImportBoundaries.discourageUILibraryBarrelImports ?? true) &&
      config.discourageUIBarrelImports,
  });
}

/**
 * Creates a complete set of platform convention rules
 *
 * This is the main function that combines all platform-specific convention
 * rules into a single configuration object.
 * @param options Configuration options for platform convention rules
 * @returns Complete set of platform convention ESLint rules
 */
export function createPlatformConventionRules(
  options: PlatformConventionRuleOptions = {},
): Linter.RulesRecord {
  const resultHelperRules = createResultHelperRules(options);
  const uiBarrelImportRules = createUIBarrelImportRules(options);

  return mergeRuleConfigurations(resultHelperRules, uiBarrelImportRules);
}

/**
 * Preset for platform convention rules
 * @returns ESLint rules configured for platform conventions
 */
export function createPlatformConventionPresetRules(): Linter.RulesRecord {
  return createPlatformConventionRules({
    docBaseUrl: "",
    enforceResultHelpers: true,
    discourageUIBarrelImports: true,
    uiImportBoundaries: {
      discourageUILibraryBarrelImports: true,
    },
  });
}
