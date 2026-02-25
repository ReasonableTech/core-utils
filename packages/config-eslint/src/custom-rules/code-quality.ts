/**
 * Code quality rule definitions for ReasonableTech projects
 *
 * These rules prevent technical debt accumulation by detecting patterns
 * that bypass code quality tools or create maintainability issues.
 */

import { ESLintUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils";
import type { Linter } from "eslint";
import { mergeRuleConfigurations } from "./utils.js";

/**
 * Configuration options for linter disabling detection
 */
export interface NoLinterDisablingOptions {
  /** Whether to allow disabling linters in test files (default: true) */
  allowInTests?: boolean;
  /** Whether to require justification comments (default: true) */
  requireJustification?: boolean;
  /** List of rules that are allowed to be disabled (default: []) */
  allowedRules?: string[];
  /** Glob patterns for files where disabling is allowed (default: test patterns) */
  allowedPatterns?: string[];
}

/**
 * Default options for no-linter-disabling rule
 */
const DEFAULT_LINTER_DISABLING_OPTIONS: NoLinterDisablingOptions = {
  allowInTests: true,
  requireJustification: true,
  allowedRules: [],
  allowedPatterns: ["**/*.test.ts", "**/*.test.tsx", "**/tests/**"],
};

/**
 * Custom ESLint rule that prevents disabling linter rules without justification
 *
 * This rule detects and blocks the use of:
 * - `eslint disable` comments
 * - TypeScript ignore directives (for example, `ts-ignore`)
 * - TypeScript no-check directives (for example, `ts-nocheck`)
 *
 * Unless:
 * - The file matches allowed patterns (e.g., test files)
 * - A justification comment is provided (// Reason: ...)
 * - The specific rule is in the allowed list
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * /* eslint disable *\/ // No justification
 * // `@ts ignore` // No justification
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * // Reason: Testing error message parsing - legitimate use case
 * /* eslint disable no-restricted-syntax *\/
 * const hasMatch = items.some(x => x.message?.includes("pattern"));
 * /* eslint enable no-restricted-syntax *\/
 * ```
 */
export const noLinterDisablingRule = ESLintUtils.RuleCreator(
  () => "docs/standards/typescript-standards.md",
)({
  name: "no-linter-disabling",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents disabling linter rules without proper justification",
    },
    messages: {
      noDisable:
        "❌ FORBIDDEN: Disabling linter rules is not allowed. Fix the underlying issue instead.",
      noJustification:
        "❌ REQUIRED: Linter rule disabling requires a justification comment (// Reason: <explanation>).",
      specificRule:
        "❌ FORBIDDEN: Disabling '{{rule}}' is not allowed. Fix the issue instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowInTests: { type: "boolean" },
          requireJustification: { type: "boolean" },
          allowedRules: { type: "array", items: { type: "string" } },
          allowedPatterns: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [DEFAULT_LINTER_DISABLING_OPTIONS],
  create(context) {
    const options = {
      ...DEFAULT_LINTER_DISABLING_OPTIONS,
      ...context.options[0],
    };
    const filename =
      typeof (context as { getFilename?: () => string }).getFilename === "function"
        ? (context as { getFilename: () => string }).getFilename()
        : ((context as { filename?: string }).filename ?? "<input>");

    const sourceCode: TSESLint.SourceCode | null =
      typeof (context as { getSourceCode?: () => TSESLint.SourceCode })
        .getSourceCode === "function"
        ? (context as { getSourceCode: () => TSESLint.SourceCode }).getSourceCode()
        : ((context as { sourceCode?: TSESLint.SourceCode }).sourceCode ?? null);

    if (sourceCode == null) {
      return {};
    }

    // Check if file matches allowed patterns (e.g., test files)
    if (
      options.allowInTests === true &&
      isTestFile(filename, options.allowedPatterns ?? [])
    ) {
      return {};
    }

    return {
      Program(): void {
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const text = comment.value.trim();

          // Detect linter-disable directives
          if (
            text.includes("eslint-disable") ||
            text.includes("@ts-ignore") ||
            text.includes("@ts-nocheck")
          ) {
            const disabledRule = extractDisabledRule(text);

            // Check if this specific rule is allowed
            if (
              disabledRule !== null &&
              disabledRule !== "" &&
              options.allowedRules?.includes(disabledRule) === true
            ) {
              continue;
            }

            // Check for justification if required
            if (options.requireJustification === true) {
              const hasJustification = checkJustification(comments, comment);

              if (!hasJustification) {
                context.report({
                  loc: comment.loc,
                  messageId: "noJustification",
                });
                continue;
              }

              if (disabledRule !== null && disabledRule !== "") {
                context.report({
                  loc: comment.loc,
                  messageId: "specificRule",
                  data: { rule: disabledRule },
                });
              } else {
                context.report({
                  loc: comment.loc,
                  messageId: "noDisable",
                });
              }
              continue;
            }

            // Report the violation (only reached when requireJustification is false)
            if (disabledRule !== null && disabledRule !== "") {
              context.report({
                loc: comment.loc,
                messageId: "specificRule",
                data: { rule: disabledRule },
              });
            } else {
              context.report({
                loc: comment.loc,
                messageId: "noDisable",
              });
            }
          }
        }
      },
    };
  },
});

