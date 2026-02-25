/**
 * Result Type Patterns
 *
 * This example demonstrates type-safe error handling using the Result type.
 * The Result type provides a clean alternative to try/catch for handling
 * operations that can fail, making error handling explicit in the type system.
 *
 * Run: npx tsx examples/result-handling.ts
 */

import {
  type Result,
  ok,
  err,
  isSuccess,
  isFailure,
  map,
  mapErr,
  andThen,
  orElse,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  combine,
  fromPromise,
} from "@reasonabletech/utils/result";

// =============================================================================
// Basic Result Creation
// =============================================================================

console.log("=== Basic Result Creation ===\n");

// Create a successful result
const successResult: Result<number> = ok(42);
console.log("Success result:", successResult);
// Output: { success: true, value: 42 }

// Create an error result
const errorResult: Result<number, string> = err("Something went wrong");
console.log("Error result:", errorResult);
// Output: { success: false, error: "Something went wrong" }

// Void success (for operations with no return value)
const voidSuccess: Result<void> = ok();
console.log("Void success:", voidSuccess);
// Output: { success: true, value: undefined }

// =============================================================================
// Type Guards for Narrowing
// =============================================================================

console.log("\n=== Type Guards ===\n");

function demonstrateTypeGuards(result: Result<string, Error>): void {
  // Using isSuccess for type narrowing
  if (isSuccess(result)) {
    // TypeScript knows result.value is string here
    console.log("Success! Value:", result.value.toUpperCase());
  }

  // Using isFailure for type narrowing
  if (isFailure(result)) {
    // TypeScript knows result.error is Error here
    console.log("Failure! Error:", result.error.message);
  }
}

demonstrateTypeGuards(ok("hello world"));
demonstrateTypeGuards(err(new Error("oops")));

// =============================================================================
// Real-World Example: User Validation
// =============================================================================

console.log("\n=== User Validation Example ===\n");

interface User {
  id: number;
  email: string;
  age: number;
}

// Custom error type for validation
interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes("@")) {
    return err({ field: "email", message: "Invalid email format" });
  }
  return ok(email.toLowerCase());
}

function validateAge(age: number): Result<number, ValidationError> {
  if (age < 0 || age > 150) {
    return err({ field: "age", message: "Age must be between 0 and 150" });
  }
  return ok(age);
}

function createUser(
  id: number,
  email: string,
  age: number
): Result<User, ValidationError> {
  // Chain validations using andThen
  const emailResult = validateEmail(email);
  if (!emailResult.success) {
    return emailResult as Result<User, ValidationError>;
  }

  const ageResult = validateAge(age);
  if (!ageResult.success) {
    return ageResult as Result<User, ValidationError>;
  }

  return ok({
    id,
    email: emailResult.value,
    age: ageResult.value,
  });
}

const validUser = createUser(1, "John@Example.com", 25);
const invalidUser = createUser(2, "invalid-email", 25);

console.log("Valid user result:", validUser);
console.log("Invalid user result:", invalidUser);

// =============================================================================
// Chaining with andThen
// =============================================================================

console.log("\n=== Chaining with andThen ===\n");

// Simulate database operations
function findUserById(id: number): Result<User, string> {
  const users: Record<number, User> = {
    1: { id: 1, email: "alice@example.com", age: 30 },
    2: { id: 2, email: "bob@example.com", age: 25 },
  };

  const user = users[id];
  if (!user) {
    return err(`User ${id} not found`);
  }
  return ok(user);
}

function getUserEmail(user: User): Result<string, string> {
  if (!user.email) {
    return err("User has no email");
  }
  return ok(user.email);
}

function sendWelcomeEmail(email: string): Result<void, string> {
  console.log(`  [Sending welcome email to ${email}]`);
  return ok();
}

// Chain operations: find user -> get email -> send welcome
const result1 = andThen(findUserById(1), (user) =>
  andThen(getUserEmail(user), (email) => sendWelcomeEmail(email))
);

const result2 = andThen(findUserById(999), (user) =>
  andThen(getUserEmail(user), (email) => sendWelcomeEmail(email))
);

console.log("Chain result for user 1:", result1);
console.log("Chain result for user 999:", result2);

// =============================================================================
// Error Transformation with mapErr
// =============================================================================

console.log("\n=== Error Transformation with mapErr ===\n");

// Convert internal errors to user-friendly messages
interface ApiError {
  code: string;
  userMessage: string;
  internalMessage: string;
}

function toApiError(internalError: string): ApiError {
  return {
    code: "USER_NOT_FOUND",
    userMessage: "The requested user could not be found",
    internalMessage: internalError,
  };
}

const internalResult = findUserById(999);
const apiResult = mapErr(internalResult, toApiError);

console.log("Original error:", internalResult);
console.log("Transformed to API error:", apiResult);

// =============================================================================
// Value Transformation with map
// =============================================================================

