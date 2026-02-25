/**
 * Utility functions for custom ESLint rules
 *
 * These utilities help with rule configuration, AST selectors,
 * and other common patterns used across custom rules.
 */

import type { Linter } from "eslint";

/**
 * Base configuration interface for all custom rules
 */
export interface BaseRuleOptions {
  /** Base URL for documentation references */
  docBaseUrl?: string;
  /** Whether to enable this rule set (default: true) */
  enabled?: boolean;
}

/**
 * Merges rule configurations, handling the no-restricted-syntax rule specially
 *
 * Since multiple rule creators may want to add patterns to no-restricted-syntax,
 * this function properly merges them into a single rule configuration.
 * @param ruleConfigs Multiple ESLint rule configuration objects to merge
 * @returns Merged ESLint rule configuration
 */
export function mergeRuleConfigurations(
  ...ruleConfigs: Linter.RulesRecord[]
): Linter.RulesRecord {
  const merged: Linter.RulesRecord = {};
  const restrictedSyntaxPatterns: Array<{
    selector: string;
    message: string;
  }> = [];

  for (const config of ruleConfigs) {
    for (const [ruleName, ruleConfig] of Object.entries(config)) {
      if (ruleName === "no-restricted-syntax" && Array.isArray(ruleConfig)) {
        // Extract patterns from no-restricted-syntax rules
        const [level, ...patterns] = ruleConfig;
        if (level === "error" || level === "warn") {
          restrictedSyntaxPatterns.push(
            ...(patterns as Array<{ selector: string; message: string }>),
          );
        }
      } else {
        // For other rules, last one wins (allows overrides)
        merged[ruleName] = ruleConfig;
      }
    }
  }

  // Deduplicate patterns by selector (last occurrence wins for override semantics).
  // ESLint 9.x rejects configs with duplicate no-restricted-syntax selectors.
  const deduplicatedPatterns = [
    ...new Map(restrictedSyntaxPatterns.map((p) => [p.selector, p])).values(),
  ];

  // Add the merged no-restricted-syntax rule if we have patterns
  if (deduplicatedPatterns.length > 0) {
    merged["no-restricted-syntax"] = ["error", ...deduplicatedPatterns];
  }

  return merged;
}

/**
 * Creates a rule configuration that can be conditionally enabled
 * @param ruleFactory Function that creates the rules to conditionally apply
 * @param options Options that determine whether to apply the rules
 * @returns ESLint rules or empty object based on conditions
 */
export function createConditionalRules(
  ruleFactory: () => Linter.RulesRecord,
  options: BaseRuleOptions,
): Linter.RulesRecord {
  if (options.enabled === false) {
    return {};
  }
  return ruleFactory();
}

/**
 * Common AST selector patterns for TypeScript constructs
 */
export const AST_SELECTORS = {
  // Error-related selectors
  ERROR_MESSAGE_ACCESS: "[callee.object.property.name='message']",
  EXPORTED_TYPE_ALIAS: "ExportNamedDeclaration > TSTypeAliasDeclaration",
  TYPE_REFERENCE: "TSTypeReference",
  UNION_TYPE_WITH_LITERALS: "TSUnionType:has(TSLiteralType)",

  // Method call selectors
  STRING_INCLUDES: "[callee.property.name='includes']",
  STRING_STARTS_WITH: "[callee.property.name='startsWith']",
  STRING_ENDS_WITH: "[callee.property.name='endsWith']",
  REGEX_MATCH: "[callee.property.name='match']",
  REGEX_TEST: "[callee.property.name='test']",

  // Binary operation selectors
  STRICT_EQUALITY: "BinaryExpression[operator='===']",
  LOOSE_EQUALITY: "BinaryExpression[operator='==']",
} as const;

/**
 * Creates an AST selector for exported type aliases matching a pattern
 * @param namePattern Regular expression pattern for type names
 * @returns AST selector string for matching exported types
 */
export function createExportedTypeSelector(namePattern: string): string {
  return `${AST_SELECTORS.EXPORTED_TYPE_ALIAS}[id.name=/${namePattern}/]`;
}

/**
 * Creates an AST selector for type references with specific type names
 * @param typeName Name of the type to select references for
 * @returns AST selector string for type references
 */
export function createTypeReferenceSelector(typeName: string): string {
  return `${AST_SELECTORS.TYPE_REFERENCE}[typeName.name='${typeName}']`;
}

/**
 * Creates an AST selector for Result type inline unions
 * @param resultTypeName Name of the Result type to check
 * @returns AST selector string for inline unions in Result types
 */
export function createResultInlineUnionSelector(
  resultTypeName: string = "Result",
): string {
  return `${createTypeReferenceSelector(resultTypeName)} ${AST_SELECTORS.UNION_TYPE_WITH_LITERALS}`;
}

/**
 * Creates an AST selector for Promise<Result<T, E>> inline unions
 * @param resultTypeName Name of the Result type to check within Promise
 * @returns AST selector string for inline unions in Promise<Result> types
 */
export function createPromiseResultInlineUnionSelector(
  resultTypeName: string = "Result",
): string {
  return `${createTypeReferenceSelector("Promise")} TSTypeParameterInstantiation ${createTypeReferenceSelector(resultTypeName)} ${AST_SELECTORS.UNION_TYPE_WITH_LITERALS}`;
}

/**
 * Standard error messages for common violations
 */
export const ERROR_MESSAGES = {
  NO_ERROR_MESSAGE_PARSING:
    "❌ FORBIDDEN: Never parse error messages. Use error.code, error.status, or instanceof checks instead.",
  NO_INLINE_ERROR_UNIONS:
    "❌ FORBIDDEN: Never use inline error unions. Extract to a documented named type.",
  REQUIRE_ERROR_TYPE_DOCS:
    "❌ REQUIRED: All error types must have comprehensive JSDoc documentation.",
  FOLLOW_NAMING_CONVENTION:
    "❌ REQUIRED: Follow established naming conventions for error types and codes.",
} as const;

/**
 * Creates a documentation reference URL
 * @param baseUrl Base URL for the documentation
 * @param section Optional section anchor to append
 * @returns Complete documentation URL with optional section
 */
export function createDocReference(baseUrl: string, section?: string): string {
  if (section !== undefined && section !== "") {
    return `${baseUrl}#${section}`;
  }
  return baseUrl;
}

/**
 * Type guard to check if a rule config is enabled
 * @param ruleConfig ESLint rule configuration entry
 * @returns True if the rule is enabled, false otherwise
 */
export function isRuleEnabled(
  ruleConfig: Linter.RuleEntry | undefined,
): boolean {
  if (ruleConfig === undefined) {
    return false;
  }
  if (Array.isArray(ruleConfig)) {
    return ruleConfig[0] === "error" || ruleConfig[0] === "warn";
  }
  return ruleConfig === "error" || ruleConfig === "warn";
}