/**
 * Checks if a filename matches test file patterns
 * @param filename File path to check
 * @param _patterns Optional glob patterns to match against (reserved for future use)
 * @returns True if the file is a test file
 */
function isTestFile(filename: string, _patterns: string[] = []): boolean {
  return (
    filename.includes(".test.") ||
    filename.includes(".spec.") ||
    filename.includes("/tests/") ||
    filename.includes("/__tests__/")
  );
}

/**
 * Extracts the specific rule name from an eslint disable comment
 * @param comment Comment text to parse
 * @returns Rule name if found, null otherwise
 */
function extractDisabledRule(comment: string): string | null {
  const match = comment.match(/eslint-disable(?:-next-line)?\s+([a-z-/@]+)/i);
  return match !== null ? match[1] : null;
}

/**
 * Checks if a justification comment exists before a disable comment
 * @param allComments All comments in the file
 * @param disableComment The disable comment to check
 * @returns True if a justification comment is found
 */
function checkJustification(
  allComments: TSESTree.Comment[],
  disableComment: TSESTree.Comment,
): boolean {
  // Look for comments within 3 lines before the disable comment
  const precedingComments = allComments.filter(
    (c) =>
      c.loc.end.line >= disableComment.loc.start.line - 3 &&
      c.loc.end.line < disableComment.loc.start.line,
  );

  return precedingComments.some((c) => {
    const trimmedValue = c.value.trim().toLowerCase();
    return trimmedValue.startsWith("reason:");
  });
}

/**
 * Creates rules for detecting barrel exports (export *)
 *
 * These rules prevent the use of `export *` patterns, which create
 * bloated namespaces and make it harder to track what's exported.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * export * from "./user-service"; // Exports all 30 items
 * export * from "./workspace-service"; // Exports all 25 items
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * // Import directly from implementation
 * import { UserService } from "@reasonabletech/platform/user-service";
 *
 * // Or use explicit named exports
 * export { UserService, type CreateUserError } from "./user-service";
 * ```
 * @param _options Configuration options (currently unused, reserved for future)
 * @param _options.allowedPatterns Glob patterns for files where barrel exports are allowed
 * @returns ESLint rules that prevent barrel exports
 */
export function createBarrelExportRules(
  _options: { allowedPatterns?: string[] } = {},
): Linter.RulesRecord {
  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: "ExportAllDeclaration",
        message:
          "❌ FORBIDDEN: Never use 'export *' barrel exports. Use explicit named exports or import from specific modules.",
      },
    ],
  };
}

/**
 * Creates rules preventing mixed async/await and Promise patterns
 *
 * These rules prevent mixing `.then()` chains with `async/await` in
 * the same function, enforcing consistent async patterns.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * async function fetchAndProcess() {
 *   const user = await getUser();  // async/await
 *   return saveUser(user)
 *     .then(result => result);     // .then() chain
 * }
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * async function fetchAndProcess() {
 *   const user = await getUser();
 *   const result = await saveUser(user);
 *   return result;
 * }
 * ```
 * @param _options Configuration options (reserved for future use)
 * @returns ESLint rules preventing mixed async patterns
 */
export function createAsyncPatternRules(
  _options: Record<string, never> = {},
): Linter.RulesRecord {
  return {
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/promise-function-async": "error",
  };
}

