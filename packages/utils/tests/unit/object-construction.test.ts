import { describe, expect, it } from "vitest";

import {
  conditionalProps,
  includeIf,
  includeIfDefined,
  omit,
  omitUndefined,
  pick,
} from "../../src/object.js";

describe("object construction", () => {
  describe("Core use cases", () => {
    it("should conditionally include a single property", () => {
      expect(includeIf("name", "Ada")).toEqual({ name: "Ada" });
      expect(includeIf("name", undefined)).toEqual({});
    });

    it("should include only defined properties from an object", () => {
      const result = includeIfDefined({
        id: 1,
        nickname: undefined,
        active: false,
        count: 0,
        note: "",
        metadata: null,
      });

      expect(result).toEqual({
        id: 1,
        active: false,
        count: 0,
        note: "",
        metadata: null,
      });
    });

    it("should omit undefined values while preserving other falsy values", () => {
      const result = omitUndefined({
        enabled: false,
        retryCount: 0,
        label: "",
        description: undefined,
        extra: null,
      });

      expect(result).toEqual({
        enabled: false,
        retryCount: 0,
        label: "",
        extra: null,
      });
    });

    it("should merge conditional property groups for true string conditions", () => {
      const result = conditionalProps({
        true: { enabled: true, level: "debug" },
        false: { disabled: true },
        "not-a-boolean": { skipped: true },
      });

      expect(result).toEqual({ enabled: true, level: "debug" });
    });

    it("should pick a subset of properties", () => {
      const source = { id: 7, name: "Core Utils", private: true };
      const result = pick(source, ["id", "name"]);

      expect(result).toEqual({ id: 7, name: "Core Utils" });
    });

    it("should omit sensitive properties from an object", () => {
      const source = {
        id: "user-1",
        email: "user@example.com",
        password: "secret",
        token: "jwt",
      };

      const result = omit(source, ["password", "token"]);

      expect(result).toEqual({
        id: "user-1",
        email: "user@example.com",
      });
    });
  });

  describe("Edge cases", () => {
    it("should ignore keys not present on the source object when picking", () => {
      const source = { id: 1, name: "A" };
      const runtimeKeys = ["id", "missing"] as unknown as Array<
        keyof typeof source
      >;

      const result = pick(source, runtimeKeys);

      expect(result).toEqual({ id: 1 });
    });

    it("should return a full copy when omitted keys are not present", () => {
      const source = { id: 1, name: "B" };
      const runtimeKeys = ["missing"] as unknown as Array<keyof typeof source>;

      const result = omit(source, runtimeKeys);

      expect(result).toEqual(source);
      expect(result).not.toBe(source);
    });
  });
});
