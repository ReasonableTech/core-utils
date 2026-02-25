/**
 * Custom ESLint rules for ReasonableTech projects
 *
 * This module provides a collection of reusable ESLint rule configurations
 * designed to enforce best practices for TypeScript development, with a focus
 * on type safety, error handling, and maintainable code patterns.
 *
 * The rules are designed to be:
 * - Configurable for different project contexts
 * - Reusable across different organizations and projects
 * - Focused on preventing common bugs and anti-patterns
 * - Easy to extract into a standalone ESLint plugin
 * Main entry point for custom ESLint rules
 */

// Re-export all error handling functionality
export {
  createErrorHandlingRules,
  createErrorMessageParsingRules,
  createErrorTypeDocumentationRules,
  createErrorTypeNamingRules,
  createInlineErrorUnionRules,
  createPlatformErrorHandlingRules,
  type ErrorHandlingRuleOptions,
} from "./error-handling.js";

// Re-export null/undefined checks rule
export {
  noNullUndefinedChecksRule,
  createNullUndefinedChecksRules,
} from "./null-undefined-checks.js";

// Re-export architecture pattern rules
export {
  createArchitecturePatternRules,
  createDependencyBundlingRules,
  createDependencyInjectionRules,
  createServiceArchitectureRules,
  createPlatformArchitecturePatternRules,
  type ArchitecturePatternRuleOptions,
} from "./architecture-patterns.js";

// Re-export type safety rules
export {
  createNoAnyRules,
  createResultTypeRules,
  createTypeSafetyRules,
  createPlatformTypeSafetyRules,
  type TypeSafetyRuleOptions,
} from "./type-safety.js";

// Re-export code quality rules
export {
  noLinterDisablingRule,
  createBarrelExportRules,
  createAsyncPatternRules,
  createTerminologyRules,
  createMagicNumbersRules,
  createCodeQualityRules,
  createPlatformCodeQualityRules,
  type NoLinterDisablingOptions,
  type TerminologyOptions,
  type MagicNumbersOptions,
} from "./code-quality.js";

// Re-export platform convention rules
export {
  createPlatformConventionRules,
  createResultHelperRules,
  createUIBarrelImportRules,
  createPlatformConventionPresetRules,
  type PlatformConventionRuleOptions,
} from "./platform-conventions.js";

// Re-export UI import boundary rules
export {
  createUILibraryImportRules,
  type UILibraryImportRuleOptions,
} from "./ui-library-imports.js";

// Re-export test quality rules
export { createNoTypeofInExpectRules } from "./test-quality.js";

// Re-export utilities
export {
  mergeRuleConfigurations,
  createConditionalRules,
  createExportedTypeSelector,
  createTypeReferenceSelector,
  createResultInlineUnionSelector,
  createPromiseResultInlineUnionSelector,
  createDocReference,
  isRuleEnabled,
  AST_SELECTORS,
  ERROR_MESSAGES,
  type BaseRuleOptions,
} from "./utils.js";

import type { Linter } from "eslint";
import {
  createErrorHandlingRules,
  createPlatformErrorHandlingRules,
  type ErrorHandlingRuleOptions,
} from "./error-handling.js";
import {
  createArchitecturePatternRules,
  createPlatformArchitecturePatternRules,
  type ArchitecturePatternRuleOptions,
} from "./architecture-patterns.js";
import {
  createTypeSafetyRules,
  createPlatformTypeSafetyRules,
  type TypeSafetyRuleOptions,
} from "./type-safety.js";
import {
  createCodeQualityRules,
  createPlatformCodeQualityRules,
  type NoLinterDisablingOptions,
} from "./code-quality.js";
import { mergeRuleConfigurations } from "./utils.js";

/**
 * Configuration options for all ReasonableTech custom rules
 */
export interface ReasonableTechRuleOptions {
  /** Error handling rule options */
  errorHandling?: Partial<ErrorHandlingRuleOptions>;
  /** Architecture pattern rule options */
  architecturePatterns?: Partial<ArchitecturePatternRuleOptions>;
  /** Type safety rule options */
  typeSafety?: Partial<TypeSafetyRuleOptions>;
  /** Code quality rule options */
  codeQuality?: {
    linterDisabling?: NoLinterDisablingOptions;
    barrelExports?: { allowedPatterns?: string[] };
  };
  /** Base URL for all documentation references */
  docBaseUrl?: string;
}

