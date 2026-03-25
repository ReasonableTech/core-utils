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
 * Built-in constructor names that are safe to use inside constructors
 *
 * These are standard JavaScript/Web API data structures and value types
 * that do not represent service dependencies and therefore do not need
 * to be injected.
 */
const BUILTIN_CONSTRUCTORS = new Set([
  "Map",
  "Set",
  "Date",
  "Error",
  "URL",
  "RegExp",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Array",
  "Object",
  "Headers",
  "Request",
  "Response",
  "FormData",
  "Blob",
  "AbortController",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
]);

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
 * Detection is naming-based: interfaces and type aliases whose names end with
 * "Dependencies" or "Deps" are flagged regardless of their contents.
 *
 * ❌ FORBIDDEN (ANY "*Dependencies" or "*Deps" naming):
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
 * interface ServiceDeps {
 *   logger: Logger;
 *   database: Database;
 *   cache: Cache;
 * }
 * class MyService {
 *   constructor(private deps: ServiceDeps) {
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
    return {
      TSInterfaceDeclaration(node): void {
        const name = node.id.name;

        // Naming-based check: interfaces ending with "Dependencies" or "Deps"
        if (name.endsWith("Dependencies") || name.endsWith("Deps")) {
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
 * Custom ESLint rule that prevents creating service dependencies inside constructors
 *
 * This rule detects `new PascalCase()` expressions inside class constructors and
 * reports them as violations, since services should receive dependencies via
 * constructor parameters rather than creating them internally.
 *
 * **Exceptions**:
 * - Built-in constructors (Map, Set, Date, Error, etc.) are allowed because
 *   they are standard data structures, not service dependencies.
 * - `new` expressions inside default parameter values (AssignmentPattern) are
 *   allowed because the dependency CAN still be injected — the `new` only runs
 *   when no argument is provided.
 * @example
 * ```typescript
 * // ❌ FORBIDDEN: creating a dependency inside a constructor
 * class UserService {
 *   constructor(config: Config) {
 *     this.db = new Database(config); // Violation
 *   }
 * }
 *
 * // ✅ CORRECT: built-in constructors are fine
 * class CacheService {
 *   constructor() {
 *     this.cache = new Map();
 *   }
 * }
 *
 * // ✅ CORRECT: default parameter values are fine
 * class UserService {
 *   constructor(private db: Database = new Database()) {}
 * }
 * ```
 */
export const noConstructorInstantiationRule = ESLintUtils.RuleCreator(
  () => "docs/standards/architecture-principles.md",
)({
  name: "no-constructor-instantiation",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevents creating service dependencies inside constructors instead of injecting them",
    },
    messages: {
      constructorInstantiation:
        "Services should not create dependencies in constructor. Inject them via constructor parameters instead. Use default parameter values (e.g., `db: Database = new Database()`) if you need a default implementation.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node): void {
        const ancestors = context.sourceCode.getAncestors(node);

        // Check if we are inside a constructor MethodDefinition
        const constructorIndex = ancestors.findIndex(
          (ancestor): ancestor is TSESTree.MethodDefinition =>
            ancestor.type === AST_NODE_TYPES.MethodDefinition &&
            ancestor.kind === "constructor",
        );

        if (constructorIndex === -1) {
          return;
        }

        // Check if the callee is a built-in constructor
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          BUILTIN_CONSTRUCTORS.has(node.callee.name)
        ) {
          return;
        }

        // Check if the NewExpression is inside an AssignmentPattern (default param)
        const ancestorsAfterConstructor = ancestors.slice(constructorIndex + 1);
        const isInDefaultParam = ancestorsAfterConstructor.some(
          (ancestor) => ancestor.type === AST_NODE_TYPES.AssignmentPattern,
        );

        if (isInDefaultParam) {
          return;
        }

        context.report({
          node,
          messageId: "constructorInstantiation",
        });
      },
    };
  },
});

/**
 * Creates rules that prevent wrapping service dependencies in container objects
 *
 * Uses the `@reasonabletech/no-dependency-bundling` custom rule which detects
 * naming patterns (*Dependencies, *Deps) on interfaces and type aliases.
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
 * Uses `no-restricted-syntax` to ban `getInstance()` singletons and the
 * `@reasonabletech/no-constructor-instantiation` custom rule to detect
 * `new` expressions inside constructors (with built-in and default-param
 * exceptions).
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
    ],
    "@reasonabletech/no-constructor-instantiation": "error",
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
