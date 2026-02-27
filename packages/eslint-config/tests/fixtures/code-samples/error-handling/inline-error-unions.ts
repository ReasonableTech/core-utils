/**
 * Code fixtures for inline error union rule testing
 *
 * FIXTURE: Pure test data — code samples demonstrating violations and correct patterns.
 * These strings are linted by integration tests; they are not executed.
 *
 * Note: These fixtures use TypeScript syntax (type annotations) and require
 * the TypeScript parser when linted.
 */

/**
 * Violation: inline union type inside Result<T, E>
 *
 * Error unions must be extracted to documented named types so consumers
 * can reference them and each code is explained via JSDoc.
 */
export const inlineResultUnionViolation = `
function createUser(data: UserData): Result<User, "validation_error" | "email_exists"> {
  return ok(data);
}
`;

/**
 * Violation: inline union type inside Promise<Result<T, E>>
 *
 * Same rule applies when the Result is wrapped in a Promise.
 */
export const inlinePromiseResultUnionViolation = `
async function createUser(data: UserData): Promise<Result<User, "validation_error" | "email_exists">> {
  return ok(data);
}
`;

/**
 * Correct: using a named error type in Result<T, E>
 *
 * The error type is extracted and documented elsewhere.
 */
export const namedErrorTypeCorrect = `
function createUser(data: UserData): Result<User, UserCreateError> {
  return ok(data);
}
`;

/**
 * Correct: using a named error type in Promise<Result<T, E>>
 */
export const namedPromiseErrorTypeCorrect = `
async function createUser(data: UserData): Promise<Result<User, UserCreateError>> {
  return ok(data);
}
`;
