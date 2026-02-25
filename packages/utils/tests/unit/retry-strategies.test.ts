import { afterEach, describe, expect, it, vi } from "vitest";

import {
  retry,
  retryWithBackoff,
  retryWithPolling,
  sleep,
} from "../../src/retry.js";

describe("retry strategies", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Core use cases", () => {
    it("should resolve sleep after the specified delay", async () => {
      vi.useFakeTimers();

      let settled = false;
      const sleepPromise = sleep(50).then(() => {
        settled = true;
      });

      await vi.advanceTimersByTimeAsync(49);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await sleepPromise;

      expect(settled).toBe(true);
    });

    it("should return success immediately when operation succeeds", async () => {
      const operation = vi.fn(async () => await Promise.resolve("ok"));

      const result = await retry(operation);

      expect(result).toEqual({
        success: true,
        value: "ok",
        attempts: 1,
      });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry and eventually succeed with default delay calculation", async () => {
      const transientError = new Error("temporary");
      const operation = vi.fn(async () => await Promise.resolve("done"));
      operation.mockRejectedValueOnce(transientError);
      const onError = vi.fn(async () => { await Promise.resolve(); });

      const result = await retry(operation, {
        maxAttempts: 3,
        initialDelay: 0,
        maxDelay: 0,
        backoffMultiplier: 2,
        jitterFactor: 0,
        onError,
      });

      expect(result).toEqual({
        success: true,
        value: "done",
        attempts: 2,
      });
      expect(onError).toHaveBeenCalledWith(transientError, 1);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry with polling settings and return a successful result", async () => {
      const operation = vi.fn(async () => await Promise.resolve("polled"));
      operation.mockRejectedValueOnce(new Error("not ready"));
      const shouldRetry = vi.fn(() => true);

      const result = await retryWithPolling(operation, 3, 0, shouldRetry);

      expect(result).toEqual({
        success: true,
        value: "polled",
        attempts: 2,
      });
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });

    it("should use the default polling retry predicate when none is provided", async () => {
      const operation = vi.fn(async () => await Promise.resolve("eventually-ready"));
      operation.mockRejectedValueOnce(new Error("retry once"));

      const result = await retryWithPolling(operation, 2, 0);

      expect(result).toEqual({
        success: true,
        value: "eventually-ready",
        attempts: 2,
      });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should return value from retryWithBackoff when operation recovers", async () => {
      const operation = vi.fn(async () => await Promise.resolve("value"));
      operation.mockRejectedValueOnce(new Error("transient"));

      const value = await retryWithBackoff(operation, 2, 0);

      expect(value).toBe("value");
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error handling", () => {
    it("should stop retrying when shouldRetry returns false", async () => {
      const terminalError = new Error("terminal");
      const operation = vi.fn(async () => await Promise.reject(terminalError));
      const shouldRetry = vi.fn(() => false);

      const result = await retry(operation, {
        maxAttempts: 5,
        initialDelay: 0,
        maxDelay: 0,
        backoffMultiplier: 1,
        jitterFactor: 0,
        shouldRetry,
      });

      expect(result).toEqual({
        success: false,
        error: terminalError,
        attempts: 1,
      });
      expect(shouldRetry).toHaveBeenCalledWith(terminalError, 1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should use custom delay function when provided", async () => {
      const retryableError = new Error("retry-me");
      const operation = vi.fn(async () => await Promise.resolve("complete"));
      operation.mockRejectedValueOnce(retryableError);
      const getDelay = vi.fn(() => 0);

      const result = await retry(operation, {
        maxAttempts: 2,
        getDelay,
      });

      expect(result.success).toBe(true);
      expect(getDelay).toHaveBeenCalledWith(1, retryableError);
    });

    it("should return failure after exhausting max attempts", async () => {
      const finalError = new Error("still failing");
      const operation = vi.fn(async () => await Promise.reject(finalError));
      const onError = vi.fn(async () => { await Promise.resolve(); });

      const result = await retry(operation, {
        maxAttempts: 2,
        initialDelay: 0,
        maxDelay: 0,
        backoffMultiplier: 1,
        jitterFactor: 0,
        onError,
      });

      expect(result).toEqual({
        success: false,
        error: finalError,
        attempts: 2,
      });
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("should throw the last error from retryWithBackoff on failure", async () => {
      const finalError = new Error("permanent");
      const operation = vi.fn(async () => await Promise.reject(finalError));

      await expect(retryWithBackoff(operation, 1, 0)).rejects.toThrow(
        "permanent",
      );
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