console.log("\n=== Value Transformation with map ===\n");

const userResult = findUserById(1);

// Transform successful value while preserving error type
const emailOnlyResult = map(userResult, (user) => user.email);
console.log("Mapped to email only:", emailOnlyResult);

// Chain transformations
const upperEmailResult = map(emailOnlyResult, (email) => email.toUpperCase());
console.log("Mapped to uppercase:", upperEmailResult);

// =============================================================================
// Fallback with orElse
// =============================================================================

console.log("\n=== Fallback with orElse ===\n");

function getDefaultUser(): Result<User, string> {
  return ok({ id: 0, email: "guest@example.com", age: 0 });
}

// Use a fallback when the primary operation fails
const primaryResult = findUserById(999);
const withFallback = orElse(primaryResult, () => getDefaultUser());

console.log("Primary result (failed):", primaryResult);
console.log("With fallback:", withFallback);

// =============================================================================
// Unwrapping Results
// =============================================================================

console.log("\n=== Unwrapping Results ===\n");

// unwrapOr: Get value or default
const value1 = unwrapOr(findUserById(1), {
  id: 0,
  email: "default@example.com",
  age: 0,
});
const value2 = unwrapOr(findUserById(999), {
  id: 0,
  email: "default@example.com",
  age: 0,
});

console.log("unwrapOr with existing user:", value1.email);
console.log("unwrapOr with missing user:", value2.email);

// unwrapOrElse: Compute default from error
const value3 = unwrapOrElse(findUserById(999), (error) => {
  console.log(`  [Computing fallback due to: ${error}]`);
  return { id: -1, email: "computed@example.com", age: 0 };
});

console.log("unwrapOrElse result:", value3.email);

// unwrap: Get value or throw (use sparingly!)
try {
  const value = unwrap(findUserById(1));
  console.log("unwrap success:", value.email);
} catch (e) {
  console.log("unwrap threw:", e);
}

// =============================================================================
// Combining Multiple Results
// =============================================================================

console.log("\n=== Combining Multiple Results ===\n");

// Validate multiple fields and combine results
const results: Result<string, ValidationError>[] = [
  validateEmail("alice@example.com"),
  validateEmail("bob@example.com"),
  validateEmail("charlie@example.com"),
];

const combined = combine(results);
console.log("All valid emails combined:", combined);

// One failure fails the entire combination
const resultsWithFailure: Result<string, ValidationError>[] = [
  validateEmail("alice@example.com"),
  validateEmail("invalid-email"), // This fails
  validateEmail("charlie@example.com"),
];

const combinedWithFailure = combine(resultsWithFailure);
console.log("Combined with one failure:", combinedWithFailure);

// =============================================================================
// Wrapping Promises with fromPromise
// =============================================================================

console.log("\n=== Wrapping Promises ===\n");

async function demonstrateFromPromise(): Promise<void> {
  // Wrap a successful promise
  const successPromise = Promise.resolve({ data: "hello" });
  const wrappedSuccess = await fromPromise(successPromise);
  console.log("Wrapped successful promise:", wrappedSuccess);

  // Wrap a failing promise
  const failingPromise = Promise.reject(new Error("Network error"));
  const wrappedFailure = await fromPromise(failingPromise);
  console.log("Wrapped failing promise:", wrappedFailure);

  // Real-world pattern: API call with Result
  async function fetchUserSafe(id: number): Promise<Result<User, Error>> {
    const mockFetch = async (): Promise<User> => {
      if (id === 999) {
        throw new Error("User not found");
      }
      return { id, email: "user@example.com", age: 30 };
    };

    return await fromPromise(mockFetch());
  }

  const safeResult1 = await fetchUserSafe(1);
  const safeResult2 = await fetchUserSafe(999);

  console.log("Safe fetch user 1:", safeResult1);
  console.log("Safe fetch user 999:", safeResult2);
}

await demonstrateFromPromise();

// =============================================================================
// Pattern: API Response Handler
// =============================================================================

console.log("\n=== API Response Handler Pattern ===\n");

interface ApiResponse<T> {
  data: T;
  status: number;
}

function handleApiResponse<T>(
  response: Result<ApiResponse<T>, Error>
): { success: boolean; message: string } {
  if (isSuccess(response)) {
    return {
      success: true,
      message: `Successfully retrieved data (status: ${response.value.status})`,
    };
  }

  return {
    success: false,
    message: `Failed: ${response.error.message}`,
  };
}

const goodResponse: Result<ApiResponse<User>, Error> = ok({
  data: { id: 1, email: "test@example.com", age: 25 },
  status: 200,
});

const badResponse: Result<ApiResponse<User>, Error> = err(
  new Error("Connection timeout")
);

console.log("Good response:", handleApiResponse(goodResponse));
console.log("Bad response:", handleApiResponse(badResponse));

console.log("\n=== Examples Complete ===");