/**
 * Creates rules for enforcing code quality standards
 *
 * This function combines multiple code quality rules including:
 * - no-linter-disabling (prevents bypassing quality tools)
 * - no-barrel-exports (prevents bloated namespaces)
 * - async pattern consistency (prevents mixing await and .then())
 * @param options Configuration options for code quality rules
 * @param options.linterDisabling Configuration for the no-linter-disabling rule
 * @param options.barrelExports Configuration for barrel export prevention rules
 * @param options.barrelExports.allowedPatterns Glob patterns for files where barrel exports are allowed
 * @returns Complete set of code quality ESLint rules
 */
export function createCodeQualityRules(
  options: {
    linterDisabling?: NoLinterDisablingOptions;
    barrelExports?: { allowedPatterns?: string[] };
  } = {},
): Linter.RulesRecord {
  const linterDisablingRules: Linter.RulesRecord = {
    "@reasonabletech/no-linter-disabling": [
      "error",
      {
        allowInTests: true,
        requireJustification: true,
        ...options.linterDisabling,
      },
    ] as Linter.RuleEntry,
  };

  const barrelExportRules = createBarrelExportRules(options.barrelExports);
  const asyncPatternRules = createAsyncPatternRules();

  return mergeRuleConfigurations(
    linterDisablingRules,
    barrelExportRules,
    asyncPatternRules,
  );
}

/**
 * Configuration options for terminology enforcement
 */
export interface TerminologyOptions {
  /** Map of forbidden terms to preferred terms */
  forbiddenTerms?: Record<string, string>;
}

/**
 * Creates rules for enforcing platform-specific terminology
 *
 * Enforces consistent terminology across the codebase to prevent confusion
 * and maintain clear communication patterns.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * interface ActionSchema {
 *   toolCall: string;  // Wrong terminology
 * }
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * interface ActionSchema {
 *   action: string;  // Correct platform terminology
 * }
 * ```
 * @param options Configuration options for terminology rules
 * @param options.forbiddenTerms Map of forbidden terms to preferred alternatives
 * @returns ESLint rules enforcing terminology standards
 */
export function createTerminologyRules(
  options: TerminologyOptions = {},
): Linter.RulesRecord {
  const forbiddenTerms = options.forbiddenTerms ?? {
    toolCall: "action",
    tool_call: "action",
  };

  const patterns = Object.entries(forbiddenTerms).map(
    ([forbidden, required]) => ({
      selector: `Identifier[name='${forbidden}']`,
      message: `❌ Use '${required}' instead of '${forbidden}' for platform consistency.`,
    }),
  );

  return {
    "no-restricted-syntax": ["warn", ...patterns],
  };
}

/**
 * Configuration options for magic numbers detection
 */
export interface MagicNumbersOptions {
  /** Numbers that are allowed without constants (default: [-1, 0, 1, 2]) */
  allowedNumbers?: number[];
  /** File patterns where magic numbers are allowed */
  allowedPatterns?: string[];
}

/**
 * Creates rules for detecting magic numbers and strings
 *
 * Prevents hardcoded values that should be extracted to named constants,
 * improving maintainability and reducing duplication.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * const client = http.createClient("https://api.example.com/v1");  // Hardcoded URL
 * setTimeout(() => retry(), 5000);  // Magic timeout
 * if (retryCount > 3) { ... }       // Magic retry limit
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * const API_ENDPOINT = "https://api.example.com/v1";
 * const RETRY_DELAY_MS = 5000;
 * const MAX_RETRIES = 3;
 *
 * const client = http.createClient(API_ENDPOINT);
 * setTimeout(() => retry(), RETRY_DELAY_MS);
 * if (retryCount > MAX_RETRIES) { ... }
 * ```
 * @param options Configuration options for magic numbers detection
 * @param options.allowedNumbers Numbers that don't require constants
 * @param options.allowedPatterns File patterns where magic numbers are allowed
 * @returns ESLint rules detecting magic numbers
 */
export function createMagicNumbersRules(
  options: MagicNumbersOptions = {},
): Linter.RulesRecord {
  const allowed = options.allowedNumbers ?? [-1, 0, 1, 2];

  return {
    "no-magic-numbers": [
      "warn",
      {
        ignore: allowed,
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        detectObjects: false, // Don't flag object property values
      },
    ],
  };
}

/**
 * Preset for platform code quality rules
 *
 * This preset provides all code quality rules configured specifically
 * for platform project conventions.
 * @returns ESLint rules configured for platform projects
 */
export function createPlatformCodeQualityRules(): Linter.RulesRecord {
  return createCodeQualityRules({
    linterDisabling: {
      allowInTests: true,
      requireJustification: true,
      allowedRules: [],
    },
    barrelExports: {},
  });
}
