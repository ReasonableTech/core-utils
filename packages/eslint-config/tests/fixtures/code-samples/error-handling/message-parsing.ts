/**
 * Code fixtures for error message parsing rule testing
 *
 * FIXTURE: Pure test data - code samples demonstrating violations and correct patterns
 */

/**
 * Error message parsing violation using includes() method.
 *
 * This pattern is forbidden because error messages are unreliable and can
 * change between library versions, locales, or environments. Parsing messages
 * for error detection creates brittle code that breaks when error text changes.
 * Use structured error properties (error.code, error.status, instanceof) instead.
 */
export const errorMessageIncludesViolation = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error.message.includes("404")) {
    console.log("Not found");
  }
}
`;

/**
 * Error message parsing violation using startsWith() method.
 *
 * This pattern is forbidden for the same reason as includes() - error messages
 * can change unpredictably. String prefix checking is just as unreliable as
 * substring matching when messages are implementation details that vary across
 * library versions.
 */
export const errorMessageStartsWithViolation = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error.message.startsWith("Network")) {
    console.log("Network error");
  }
}
`;

/**
 * Error message parsing violation using direct equality comparison.
 *
 * This pattern is forbidden because it's even more fragile than includes() -
 * any change to the error message text (punctuation, capitalization, wording)
 * breaks the check. Error messages are meant for humans, not programmatic
 * error detection.
 */
export const errorMessageEqualityViolation = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error.message === "Network Error") {
    console.log("Network issue");
  }
}
`;

/**
 * Error message parsing violation using regex matching.
 *
 * This pattern is forbidden because regex matching on error messages is still
 * unreliable, even if more flexible than exact matches. Error messages can
 * change wording entirely while keeping the same error code, breaking regex
 * patterns.
 */
export const errorMessageRegexViolation = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error.message.match(/timeout/i)) {
    console.log("Timeout occurred");
  }
}
`;

/**
 * Correct error detection using structured properties.
 *
 * This pattern uses error.code (string error codes like ECONNREFUSED) and
 * error.status (HTTP status codes) which are stable, documented, and part of
 * the error contract. These properties are designed for programmatic error
 * handling and won't change unexpectedly between versions.
 */
export const errorCodeCheckCorrect = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    console.log("Connection refused");
  }
  if (error.status === 404) {
    console.log("Not found");
  }
}
`;

/**
 * Correct error detection using instanceof checks.
 *
 * This pattern uses error type checking which is the most reliable way to
 * detect specific error classes. instanceof checks work with custom error
 * types and allow type narrowing in TypeScript, providing both runtime and
 * compile-time safety.
 */
export const instanceofCheckCorrect = `
try {
  await fetch("/api/data");
} catch (error) {
  if (error instanceof NetworkError) {
    console.log("Network error");
  }
  if (error instanceof ValidationError) {
    console.log("Validation failed");
  }
}
`;
