/**
 * Unit tests for custom rules module
 *
 * These tests verify factory function creation and mergeRuleConfigurations.
 * Rule behavior against real code is verified by integration tests in
 * custom-rules-behavior.test.ts.
 */

import { describe, it, expect } from "vitest";
import type { Linter } from "eslint";
import {
  createErrorHandlingRules,
  createPlatformRulePreset,
  createGenericRulePreset,
  createReasonableTechRules,
  mergeRuleConfigurations,
} from "../../src/custom-rules/index.js";

describe("Custom Rules Module", () => {
  describe("createErrorHandlingRules", () => {
    it("should create rules with default configuration", () => {
      const rules = createErrorHandlingRules();

      expect(rules).toBeDefined();
      expect(rules["no-restricted-syntax"]).toBeDefined();
      expect(rules["jsdoc/require-jsdoc"]).toBeDefined();
      expect(rules["@typescript-eslint/naming-convention"]).toBeDefined();
    });

    it("should disable JSDoc rules when requireErrorTypeJSDoc is false", () => {
      const rules = createErrorHandlingRules({
        requireErrorTypeJSDoc: false,
      });

      expect(rules).toBeDefined();
      expect(rules["no-restricted-syntax"]).toBeDefined();
      expect(rules["jsdoc/require-jsdoc"]).toBeUndefined();
    });
  });

  describe("createPlatformRulePreset", () => {
    it("should produce a non-empty rule preset", () => {
      const rules = createPlatformRulePreset();

      expect(rules).toBeDefined();
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });
  });

  describe("createGenericRulePreset", () => {
    it("should accept a custom doc URL", () => {
      const rules = createGenericRulePreset("https://example.com/docs/");

      expect(rules).toBeDefined();
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });
  });

  describe("createReasonableTechRules", () => {
    it("should produce a non-empty complete rule set", () => {
      const rules = createReasonableTechRules({
        docBaseUrl: "test/docs/",
        errorHandling: {
          resultTypeName: "TestResult",
        },
      });

      expect(rules).toBeDefined();
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });
  });

  describe("mergeRuleConfigurations", () => {
    it("should merge multiple rule configurations", () => {
      const rules1: Linter.RulesRecord = {
        rule1: "error",
        "no-restricted-syntax": [
          "error",
          { selector: "test1", message: "msg1" },
        ],
      };
      const rules2: Linter.RulesRecord = {
        rule2: "warn",
        "no-restricted-syntax": [
          "error",
          { selector: "test2", message: "msg2" },
        ],
      };

      const merged = mergeRuleConfigurations(rules1, rules2);

      expect(merged.rule1).toBe("error");
      expect(merged.rule2).toBe("warn");
      expect(merged["no-restricted-syntax"]).toEqual([
        "error",
        { selector: "test1", message: "msg1" },
        { selector: "test2", message: "msg2" },
      ]);
    });
  });
});
