/**
 * Integration tests for the no-typeof-in-expect rule
 *
 * These tests run the rule against real code samples to verify it fires on
 * forbidden patterns and stays silent on correct patterns.
 *
 * Note: This file tests ESLint rule behaviour against code strings, so checking
 * ESLint's own message text here is legitimate (we authored the message).
 */

import { describe, it, expect } from "vitest";
import { Linter } from "eslint";
import { createNoTypeofInExpectRules } from "../../src/custom-rules/test-quality.js";
import {
  typeofFunctionViolation,
  typeofObjectViolation,
  typeofToEqualViolation,
  typeofToStrictEqualViolation,
  assertReturnValueCorrect,
  assertObjectShapeCorrect,
  instanceofCheckCorrect,
} from "../fixtures/code-samples/test-quality/typeof-in-expect.js";

// no-restricted-syntax is a pure AST syntax rule — the default espree parser
// handles it fine without any TypeScript-specific parser.
const linterConfig: Linter.Config = {
  rules: createNoTypeofInExpectRules(),
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
};

function lint(code: string): Linter.LintMessage[] {
  return new Linter().verify(code, linterConfig);
}

function violations(messages: Linter.LintMessage[]): Linter.LintMessage[] {
  return messages.filter((m) => m.severity === 2);
}

describe("no-typeof-in-expect rule", () => {
  describe("violations — patterns that must be caught", () => {
    it("flags expect(typeof fn).toBe('function')", () => {
      const messages = lint(typeofFunctionViolation);
      expect(violations(messages)).toHaveLength(1);
      expect(violations(messages)[0]?.message).toContain("FORBIDDEN");
    });

    it("flags expect(typeof obj).toBe('object')", () => {
      const messages = lint(typeofObjectViolation);
      expect(violations(messages)).toHaveLength(1);
    });

    it("flags expect(typeof x).toEqual('string')", () => {
      const messages = lint(typeofToEqualViolation);
      expect(violations(messages)).toHaveLength(1);
    });

    it("flags expect(typeof x).toStrictEqual('number')", () => {
      const messages = lint(typeofToStrictEqualViolation);
      expect(violations(messages)).toHaveLength(1);
    });
  });

  describe("valid patterns — must not be flagged", () => {
    it("allows asserting an actual return value", () => {
      expect(violations(lint(assertReturnValueCorrect))).toHaveLength(0);
    });

    it("allows asserting object shape with toMatchObject", () => {
      expect(violations(lint(assertObjectShapeCorrect))).toHaveLength(0);
    });

    it("allows toBeInstanceOf for class instances", () => {
      expect(violations(lint(instanceofCheckCorrect))).toHaveLength(0);
    });
  });
});
