/**
 * Shared deterministic test data for `@reasonabletech/utils` tests.
 */
export const TEST_FIXTURES = {
  DATES: {
    VALID_ISO: "2023-12-25T10:30:00.000Z",
    VALID_DATE: new Date("2023-12-25T10:30:00.000Z"),
    INVALID_ISO: "invalid-date",
    EPOCH: "1970-01-01T00:00:00.000Z",
  },
  RESULTS: {
    SUCCESS_STRING: { success: true, value: "test-data" } as const,
    SUCCESS_NUMBER: { success: true, value: 42 } as const,
    SUCCESS_OBJECT: { success: true, value: { id: 1, name: "test" } } as const,
    ERROR_SIMPLE: { success: false, error: "Test error" } as const,
    ERROR_COMPLEX: {
      success: false,
      error: new Error("Complex test error"),
    } as const,
  },
  VALUES: {
    STRINGS: ["", "test", "hello world", " whitespace ", "special@chars!"],
    NUMBERS: [0, 1, -1, 42, 3.14, -3.14, Infinity, -Infinity, NaN],
    BOOLEANS: [true, false],
    NULLISH: [null, undefined],
    ARRAYS: [[], [1], [1, 2, 3], ["a", "b", "c"]],
    OBJECTS: [{}, { key: "value" }, { a: 1, b: 2 }],
  },
};
