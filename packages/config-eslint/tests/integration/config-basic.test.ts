/**
 * Basic ESLint Configuration Tests
 *
 * Tests that verify the ESLint configuration can be loaded and used
 * without errors. For a configuration package, the main requirement
 * is that configs load successfully - actual rule testing happens
 * through consumption by other packages.
 */

import { describe, expect, it } from "vitest";
import { createTypeAwareConfig } from "../../src/index.js";
import { baseRules, typeAwareRules } from "../../src/shared-rules.js";

describe("ESLint Configuration Loading", () => {
  it("returns valid configuration structure", () => {
    const config = createTypeAwareConfig(".");
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it("exports shared rule objects", () => {
    expect(Object.keys(baseRules)).not.toHaveLength(0);
    expect(Object.keys(typeAwareRules)).not.toHaveLength(0);
  });

  it("includes expected base rules", () => {
    expect(baseRules["prefer-const"]).toBe("error");
    expect(baseRules["no-var"]).toBe("error");
  });

  it("includes expected TypeScript rules", () => {
    expect(typeAwareRules["@typescript-eslint/no-explicit-any"]).toBe("error");
    // no-unused-vars is configured as an array with options
    const noUnusedVars = typeAwareRules["@typescript-eslint/no-unused-vars"];
    expect(Array.isArray(noUnusedVars) ? noUnusedVars[0] : noUnusedVars).toBe(
      "error",
    );
    expect(
      typeAwareRules["@typescript-eslint/explicit-function-return-type"],
    ).toBe("error");
    expect(typeAwareRules["@typescript-eslint/no-require-imports"]).toBe(
      "error",
    );
    expect(typeAwareRules["@typescript-eslint/no-non-null-assertion"]).toBe(
      "error",
    );
    expect(
      typeAwareRules["@typescript-eslint/require-array-sort-compare"],
    ).toBe("error");
  });
});
