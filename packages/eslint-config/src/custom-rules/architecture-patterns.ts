/**
 * Architecture pattern rules for the platform
 *
 * These rules enforce architectural best practices and prevent common
 * anti-patterns in service design and dependency injection.
 */

import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import type { Linter } from "eslint";
import { mergeRuleConfigurations } from "./utils.js";

/**
 * Configuration options for architecture pattern rules
 */
export interface ArchitecturePatternRuleOptions {
  /** Base URL for documentation references */
  docBaseUrl?: string;
  /** Whether to enforce individual dependency injection (default: true) */
  enforceIndividualDependencies?: boolean;
}

/**
 * Default configuration for architecture pattern rules
 */
const DEFAULT_OPTIONS: Required<ArchitecturePatternRuleOptions> = {
  docBaseUrl: "docs/standards/architecture-principles.md",
  enforceIndividualDependencies: true,
};

/**
 * Custom ESLint rule that prevents bundling service dependencies into objects
 *
 * This rule prevents the anti-pattern of wrapping service dependencies in
 * container objects. The pattern itself is wrong - it doesn't matter if you
 * bundle 1 service or 10 services, wrapping them breaks dependency injection.
 *
 * **Core Principle**: Services should receive dependencies as direct constructor
 * parameters, not wrapped in objects. This makes dependencies explicit, improves
 * testability, and prevents tight coupling.
 *
 * ❌ FORBIDDEN (ANY "*Dependencies" bundling):
 * ```typescript
 * // Wrong: Even ONE service wrapped is bad
 * interface AuthDependencies {
 *   apiKeyService: ApiKeyService;
 * }
 * function initializeAuth(deps: AuthDependencies) {
 *   // Creates indirection, hides dependency
 * }
 *
 * // Wrong: Multiple services bundled
 * interface ServiceDependencies {
 *   logger: Logger;
 *   database: Database;
 *   cache: Cache;
 * }
 * class MyService {
 *   constructor(private deps: ServiceDependencies) {
 *     // Tight coupling to the bundle structure
 *   }
 * }
 * ```
 *
 * ✅ CORRECT (direct parameter injection):
 * ```typescript
 * // Right: Direct parameter
 * function initializeAuth(apiKeyService: ApiKeyService) {
 *   // Dependency is explicit and visible
 * }
 *
 * // Right: Individual injection
 * class MyService {
 *   constructor(
 *     private readonly logger: Logger,
 *     private readonly database: Database,
 *     private readonly cache: Cache,
 *   ) {
 *     // Each dependency is explicit and independently injectable
 *   }
 * }
 * ```
 *
 * **Why this matters**:
 * - Bundling hides which dependencies are actually used
 * - Makes mocking harder (must mock entire bundle)
 * - Creates coupling to the bundle structure
 * - Prevents partial initialization for testing
 * - Use naming like "*Config" or "*Options" for true configuration data (not services)
 */
export const noDependencyBundlingRule = ESLintUtils.RuleCreator(
  () => "docs/standards/architecture-principles.md",
)({
  name: "no-dependency-bundling",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents wrapping service dependencies in container objects (ANY count)",
    },
    messages: {
      dependencyBundle:
        "❌ FORBIDDEN: Never create '{{name}}' interfaces. The pattern itself is wrong - inject dependencies as direct constructor parameters, not wrapped in objects. Use '*Config' or '*Options' for true configuration data (not services).",
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
      docBaseUrl: "docs/standards/architecture-principles.md",
    },
  ],
  create(context) {
    /**
     * Detects if a property type looks like a service instance (not configuration data)
     * @param property - AST node representing a type element
     * @returns True if the property type appears to be a service instance
     */
    function isServiceLikeProperty(property: TSESTree.TypeElement): boolean {
      if (
        property.type !== AST_NODE_TYPES.TSPropertySignature ||
        property.typeAnnotation === undefined
      ) {
        return false;
      }

      const typeAnnotation = property.typeAnnotation.typeAnnotation;

      // Check for type references (class/interface instances, not primitives)
      if (typeAnnotation.type === AST_NODE_TYPES.TSTypeReference) {
        const typeName = typeAnnotation.typeName;

        if (typeName.type === AST_NODE_TYPES.Identifier) {
          const name = typeName.name;

          // PascalCase type = likely a class/service instance
          // Exclude common utility types and primitives
          const utilityTypes = new Set([
            "String",
            "Number",
            "Boolean",
            "Date",
            "RegExp",
            "Array",
            "Promise",
            "Record",
            "Partial",
            "Required",
            "Readonly",
            "Pick",
            "Omit",
            "Exclude",
            "Extract",
            "NonNullable",
            "ReturnType",
            "Parameters",
            "Map",
            "Set",
            "WeakMap",
            "WeakSet",
          ]);

          if (
            name.startsWith(name[0].toUpperCase()) &&
            !utilityTypes.has(name)
          ) {
            return true;
          }
        }
      }

      return false;
    }

    return {
      TSInterfaceDeclaration(node): void {
        const name = node.id.name;

        // 1. STRONG CHECK: Obvious naming patterns
        if (name.endsWith("Dependencies") || name.endsWith("Deps")) {
          context.report({
            node: node.id,
            messageId: "dependencyBundle",
            data: { name },
          });
          return;
        }

        // 2. STRUCTURAL CHECK: Detect service bundling regardless of name
        // If interface has 3+ service-like properties, likely a dependency bundle
        const serviceLikeProperties = node.body.body.filter(
          isServiceLikeProperty,
        );

        if (serviceLikeProperties.length >= 3) {
          context.report({
            node: node.id,
            messageId: "dependencyBundle",
            data: { name },
          });
        }
      },

      TSTypeAliasDeclaration(node): void {
        const name = node.id.name;

        // Check type aliases ending with "Dependencies" or "Deps"
        if (name.endsWith("Dependencies") || name.endsWith("Deps")) {
          context.report({
            node: node.id,
            messageId: "dependencyBundle",
            data: { name },
          });
        }
      },
    };
  },
});

