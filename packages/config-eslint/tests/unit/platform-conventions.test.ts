/**
 * Unit tests for platform convention rule configuration behavior
 *
 * These tests verify that factory functions respect option toggling and
 * produce valid config structures. Rule behavior against real code is
 * verified by integration tests in custom-rules-behavior.test.ts.
 */

import { describe, it, expect } from "vitest";
import {
  createPlatformConventionRules,
  createResultHelperRules,
  createPlatformConventionPresetRules,
} from "../../src/custom-rules/platform-conventions.js";

describe("createResultHelperRules", () => {
  it("should produce rules when enforceResultHelpers is true", () => {
    const rules = createResultHelperRules({
      enforceResultHelpers: true,
    });

    expect(rules).toHaveProperty("@reasonabletech/use-result-helpers");
  });

  it("should return empty object when enforceResultHelpers is false", () => {
    const rules = createResultHelperRules({
      enforceResultHelpers: false,
    });

    expect(rules).toEqual({});
  });
});

describe("createPlatformConventionRules", () => {
  it("should combine all platform convention rules", () => {
    const rules = createPlatformConventionRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("should accept custom configuration", () => {
    const rules = createPlatformConventionRules({
      docBaseUrl: "custom/docs/conventions.md",
      enforceResultHelpers: true,
    });

    expect(rules).toBeDefined();
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });

  it("should respect disabled options", () => {
    const rules = createPlatformConventionRules({
      enforceResultHelpers: false,
      discourageUIBarrelImports: false,
    });

    expect(rules).toEqual({});
  });

  it("defaults UI import-boundary enforcement when nested flag is omitted", () => {
    const rules = createPlatformConventionRules({
      uiImportBoundaries: {},
    });

    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("treats explicit undefined nested UI flag as enabled by default", () => {
    const rules = createPlatformConventionRules({
      uiImportBoundaries: {
        discourageUILibraryBarrelImports: undefined,
      },
    });

    expect(rules).toHaveProperty("no-restricted-syntax");
  });
});

describe("createPlatformConventionPresetRules", () => {
  it("should produce a non-empty platform-specific preset", () => {
    const rules = createPlatformConventionPresetRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});
