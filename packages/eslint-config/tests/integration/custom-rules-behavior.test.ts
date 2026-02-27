/**
 * Integration tests for custom ESLint rules
 *
 * These tests validate that rules actually catch violations and allow correct code
 * using ESLint's Linter to run rules against real code samples from fixtures.
 *
 * Note: This file tests ESLint's error messages, so message parsing is legitimate here
 */
 

import { describe, it, expect } from "vitest";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import {
  createErrorHandlingRules,
  createArchitecturePatternRules,
  createDependencyInjectionRules,
  createInlineErrorUnionRules,
  createPlatformConventionRules,
  createTypeSafetyRules,
} from "../../src/custom-rules/index.js";
import {
  createBarrelExportRules,
  createTerminologyRules,
} from "../../src/custom-rules/code-quality.js";
import { reasonableTechPlugin } from "../../src/plugin.js";

// reasonableTechPlugin uses @typescript-eslint/utils RuleModule types which are structurally
// compatible with ESLint's Plugin type at runtime but differ in strict type checking.
// Assert once here, matching the pattern used for tseslint.parser and tseslint.plugin above.
const reasonableTechEslintPlugin = reasonableTechPlugin as unknown as NonNullable<
  Linter.Config["plugins"]
>[string];

// tseslint.parser / tseslint.plugin use deliberately loose types
// (LooseParserModule / FlatConfig.Plugin) to avoid circular type dependencies.
// Assert to the ESLint interface types once here so callers stay type-safe.
const typescriptParser = tseslint.parser as unknown as Linter.Parser;
const typescriptPlugin = tseslint.plugin as unknown as NonNullable<
  Linter.Config["plugins"]
>[string];

// Import test data from fixtures
import {
  errorMessageIncludesViolation,
  errorMessageEqualityViolation,
  errorMessageStartsWithViolation,
  errorMessageRegexViolation,
  errorCodeCheckCorrect,
  instanceofCheckCorrect,
} from "../fixtures/code-samples/error-handling/message-parsing.js";

import {
  dependenciesInterfaceViolation,
  depsInterfaceViolation,
  dependenciesTypeAliasViolation,
  individualParametersCorrect,
  configInterfaceCorrect,
} from "../fixtures/code-samples/architecture/dependency-bundling.js";

import {
  asAnyCastViolation,
  doubleCastThroughAnyViolation,
  anyTypeAnnotationViolation,
  arrayAnyViolation,
  properTypeAssertionCorrect,
  unknownWithTypeGuardCorrect,
  genericTypesCorrect,
} from "../fixtures/code-samples/type-safety/any-casts.js";

import {
  manualSuccessResultViolation,
  manualErrorResultViolation,
  manualResultWithValueViolation,
  okHelperCorrect,
  resultHelperWithErrorHandlingCorrect,
} from "../fixtures/code-samples/platform-conventions/result-helpers.js";

import {
  multipleBarrelImportsViolation,
  singleBarrelImportViolation,
  mixedBarrelImportViolation,
  subpathImportCorrect,
  otherPackageBarrelImportsCorrect,
  mixedCorrectImportsCorrect,
} from "../fixtures/code-samples/platform-conventions/ui-barrel-imports.js";

import {
  getInstanceViolation,
  newInConstructorViolation,
  injectedDependencyCorrect,
  factoryFunctionCorrect,
} from "../fixtures/code-samples/architecture/dependency-injection.js";

import {
  exportAllViolation,
  namedExportCorrect,
  defaultExportCorrect,
} from "../fixtures/code-samples/code-quality/barrel-exports.js";

import {
  toolCallIdentifierViolation,
  actionIdentifierCorrect,
} from "../fixtures/code-samples/code-quality/terminology.js";

import {
  inlineResultUnionViolation,
  inlinePromiseResultUnionViolation,
  namedErrorTypeCorrect,
  namedPromiseErrorTypeCorrect,
} from "../fixtures/code-samples/error-handling/inline-error-unions.js";