/**
 * Creates a complete set of ReasonableTech custom rules
 *
 * This function combines all available rule sets into a single configuration,
 * making it easy to apply consistent standards across projects.
 * @param options Configuration options for customizing rule behavior
 * @returns Complete ESLint rule configuration
 * @example
 * ```typescript
 * import { createReasonableTechRules } from './custom-rules';
 *
 * const rules = createReasonableTechRules({
 *   docBaseUrl: 'docs/standards/',
 *   errorHandling: {
 *     resultTypeName: 'Result',
 *     requireErrorTypeJSDoc: true,
 *   },
 * });
 * ```
 */
export function createReasonableTechRules(
  options: ReasonableTechRuleOptions = {},
): Linter.RulesRecord {
  const errorHandlingOptions = {
    docBaseUrl: options.docBaseUrl ?? "docs/standards/error-handling.md",
    ...options.errorHandling,
  };

  const architecturePatternOptions = {
    docBaseUrl:
      options.docBaseUrl ?? "docs/standards/architecture-principles.md",
    ...options.architecturePatterns,
  };

  const typeSafetyOptions = {
    docBaseUrl: options.docBaseUrl ?? "docs/standards/typescript-standards.md",
    ...options.typeSafety,
  };

  const codeQualityOptions = options.codeQuality ?? {};

  const errorHandlingRules = createErrorHandlingRules(errorHandlingOptions);
  const architecturePatternRules = createArchitecturePatternRules(
    architecturePatternOptions,
  );
  const typeSafetyRules = createTypeSafetyRules(typeSafetyOptions);
  const codeQualityRules = createCodeQualityRules(codeQualityOptions);

  return mergeRuleConfigurations(
    errorHandlingRules,
    architecturePatternRules,
    typeSafetyRules,
    codeQualityRules,
  );
}

/**
 * Preset configuration for platform projects
 *
 * This preset provides all the custom rules configured specifically
 * for platform project conventions and documentation structure.
 * @returns ESLint rule configuration for platform projects
 */
export function createPlatformRulePreset(): Linter.RulesRecord {
  return createReasonableTechRules({
    docBaseUrl: "docs/standards/error-handling.md",
    errorHandling: {
      errorTypePattern: ".*Error$",
      resultTypeName: "Result",
      requireErrorTypeJSDoc: true,
    },
    architecturePatterns: {
      enforceIndividualDependencies: true,
    },
    typeSafety: {
      docBaseUrl: "docs/standards/typescript-standards.md",
      allowInTests: false,
    },
    codeQuality: {
      linterDisabling: {
        allowInTests: true,
        requireJustification: true,
        allowedRules: [],
      },
      barrelExports: {},
    },
  });
}

/**
 * Preset configuration for generic ReasonableTech projects
 *
 * This preset provides sensible defaults that work well for most
 * TypeScript projects following ReasonableTech conventions.
 * @param docBaseUrl Base URL for documentation references
 * @returns ESLint rule configuration for generic projects
 */
export function createGenericRulePreset(
  docBaseUrl: string = "docs/",
): Linter.RulesRecord {
  return createReasonableTechRules({
    docBaseUrl: `${docBaseUrl}error-handling.md`,
    errorHandling: {
      errorTypePattern: ".*Error$",
      resultTypeName: "Result",
      requireErrorTypeJSDoc: true,
    },
  });
}

// Legacy exports for backward compatibility
export const errorHandlingRules: Linter.RulesRecord =
  createPlatformErrorHandlingRules();
export const architecturePatternRules: Linter.RulesRecord =
  createPlatformArchitecturePatternRules();
export const typeSafetyRules: Linter.RulesRecord =
  createPlatformTypeSafetyRules();
export const codeQualityRules: Linter.RulesRecord =
  createPlatformCodeQualityRules();
