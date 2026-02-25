/**
 * Unit tests for architecture pattern rule configuration behavior
 *
 * These tests verify that factory functions respect option toggling and
 * produce valid config structures. Rule behavior against real code is
 * verified by integration tests in custom-rules-behavior.test.ts.
 */

import { describe, it, expect } from "vitest";
import {
  createArchitecturePatternRules,
  createDependencyBundlingRules,
  createDependencyInjectionRules,
  createPlatformArchitecturePatternRules,
} from "../../src/custom-rules/architecture-patterns.js";

describe("createDependencyBundlingRules", () => {
  it("should produce rules when enforceIndividualDependencies is true", () => {
    const rules = createDependencyBundlingRules({
      enforceIndividualDependencies: true,
    });

    expect(rules).toHaveProperty("@reasonabletech/no-dependency-bundling");
  });

  it("should return empty object when enforceIndividualDependencies is false", () => {
    const rules = createDependencyBundlingRules({
      enforceIndividualDependencies: false,
    });

    expect(rules).toEqual({});
  });
});

describe("createArchitecturePatternRules", () => {
  it("should combine all architecture pattern rules", () => {
    const rules = createArchitecturePatternRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("should accept custom configuration", () => {
    const rules = createArchitecturePatternRules({
      docBaseUrl: "custom/docs/arch.md",
      enforceIndividualDependencies: true,
    });

    expect(rules).toBeDefined();
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});

describe("createDependencyInjectionRules", () => {
  it("should produce a non-empty rule configuration", () => {
    const rules = createDependencyInjectionRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
  });
});

describe("createPlatformArchitecturePatternRules", () => {
  it("should produce a non-empty platform-specific preset", () => {
    const rules = createPlatformArchitecturePatternRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});
