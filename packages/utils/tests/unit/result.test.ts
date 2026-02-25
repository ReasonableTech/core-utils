import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isSuccess,
  isFailure,
  map,
  andThen,
  unwrap,
  unwrapOr,
  fromPromise,
} from "../../src/index.js";

describe("Result", () => {
  describe("ok", () => {
    it("creates a successful result", () => {
      const result = ok(42);
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
      expect(result.error).toBeUndefined();
    });
  });

  describe("err", () => {
    it("creates an error result", () => {
      const error = new Error("test error");
      const result = err(error);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.value).toBeUndefined();
    });
  });

  describe("isSuccess", () => {
    it("returns true for successful results", () => {
      const result = ok(42);
      expect(isSuccess(result)).toBe(true);
    });

    it("returns false for error results", () => {
      const result = err(new Error("test"));
      expect(isSuccess(result)).toBe(false);
    });
  });

  describe("isFailure", () => {
    it("returns false for successful results", () => {
      const result = ok(42);
      expect(isFailure(result)).toBe(false);
    });

    it("returns true for error results", () => {
      const result = err(new Error("test"));
      expect(isFailure(result)).toBe(true);
    });
  });

  describe("map", () => {
    it("transforms successful results", () => {
      const result = ok(42);
      const mapped = map(result, (x) => (x ?? 0) * 2);
      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(84);
      }
    });

    it("passes through error results", () => {
      const error = new Error("test");
      const result = err(error);
      const mapped = map(result, (x: unknown) => (x as number) * 2);
      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe("andThen", () => {
    it("chains successful results", () => {
      const result = ok(42);
      const chained = andThen(result, (x) => ok((x ?? 0).toString()));
      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe("42");
      }
    });

    it("passes through error results", () => {
      const error = new Error("test");
      const result = err(error);
      const chained = andThen(result, (x: unknown) =>
        ok((x as { toString(): string }).toString()),
      );
      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe("unwrap", () => {
    it("returns value for successful results", () => {
      const result = ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it("throws error for error results", () => {
      const error = new Error("test error");
      const result = err(error);
      expect(() => {
        unwrap(result);
      }).toThrow("test error");
    });
  });

  describe("unwrapOr", () => {
    it("returns value for successful results", () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it("returns default for error results", () => {
      const error = new Error("test");
      const result = err(error);
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe("fromPromise", () => {
    it("converts resolved promise to ok result", async () => {
      const promise = Promise.resolve(42);
      const result = await fromPromise(promise);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });

    it("converts rejected promise to err result", async () => {
      const error = new Error("test error");
      const promise = Promise.reject(error);
      const result = await fromPromise(promise);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });
});
