/**
 * React Configuration Tests
 */

import { describe, expect, it } from "vitest";
import { createTypeAwareReactConfig } from "../../src/react.js";

describe("React Configuration", () => {
  it("returns valid configuration array", () => {
    const config = createTypeAwareReactConfig(".");
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it("includes React specific configurations", () => {
    const config = createTypeAwareReactConfig(".");
    // Should include multiple config objects for React + base configs
    expect(config.length).toBeGreaterThan(1);
  });

  it("works with different project directories", () => {
    const config1 = createTypeAwareReactConfig(".");
    const config2 = createTypeAwareReactConfig("/some/other/path");

    expect(Array.isArray(config1)).toBe(true);
    expect(Array.isArray(config2)).toBe(true);
  });
});
