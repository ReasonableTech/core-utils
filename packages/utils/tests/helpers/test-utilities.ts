import { TEST_FIXTURES } from "../fixtures/common.js";

/**
 * Helper function to create test dates with known values.
 * @param isoString - ISO string to create date from
 * @returns Test date
 */
export function createTestDate(isoString?: string): Date {
  return new Date(isoString ?? TEST_FIXTURES.DATES.VALID_ISO);
}

/**
 * Helper function to create success results for testing.
 * @param value - Data for successful result
 * @returns Success result
 */
export function createSuccessResult<T>(value: T): {
  readonly success: true;
  readonly value: T;
} {
  return { success: true, value } as const;
}

/**
 * Helper function to create error results for testing.
 * @param error - Error for failed result
 * @returns Error result
 */
export function createErrorResult<E>(error: E): {
  readonly success: false;
  readonly error: E;
} {
  return { success: false, error } as const;
}

/**
 * Helper to validate result type structure at runtime.
 * @param result - Result to validate
 * @returns Type predicate for success result
 */
export function isSuccessResult<T>(
  result: unknown,
): result is { success: true; value: T } {
  return Boolean(
    result !== null &&
      typeof result === "object" &&
      "success" in result &&
      result.success === true &&
      "value" in result,
  );
}

/**
 * Helper to validate error result type structure at runtime.
 * @param result - Result to validate
 * @returns Type predicate for error result
 */
export function isErrorResult<E>(
  result: unknown,
): result is { success: false; error: E } {
  return Boolean(
    result !== null &&
      typeof result === "object" &&
      "success" in result &&
      result.success === false &&
      "error" in result,
  );
}

/**
 * Utility to test edge cases for a function over many inputs.
 * @param testFn - Function to test
 * @param inputs - Array of inputs to test
 * @param expectedValidator - Validator function
 * @returns Array of test results
 */
export function testEdgeCases<T, R>(
  testFn: (input: T) => R,
  inputs: T[],
  expectedValidator: (result: R, input: T) => boolean,
): Array<{ input: T; result: R; passed: boolean }> {
  return inputs.map((input) => {
    const result = testFn(input);
    const passed = expectedValidator(result, input);
    return { input, result, passed };
  });
}

/**
 * Utility to generate random test data.
 */
export const generateTestData = {
  string: (length = 10): string =>
    Math.random().toString(36).substring(0, length),
  number: (min = 0, max = 100): number => Math.random() * (max - min) + min,
  boolean: (): boolean => Math.random() > 0.5,
  array: <T>(generator: () => T, length = 5): T[] =>
    Array.from({ length }, generator),
  date: (start = new Date(2020, 0, 1), end = new Date()): Date =>
    new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    ),
};
