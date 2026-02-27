/**
 * Unit tests for code quality rule configuration behavior
 *
 * These tests verify that factory functions respect option toggling and
 * produce valid config structures. Rule behavior against real code is
 * verified by integration tests in custom-rules-behavior.test.ts.
 */

import { describe, it, expect } from "vitest";
import {
  createBarrelExportRules,
  createAsyncPatternRules,
  createTerminologyRules,
  createMagicNumbersRules,
  createCodeQualityRules,
  createPlatformCodeQualityRules,
} from "../../src/custom-rules/code-quality.js";

describe("createBarrelExportRules", () => {
  it("should produce a non-empty rule configuration", () => {
    const rules = createBarrelExportRules();

    expect(rules).toHaveProperty("@reasonabletech/no-barrel-exports");
  });
});

describe("createCodeQualityRules", () => {
  it("should combine all code quality rules", () => {
    const rules = createCodeQualityRules();

    expect(rules).toHaveProperty("@reasonabletech/no-barrel-exports");
    expect(rules).toHaveProperty("@typescript-eslint/no-misused-promises");
  });

  it("should configure no-linter-disabling rule", () => {
    const rules = createCodeQualityRules({
      linterDisabling: {
        allowInTests: false,
        requireJustification: false,
      },
    });

    expect(rules).toHaveProperty("@reasonabletech/no-linter-disabling");
  });

  it("should accept custom configuration for barrel exports", () => {
    const rules = createCodeQualityRules({
      barrelExports: {
        allowedPatterns: ["**/index.ts"],
      },
    });

    expect(rules).toBeDefined();
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});

describe("createAsyncPatternRules", () => {
  it("should create async pattern consistency rules", () => {
    const rules = createAsyncPatternRules();

    expect(rules).toHaveProperty("@typescript-eslint/no-misused-promises");
    expect(rules).toHaveProperty("@typescript-eslint/no-floating-promises");
    expect(rules).toHaveProperty("@typescript-eslint/await-thenable");
    expect(rules).toHaveProperty("@typescript-eslint/promise-function-async");
  });

  it("should set error severity for all async rules", () => {
    const rules = createAsyncPatternRules();

    expect(rules["@typescript-eslint/no-misused-promises"]).toBe("error");
    expect(rules["@typescript-eslint/no-floating-promises"]).toBe("error");
    expect(rules["@typescript-eslint/await-thenable"]).toBe("error");
    expect(rules["@typescript-eslint/promise-function-async"]).toBe("error");
  });
});

describe("createPlatformCodeQualityRules", () => {
  it("should produce a non-empty platform-specific preset", () => {
    const rules = createPlatformCodeQualityRules();

    expect(rules).toHaveProperty("@reasonabletech/no-barrel-exports");
    expect(rules).toHaveProperty("@typescript-eslint/no-misused-promises");
  });
});

describe("createTerminologyRules", () => {
  it("should produce a non-empty rule configuration", () => {
    const rules = createTerminologyRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("should accept custom forbidden terms", () => {
    const rules = createTerminologyRules({
      forbiddenTerms: {
        oldTerm: "newTerm",
      },
    });

    expect(rules).toHaveProperty("no-restricted-syntax");
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});

describe("createMagicNumbersRules", () => {
  it("should produce a non-empty rule configuration", () => {
    const rules = createMagicNumbersRules();

    expect(rules).toHaveProperty("no-magic-numbers");
  });

  it("should allow common numbers by default", () => {
    const rules = createMagicNumbersRules();
    const magicNumbersRule = rules["no-magic-numbers"] as [
      string,
      { ignore?: number[] },
    ];

    expect(magicNumbersRule[1].ignore).toEqual([-1, 0, 1, 2]);
  });

  it("should accept custom allowed numbers", () => {
    const rules = createMagicNumbersRules({
      allowedNumbers: [0, 1, 100],
    });

    const magicNumbersRule = rules["no-magic-numbers"] as [
      string,
      { ignore?: number[] },
    ];

    expect(magicNumbersRule[1].ignore).toEqual([0, 1, 100]);
  });
});
