/**
 * Integration tests for `@reasonabletech/utils`
 *
 * Tests how different utility functions work together and their
 * combined behavior in realistic scenarios.
 */

import { describe, it, expect } from "vitest";
import {
  type Result,
  ok,
  err,
  dateToISOString,
  diffInSeconds,
  now,
} from "../../src/index.js";
import { TEST_FIXTURES } from "../fixtures/common.js";

describe("Utils Integration", () => {
  describe("Result + DateTime Integration", () => {
    it("should handle date operations with Result types", () => {
      // Simulate a function that returns a Result with date operations
      function parseAndFormatDate(dateString: string): Result<string, string> {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return err("Invalid date string");
          }

          const formatted = dateToISOString(date);
          return ok(formatted);
        } catch {
          return err("Parsing failed");
        }
      }

      // Test valid date
      const validResult = parseAndFormatDate(TEST_FIXTURES.DATES.VALID_ISO);
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.value).toMatch(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
        ); // Should be ISO format
      }

      // Test invalid date
      const invalidResult = parseAndFormatDate(TEST_FIXTURES.DATES.INVALID_ISO);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error).toBe("Invalid date string");
      }
    });

    it("should chain multiple Result operations with dates", () => {
      // Simulate a workflow with multiple steps
      function processDateWorkflow(input: string): Result<string, string> {
        // Step 1: Parse date
        const parseResult = parseDate(input);
        if (!parseResult.success) {
          return parseResult;
        }

        // Step 2: Add one day
        const parsedDate = parseResult.value;
        const addDayResult = addLocalDays(parsedDate, 1);
        if (!addDayResult.success) {
          return addDayResult;
        }

        // Step 3: Format result
        const addedDate = addDayResult.value;
        const formatResult = formatDate(addedDate);
        return formatResult;
      }

      function parseDate(dateString: string): Result<Date, string> {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return err("Invalid date");
          }
          return ok(date);
        } catch {
          return err("Parse error");
        }
      }

      function addLocalDays(date: Date, days: number): Result<Date, string> {
        try {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() + days);
          return ok(newDate);
        } catch {
          return err("Date calculation error");
        }
      }

      function formatDate(date: Date): Result<string, string> {
        try {
          return ok(date.toISOString());
        } catch {
          return err("Format error");
        }
      }

      // Test successful workflow
      const successResult = processDateWorkflow(TEST_FIXTURES.DATES.VALID_ISO);
      expect(successResult.success).toBe(true);

      // Test failed workflow
      const failureResult = processDateWorkflow(
        TEST_FIXTURES.DATES.INVALID_ISO,
      );
      expect(failureResult.success).toBe(false);
    });
  });

  describe("Result Combinators", () => {
    it("should combine multiple Result values", () => {
      function combineResults<T, E>(
        results: Array<Result<T, E>>,
      ): Result<T[], E> {
        const successes: T[] = [];

        for (const result of results) {
          if (!result.success) {
            return result;
          }
          const data = result.value;
          successes.push(data);
        }

        return ok(successes);
      }

      // Test all successful results
      const allSuccess = combineResults<string, string>([
        ok("a"),
        ok("b"),
        ok("c"),
      ]);
      expect(allSuccess.success).toBe(true);
      if (allSuccess.success) {
        expect(allSuccess.value).toEqual(["a", "b", "c"]);
      }

      // Test with one failure
      const withFailure = combineResults<string, string>([
        ok("a"),
        err("error"),
        ok("c"),
      ]);
      expect(withFailure.success).toBe(false);
    });

    it("should map over Result values", () => {
      function mapResult<T, U, E>(
        result: Result<T, E>,
        fn: (value: T) => U,
      ): Result<U, E> {
        if (!result.success) {
          return result;
        }
        const value = result.value;
        return ok(fn(value));
      }

      const numResult: Result<number, string> = ok(42);
      const stringResult = mapResult(numResult, (n: number) => n.toString());

      expect(stringResult.success).toBe(true);
      if (stringResult.success) {
        expect(stringResult.value).toBe("42");
      }

      const errorResult: Result<number, string> = err("test error");
      const mappedError = mapResult(errorResult, (n: number) => n.toString());

      expect(mappedError.success).toBe(false);
      if (!mappedError.success) {
        expect(mappedError.error).toBe("test error");
      }
    });
  });

  describe("Error Handling Patterns", () => {
    it("should provide consistent error handling across utilities", () => {
      // Simulate functions that might fail
      function riskyDateOperation(dateString: string): Result<string, string> {
        if (dateString === "") {
          return err("Empty date string");
        }

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return err("Invalid date format");
          }

          return ok(`${diffInSeconds(now(), date)} seconds ago`);
        } catch {
          return err("Unexpected error");
        }
      }

      // Test error cases
      const emptyResult = riskyDateOperation("");
      expect(emptyResult.success).toBe(false);

      const invalidResult = riskyDateOperation("invalid");
      expect(invalidResult.success).toBe(false);

      // Test success case
      const validResult = riskyDateOperation(TEST_FIXTURES.DATES.VALID_ISO);
      expect(validResult.success).toBe(true);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large datasets efficiently", () => {
      // Create a large array of date operations
      const operations = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date(2023, 0, 1 + i);
        return (): string => dateToISOString(date);
      });

      const startTime = Date.now();
      const results = operations.map((op) => op());
      const endTime = Date.now();

      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(results).toHaveLength(1000);
      expect(results.every((r): r is string => typeof r === "string")).toBe(
        true,
      );
    });

    it("should handle nested Result structures", () => {
      type NestedResult = Result<Result<string, string>, string>;

      function createNestedResult(shouldSucceed: boolean): NestedResult {
        if (!shouldSucceed) {
          return err("Outer error");
        }

        const innerResult: Result<string, string> = ok("inner success");

        return ok(innerResult);
      }

      const success = createNestedResult(true);
      expect(success.success).toBe(true);
      if (success.success) {
        const innerResult = success.value;
        expect(innerResult.success).toBe(true);
      }

      const failure = createNestedResult(false);
      expect(failure.success).toBe(false);
    });
  });
});
