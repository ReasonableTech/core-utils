import { describe, expect, it, vi } from "vitest";

import {
  addDays,
  andThen,
  err,
  formatDateISO,
  fromPromise,
  isoStringToDate,
  ok,
  retry,
  unwrapOrElse,
} from "../../src/index.js";
import { TEST_FIXTURES } from "../fixtures/common.js";

describe("resilient processing workflow", () => {
  describe("Core use cases", () => {
    it("retries a transient failure and completes date processing workflow", async () => {
      let attempts = 0;
      const fetchDate = vi.fn(async (): Promise<string> => {
        attempts += 1;
        if (attempts < 3) {
          return await Promise.reject(new Error("temporary network issue"));
        }
        return await Promise.resolve(TEST_FIXTURES.DATES.VALID_ISO);
      });

      const retryResult = await retry(fetchDate, {
        maxAttempts: 3,
        initialDelay: 0,
        maxDelay: 0,
        jitterFactor: 0,
      });

      expect(retryResult.success).toBe(true);
      expect(fetchDate).toHaveBeenCalledTimes(3);

      const retryValue = retryResult.value;
      if (!retryResult.success || retryValue === undefined) {
        throw new Error("Expected retry workflow to succeed.");
      }

      const dateResult = await fromPromise(
        Promise.resolve(isoStringToDate(retryValue)),
      );
      const nextDayIso = andThen(dateResult, (date) => {
        if (date === undefined) {
          return err(new Error("Expected parsed date from retry workflow."));
        }
        return ok(formatDateISO(addDays(date, 1)));
      });

      expect(unwrapOrElse(nextDayIso, () => "")).toBe("2023-12-26");
    });
  });

  describe("Error handling", () => {
    it("returns a safe fallback when retries are exhausted", async () => {
      const fetchDate = vi.fn(async (): Promise<string> => {
        return await Promise.reject(new Error("service unavailable"));
      });

      const retryResult = await retry(fetchDate, {
        maxAttempts: 2,
        initialDelay: 0,
        maxDelay: 0,
        jitterFactor: 0,
      });

      expect(retryResult.success).toBe(false);
      expect(fetchDate).toHaveBeenCalledTimes(2);

      const dateResult =
        retryResult.success && retryResult.value !== undefined
          ? await fromPromise(Promise.resolve(isoStringToDate(retryResult.value)))
          : err<Date, unknown>(retryResult.error);

      const output = unwrapOrElse(
        dateResult,
        () => new Date(TEST_FIXTURES.DATES.EPOCH),
      );
      if (output === undefined) {
        throw new Error("Expected date fallback output.");
      }
      expect(output.toISOString()).toBe(TEST_FIXTURES.DATES.EPOCH);
    });
  });
});
