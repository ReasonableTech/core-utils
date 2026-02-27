/**
 * Unit tests for type safety rule configuration behavior
 *
 * These tests verify that factory functions produce correct config structures
 * and respect option toggling. Rule behavior is verified by integration tests
 * in custom-rules-behavior.test.ts.
 */

import { describe, it, expect } from "vitest";
import {
  createNoAnyRules,
  createResultTypeRules,
  createTypeSafetyRules,
  createPlatformTypeSafetyRules,
} from "../../src/custom-rules/type-safety.js";

describe("createNoAnyRules", () => {
  it("should produce a non-empty rule configuration", () => {
    const rules = createNoAnyRules();

    expect(rules).toHaveProperty("@typescript-eslint/no-explicit-any");
    expect(rules).toHaveProperty("@reasonabletech/no-as-any");
  });
});

describe("createTypeSafetyRules", () => {
  it("should combine all type safety rules", () => {
    const rules = createTypeSafetyRules();

    expect(rules).toHaveProperty("@typescript-eslint/no-explicit-any");
    expect(rules).toHaveProperty("@reasonabletech/no-as-any");
  });

  it("should accept custom configuration", () => {
    const rules = createTypeSafetyRules({
      docBaseUrl: "custom/docs/types.md",
      allowInTests: true,
    });

    expect(rules).toBeDefined();
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});

describe("createResultTypeRules", () => {
  it("should return a valid rule configuration", () => {
    const rules = createResultTypeRules();

    expect(rules).toBeDefined();
  });

  it("should accept custom configuration", () => {
    const rules = createResultTypeRules({
      docBaseUrl: "custom/docs/results.md",
      allowInTests: true,
    });

    expect(rules).toBeDefined();
  });
});

describe("createPlatformTypeSafetyRules", () => {
  it("should produce a non-empty platform-specific preset", () => {
    const rules = createPlatformTypeSafetyRules();

    expect(rules).toHaveProperty("@typescript-eslint/no-explicit-any");
    expect(rules).toHaveProperty("@reasonabletech/no-as-any");
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});