/**
 * Creates rules that prevent wrapping service dependencies in container objects
 *
 * Uses the `@reasonabletech/no-dependency-bundling` custom rule which detects both
 * naming patterns (*Dependencies, *Deps) and structural bundling (3+ service-like
 * properties).
 * @param options Configuration options for architecture pattern rules
 * @returns ESLint rules that prevent dependency bundling
 */
export function createDependencyBundlingRules(
  options: ArchitecturePatternRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!config.enforceIndividualDependencies) {
    return {};
  }

  return {
    "@reasonabletech/no-dependency-bundling": [
      "error",
      {
        docBaseUrl: config.docBaseUrl,
      },
    ] as Linter.RuleEntry,
  };
}

/**
 * Creates rules that enforce dependency injection patterns
 *
 * These rules prevent services from creating their own dependencies
 * or using singleton patterns, enforcing proper dependency injection.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * export class UserService {
 *   static getInstance() { return instance; } // Singleton
 *
 *   constructor(config: Config) {
 *     this.db = new Database(config); // Creates own dependency
 *   }
 * }
 * ```
 *
 * ✅ CORRECT:
 * ```typescript
 * export class UserService {
 *   constructor(
 *     private db: Database,     // Injected dependency
 *     private config: Config,
 *   ) {}
 * }
 * ```
 * @param _options Configuration options for architecture pattern rules (reserved for future use)
 * @returns ESLint rules that enforce dependency injection
 */
export function createDependencyInjectionRules(
  _options: ArchitecturePatternRuleOptions = {},
): Linter.RulesRecord {
  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: "MethodDefinition[static=true][key.name='getInstance']",
        message: `❌ FORBIDDEN: Never use singleton pattern with getInstance(). Use dependency injection instead.`,
      },
      {
        selector:
          "MethodDefinition[kind='constructor'] NewExpression[callee.name=/^[A-Z]/]",
        message: `❌ FORBIDDEN: Services should not create dependencies in constructor. Inject them via constructor parameters instead.`,
      },
    ],
  };
}

/**
 * Creates rules that enforce proper service architecture patterns
 *
 * Enforces patterns like:
 * - Individual dependency injection (no god objects)
 * - Required dependencies must be required constructor parameters
 * - Services should accept dependencies, not create them
 * @param options Configuration options for architecture pattern rules
 * @returns ESLint rules that enforce service architecture patterns
 */
export function createServiceArchitectureRules(
  options: ArchitecturePatternRuleOptions = {},
): Linter.RulesRecord {
  const dependencyInjectionRules = createDependencyInjectionRules(options);

  return mergeRuleConfigurations(dependencyInjectionRules);
}

/**
 * Creates a complete set of architecture pattern rules
 *
 * This is the main function that combines all architecture pattern rules
 * into a single configuration object.
 * @param options Configuration options for architecture pattern rules
 * @returns Complete set of architecture pattern ESLint rules
 */
export function createArchitecturePatternRules(
  options: ArchitecturePatternRuleOptions = {},
): Linter.RulesRecord {
  const dependencyBundlingRules = createDependencyBundlingRules(options);
  const serviceArchitectureRules = createServiceArchitectureRules(options);

  return mergeRuleConfigurations(
    dependencyBundlingRules,
    serviceArchitectureRules,
  );
}

/**
 * Preset for platform architecture pattern rules
 * @returns ESLint rules configured for platform projects
 */
export function createPlatformArchitecturePatternRules(): Linter.RulesRecord {
  return createArchitecturePatternRules({
    docBaseUrl: "docs/standards/architecture-principles.md",
    enforceIndividualDependencies: true,
  });
}
