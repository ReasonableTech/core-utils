import { describe, expect, it } from "vitest";

import { isPresent } from "../../src/type-guards.js";

describe("type guards", () => {
  describe("Core use cases", () => {
    it("should return true for present values", () => {
      expect(isPresent("value")).toBe(true);
      expect(isPresent(0)).toBe(true);
      expect(isPresent(false)).toBe(true);
      expect(isPresent({ id: 1 })).toBe(true);
    });

    it("should filter nullish values from arrays", () => {
      const values = [1, null, 2, undefined, 3];
      const presentValues = values.filter(isPresent);

      expect(presentValues).toEqual([1, 2, 3]);
    });
  });

  describe("Error handling", () => {
    it("should return false for nullish values", () => {
      expect(isPresent(null)).toBe(false);
      expect(isPresent(undefined)).toBe(false);
    });
  });
});
