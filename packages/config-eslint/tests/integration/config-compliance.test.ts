/**
 * ESLint configuration structure checks
 *
 * These tests verify that the generated ESLint configs include
 * the critical rule coverage we rely on across the monorepo.
 * Rather than invoking ESLint at runtime (which would require
 * a full TypeScript project and globals), we inspect the flat
 * config objects to ensure the expected rules are present and
 * set to the intended severities.
 */

import { describe, expect, it } from "vitest";
import type { Linter } from "eslint";
import { createTypeAwareConfig } from "../../src/index.js";

type RuleMap = Record<string, Linter.RuleEntry>;

const severityValue = (rule: Linter.RuleEntry | undefined): number | null => {
  if (rule == null) {
    return null;
  }
  if (typeof rule === "number") {
    return rule;
  }
  if (typeof rule === "string") {
    if (rule === "off") {
      return 0;
    }
    if (rule === "warn") {
      return 1;
    }
    return 2;
  }
  return severityValue(rule[0]);
};

const mergeRules = (configs: Linter.Config[]): RuleMap =>
  configs.reduce<RuleMap>((acc, config) => {
    if (config.rules != null) {
      Object.assign(acc, config.rules);
    }
    return acc;
  }, {});

describe("Type-aware ESLint configuration", () => {
  const config = createTypeAwareConfig(process.cwd());
  const rules = mergeRules(config);

  const criticalTypeScriptRules = [
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/no-unused-vars",
    "@typescript-eslint/explicit-function-return-type",
    "@typescript-eslint/no-require-imports",
    "@typescript-eslint/ban-ts-comment",
    "@typescript-eslint/no-non-null-assertion",
    "@typescript-eslint/no-floating-promises",
    "@typescript-eslint/no-misused-promises",
    "@typescript-eslint/strict-boolean-expressions",
    "@typescript-eslint/switch-exhaustiveness-check",
    "@typescript-eslint/no-unsafe-assignment",
    "@typescript-eslint/no-unsafe-call",
    "@typescript-eslint/no-unsafe-member-access",
    "@typescript-eslint/prefer-optional-chain",
    "@typescript-eslint/prefer-nullish-coalescing",
    "@typescript-eslint/require-array-sort-compare",
  ];

  const coreJavaScriptRules = [
    "prefer-const",
    "no-throw-literal",
    "prefer-promise-reject-errors",
  ];

  criticalTypeScriptRules.forEach((ruleId) => {
    it(`includes required TypeScript rule: ${ruleId}`, () => {
      expect(severityValue(rules[ruleId])).toBe(2);
    });
  });

  coreJavaScriptRules.forEach((ruleId) => {
    it(`includes required JavaScript rule: ${ruleId}`, () => {
      expect(severityValue(rules[ruleId])).toBe(2);
    });
  });

  it("keeps the configuration array non-empty", () => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });
});