describe("Custom Rules Integration Tests", () => {
  describe("Error Message Parsing Rules", () => {
    const linter = new Linter();
    // Only test the specific error message parsing rule
    const rules: Linter.RulesRecord = {
      "@reasonabletech/no-error-message-parsing":
        createErrorHandlingRules()["@reasonabletech/no-error-message-parsing"],
    };

    const config: Linter.Config = {
      rules,
      plugins: {
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch error.message.includes() violations", () => {
      const messages = linter.verify(errorMessageIncludesViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("parse error messages") ||
          m.message.includes("error.message.includes") ||
          m.message.includes("includes"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2); // Error
    });

    it("should catch error.message.startsWith() violations", () => {
      const messages = linter.verify(errorMessageStartsWithViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("parse error messages") ||
          m.message.includes("startsWith"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch error.message === comparison violations", () => {
      const messages = linter.verify(errorMessageEqualityViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("compare error messages") ||
          m.message.includes("error.message"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch error.message.match() violations", () => {
      const messages = linter.verify(errorMessageRegexViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("regex") ||
          m.message.includes("error.message") ||
          m.message.includes("parse error messages") ||
          m.message.includes(".match()"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should allow error.code and error.status checks", () => {
      const messages = linter.verify(errorCodeCheckCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });

    it("should allow instanceof checks", () => {
      const messages = linter.verify(instanceofCheckCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Dependency Bundling Rules", () => {
    const linter = new Linter();
    const rules = createArchitecturePatternRules();

    const config: Linter.Config = {
      rules,
      plugins: {
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch *Dependencies interface violations", () => {
      const messages = linter.verify(dependenciesInterfaceViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("Dependencies") ||
          m.message.includes("direct constructor parameters"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch *Deps interface violations", () => {
      const messages = linter.verify(depsInterfaceViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("Deps") ||
          m.message.includes("direct constructor parameters"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch *Dependencies type alias violations", () => {
      const messages = linter.verify(dependenciesTypeAliasViolation, config);

      const violation = messages.find((m) =>
        m.message.includes("Dependencies"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should allow individual constructor parameters", () => {
      const messages = linter.verify(individualParametersCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });

    it("should allow Config and Options interfaces", () => {
      const messages = linter.verify(configInterfaceCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Type Safety Rules", () => {
    const linter = new Linter();
    const rules = createTypeSafetyRules();

    const config: Linter.Config = {
      rules,
      plugins: {
        "@typescript-eslint": typescriptPlugin,
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch 'as any' cast violations", () => {
      const messages = linter.verify(asAnyCastViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("any") ||
          m.ruleId === "@typescript-eslint/no-explicit-any",
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch double cast through any violations", () => {
      const messages = linter.verify(doubleCastThroughAnyViolation, config);

      const violation = messages.find(
        (m) => m.message.includes("any") || m.message.includes("double cast"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch any type annotations", () => {
      const messages = linter.verify(anyTypeAnnotationViolation, config);

      const violations = messages.filter((m) => m.message.includes("any"));
      expect(violations.length).toBeGreaterThan(0);
    });

    it("should catch Array<any> violations", () => {
      const messages = linter.verify(arrayAnyViolation, config);

      const violation = messages.find((m) => m.message.includes("any"));
      expect(violation).toBeDefined();
    });

    it("should allow proper type assertions", () => {
      const messages = linter.verify(properTypeAssertionCorrect, config);

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("any"),
      );
      expect(violations).toHaveLength(0);
    });

    it("should allow unknown with type guards", () => {
      const messages = linter.verify(unknownWithTypeGuardCorrect, config);

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("any"),
      );
      expect(violations).toHaveLength(0);
    });

    it("should allow generic types", () => {
      const messages = linter.verify(genericTypesCorrect, config);

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("any"),
      );
      expect(violations).toHaveLength(0);
    });
  });

  describe("Platform Convention Rules - Result Helpers", () => {
    const linter = new Linter();
    const rules = createPlatformConventionRules();

    const config: Linter.Config = {
      rules,
      plugins: {
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch manual success result construction", () => {
      const messages = linter.verify(manualSuccessResultViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("ok()") ||
          m.message.includes("@reasonabletech/utils"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch manual error result construction", () => {
      const messages = linter.verify(manualErrorResultViolation, config);

      const violations = messages.filter(
        (m) => m.message.includes("ok()") || m.message.includes("err()"),
      );

      expect(violations.length).toBeGreaterThan(0);
    });

    it("should catch manual result with value property", () => {
      const messages = linter.verify(manualResultWithValueViolation, config);

      const violations = messages.filter(
        (m) => m.message.includes("ok()") || m.message.includes("err()"),
      );

      expect(violations.length).toBeGreaterThan(0);
    });

    it("should allow ok() and err() helper usage", () => {
      const messages = linter.verify(okHelperCorrect, config);

      const violations = messages.filter(
        (m) =>
          m.severity === 2 &&
          (m.message.includes("ok()") || m.message.includes("err()")),
      );
      expect(violations).toHaveLength(0);
    });

    it("should allow Result helpers with proper error handling", () => {
      const messages = linter.verify(
        resultHelperWithErrorHandlingCorrect,
        config,
      );

      const violations = messages.filter(
        (m) =>
          m.severity === 2 &&
          (m.message.includes("ok()") || m.message.includes("err()")),
      );
      expect(violations).toHaveLength(0);
    });
  });

  describe("Platform Convention Rules - UI Barrel Imports", () => {
    const linter = new Linter();
    const rules = {
      "no-restricted-syntax":
        createPlatformConventionRules()["no-restricted-syntax"],
    };

    it("should catch multiple barrel imports from @lovelace-ai/ui", () => {
      const messages = linter.verify(multipleBarrelImportsViolation, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violations = messages.filter(
        (m) =>
          m.message.includes("barrel imports") ||
          m.message.includes("@lovelace-ai/ui") ||
          m.message.includes("FORBIDDEN"),
      );

      expect(violations.length).toBeGreaterThan(0);
    });

    it("should catch single barrel import from @lovelace-ai/ui", () => {
      const messages = linter.verify(singleBarrelImportViolation, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violation = messages.find(
        (m) =>
          m.message.includes("barrel imports") ||
          m.message.includes("subpaths"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch mixed barrel imports", () => {
      const messages = linter.verify(mixedBarrelImportViolation, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violations = messages.filter((m) => m.message.includes("barrel"));

      expect(violations.length).toBeGreaterThan(0);
    });

    it("should allow default imports from @lovelace-ai/ui subpaths", () => {
      const messages = linter.verify(subpathImportCorrect, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("barrel"),
      );
      expect(violations).toHaveLength(0);
    });

    it("should allow barrel imports from other packages", () => {
      const messages = linter.verify(otherPackageBarrelImportsCorrect, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("barrel"),
      );
      expect(violations).toHaveLength(0);
    });

    it("should allow mixed imports with correct UI imports", () => {
      const messages = linter.verify(mixedCorrectImportsCorrect, {
        rules,
        languageOptions: {
          parser: typescriptParser,
          ecmaVersion: 2022,
          sourceType: "module",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
      });

      const violations = messages.filter(
        (m) => m.severity === 2 && m.message.includes("barrel"),
      );
      expect(violations).toHaveLength(0);
    });
  });

  describe("Dependency Injection Rules", () => {
    const linter = new Linter();
    const rules = createDependencyInjectionRules();

    const config: Linter.Config = {
      rules,
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch static getInstance() singleton pattern", () => {
      const messages = linter.verify(getInstanceViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("singleton") || m.message.includes("getInstance"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch new expressions inside constructor", () => {
      const messages = linter.verify(newInConstructorViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("create dependencies") ||
          m.message.includes("constructor"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should allow injected constructor dependencies", () => {
      const messages = linter.verify(injectedDependencyCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });

    it("should allow standalone factory functions", () => {
      const messages = linter.verify(factoryFunctionCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Barrel Export Rules", () => {
    const linter = new Linter();
    const rules = createBarrelExportRules();

    const config: Linter.Config = {
      rules,
      plugins: {
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch export * barrel exports", () => {
      const messages = linter.verify(exportAllViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("export *") ||
          m.message.includes("barrel exports"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should allow explicit named exports", () => {
      const messages = linter.verify(namedExportCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });

    it("should allow default exports", () => {
      const messages = linter.verify(defaultExportCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Terminology Rules", () => {
    const linter = new Linter();
    const rules = createTerminologyRules();

    const config: Linter.Config = {
      rules,
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should warn on deprecated 'toolCall' identifier", () => {
      const messages = linter.verify(toolCallIdentifierViolation, config);

      // Terminology rules use "warn" severity (1), not "error" (2)
      const warnings = messages.filter((m) => m.severity === 1);
      const violation = warnings.find(
        (m) => m.message.includes("action") || m.message.includes("toolCall"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(1);
    });

    it("should allow preferred 'action' identifier", () => {
      const messages = linter.verify(actionIdentifierCorrect, config);

      const warnings = messages.filter(
        (m) =>
          m.severity >= 1 &&
          (m.message.includes("toolCall") || m.message.includes("tool_call")),
      );
      expect(warnings).toHaveLength(0);
    });
  });

  describe("Inline Error Union Rules", () => {
    const linter = new Linter();
    const rules = createInlineErrorUnionRules();

    const config: Linter.Config = {
      rules,
      plugins: {
        "@reasonabletech": reasonableTechEslintPlugin,
      },
      languageOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    };

    it("should catch inline union in Result<T, E>", () => {
      const messages = linter.verify(inlineResultUnionViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("inline error unions") ||
          m.message.includes("documented named type"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should catch inline union in Promise<Result<T, E>>", () => {
      const messages = linter.verify(inlinePromiseResultUnionViolation, config);

      const violation = messages.find(
        (m) =>
          m.message.includes("inline error unions") ||
          m.message.includes("documented named type"),
      );

      expect(violation).toBeDefined();
      expect(violation?.severity).toBe(2);
    });

    it("should allow named error type in Result<T, E>", () => {
      const messages = linter.verify(namedErrorTypeCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });

    it("should allow named error type in Promise<Result<T, E>>", () => {
      const messages = linter.verify(namedPromiseErrorTypeCorrect, config);

      const violations = messages.filter((m) => m.severity === 2);
      expect(violations).toHaveLength(0);
    });
  });
});
