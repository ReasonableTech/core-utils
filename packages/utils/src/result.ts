/**
 * Represents a successful Result with a value.
 * Can be used for type narrowing in tests and assertions.
 */
export interface Success<T> {
  success: true;
  value: T;
  error?: undefined;
}

/**
 * Represents a failed Result with an error.
 * Can be used for type narrowing in tests and assertions.
 */
export interface Failure<E> {
  success: false;
  error: E;
  value?: undefined;
}

/**
 * A simplified Result type inspired by Rust's Result.
 *
 * This type represents either a successful value (ok) or an error (err).
 * It is used for consistent error handling across the `@reasonabletech` platform.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Creates a successful Result.
 * @param value - Optional value to wrap in a successful Result
 * @returns A successful Result containing the value
 */
export function ok<T, E = Error>(value: T): Result<T, E>;
export function ok<E = Error>(): Result<void, E>;
export function ok<T, E = Error>(value?: T): Result<T | void, E> {
  return { success: true, value: value as T | void };
}

/**
 * Creates an error Result.
 * @param error The error to wrap in an error Result
 * @returns An error Result containing the error
 */
export function err<T = never, E = Error>(error: E): Result<T, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a Result is successful.
 * @param result The Result to check
 * @returns True if the Result is successful
 */
export function isSuccess<T, E = Error>(
  result: Readonly<Result<T, E>>,
): result is Success<T> {
  return result.success;
}

/**
 * Type guard to check if a Result is an error.
 * @param result The Result to check
 * @returns True if the Result is an error
 */
export function isFailure<T, E = Error>(
  result: Readonly<Result<T, E>>,
): result is Failure<E> {
  return !result.success;
}

/**
 * Wraps a Promise to return a Result.
 * @param promise The Promise to wrap
 * @returns A Promise that resolves to a Result
 */
export async function fromPromise<T>(
  promise: Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Maps a successful Result to a new Result with a transformed value.
 * @param result The Result to map
 * @param fn The function to apply to the value
 * @returns A new Result with the transformed value or the original error
 */
export function map<T, U, E = Error>(
  result: Readonly<Result<T, E>>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result as Result<U, E>;
}

/**
 * Maps an error Result to a new Result with a transformed error.
 * @param result The Result to map
 * @param fn The function to apply to the error
 * @returns A new Result with the transformed error or the original value
 */
export function mapErr<T, E = Error, F = Error>(
  result: Readonly<Result<T, E>>,
  fn: (error: E) => F,
): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return ok(result.value);
}

/**
 * Chains a function that returns a Result after a successful Result.
 * @param result The Result to chain
 * @param fn The function to apply to the value that returns a Result
 * @returns The Result returned by the function or the original error
 */
export function andThen<T, U, E = Error>(
  result: Readonly<Result<T, E>>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result as Result<U, E>;
}

/**
 * Applies a fallback function to an error Result.
 * @param result The Result to check
 * @param fn The function to apply to the error that returns a Result
 * @returns The original Result if successful, or the Result returned by the function
 */
export function orElse<T, E = Error, F = Error>(
  result: Readonly<Result<T, E>>,
  fn: (error: E) => Result<T, F>,
): Result<T, F> {
  if (!result.success) {
    return fn(result.error);
  }
  return result as unknown as Result<T, F>;
}

/**
 * Unwraps a Result, returning the value or throwing the error.
 * @param result The Result to unwrap
 * @returns The value if the Result is successful
 * @throws {Error} The error if the Result is an error
 */
export function unwrap<T, E = Error>(result: Readonly<Result<T, E>>): T {
  if (result.success) {
    return result.value;
  }
  if (result.error instanceof Error) {
    throw result.error;
  }
  throw new Error(String(result.error));
}

/**
 * Unwraps a Result, returning the value or a default value.
 * @param result The Result to unwrap
 * @param defaultValue The default value to return if the Result is an error
 * @returns The value if the Result is successful, or the default value
 */
export function unwrapOr<T, E = Error>(
  result: Readonly<Result<T, E>>,
  defaultValue: T,
): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwraps a Result, returning the value or computing a default value from the error.
 * @param result The Result to unwrap
 * @param fn The function to compute the default value from the error
 * @returns The value if the Result is successful, or the computed default value
 */
export function unwrapOrElse<T, E = Error>(
  result: Readonly<Result<T, E>>,
  fn: (error: E) => T,
): T {
  if (result.success) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Combines an array of Results into a single Result containing an array of values.
 * If any Result is an error, returns the first error.
 * @param results Array of Results to combine
 * @returns A Result containing an array of values or the first error
 */
export function combine<T, E = Error>(
  results: ReadonlyArray<Result<T, E>>,
): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.success) {
      return result as Result<T[], E>;
    }
    values.push(result.value);
  }
  return ok(values);
}
