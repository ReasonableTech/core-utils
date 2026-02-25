import { describe, expect, it } from "vitest";

import {
  combine,
  err,
  fromPromise,
  mapErr,
  ok,
  orElse,
  unwrap,
  unwrapOrElse,
} from "../../src/result.js";

describe("result recovery", () => {
  describe("Core use cases", () => {
    it("should transform errors with mapErr while preserving success values", () => {
      const mappedFailure = mapErr(
        err("raw-error"),
        (error: string) => `wrapped:${error}`,
      );
      const mappedSuccess = mapErr(
        ok<number, string>(42),
        (error: string) => `wrapped:${error}`,
      );

      expect(mappedFailure).toEqual(err("wrapped:raw-error"));
      expect(mappedSuccess).toEqual(ok(42));
    });

    it("should recover from failures with orElse", () => {
      const recovered = orElse(err("missing"), () => ok("fallback"));
      const passthrough = orElse(ok("primary"), () => ok("fallback"));

      expect(recovered).toEqual(ok("fallback"));
      expect(passthrough).toEqual(ok("primary"));
    });

    it("should compute fallback values with unwrapOrElse", () => {
      const successValue = unwrapOrElse(
        { success: true as const, value: 10 },
        () => -1,
      );
      const fallbackValue = unwrapOrElse<number, string>(
        { success: false as const, error: "boom" },
        (error: string) => error.length,
      );

      expect(successValue).toBe(10);
      expect(fallbackValue).toBe(4);
    });

    it("should combine success results into one array", () => {
      const combined = combine([ok("a"), ok("b"), ok("c")]);
      expect(combined).toEqual(ok(["a", "b", "c"]));
    });

    it("should create a success result without an explicit value", () => {
      expect(ok()).toEqual({ success: true, value: undefined });
    });
  });

  describe("Error handling", () => {
    it("should return the first failure when combining results", () => {
      const firstFailure = err("first-failure");
      const combined = combine<string, string>([
        ok<string, string>("a"),
        firstFailure,
        err("second-failure"),
      ]);

      expect(combined).toBe(firstFailure);
    });

    it("should throw a normalized Error when unwrapping non-Error failures", () => {
      expect(() => { unwrap(err("non-error failure")); }).toThrow("non-error failure");
    });

    it("should normalize non-Error promise rejections in fromPromise", async () => {
      const rejectionReason = "plain-rejection" as unknown as Error;
      const rejectedPromise: Promise<number> = Promise.reject(rejectionReason);
      const result = await fromPromise(rejectedPromise);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("plain-rejection");
      }
    });
  });
});
