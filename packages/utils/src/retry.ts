/**
 * Retry utility functions for the `@reasonabletech` platform
 */

/**
 * Core retry configuration fields that have default values
 */
interface RetryConfigDefaults {
  /**
   * Maximum number of attempts (including the initial attempt)
   * @default 3
   */
  maxAttempts: number;
  /**
   * Initial delay in milliseconds before the first retry
   * @default 1000
   */
  initialDelay: number;
  /**
   * Maximum delay in milliseconds between retries
   * @default 30000
   */
  maxDelay: number;
  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier: number;
  /**
   * Jitter factor (0-1) to add randomness to delays
   * @default 0.1
   */
  jitterFactor: number;
  /**
   * Function to determine if an error should trigger a retry
   * @default () => true (always retry)
   */
  shouldRetry: (error: unknown, attempt: number) => boolean;
}

/**
 * Optional callback hooks for retry operations
 */
interface RetryCallbacks {
  /**
   * Callback invoked when an attempt fails (before retry decision).
   * Use this for logging, running interceptors, or other side effects.
   */
  onError?: (error: unknown, attempt: number) => void | Promise<void>;

  /**
   * Custom delay calculator that overrides the default exponential backoff.
   * Useful when the error contains retry timing hints (e.g., Retry-After header).
   */
  getDelay?: (attempt: number, error: unknown) => number;
}

/**
 * Resolved configuration after applying defaults
 */
type ResolvedRetryConfig = RetryConfigDefaults & RetryCallbacks;

/**
 * Configuration options for retry operations (all fields optional for user input)
 * @example
 * ```typescript
 * const result = await retry(() => fetchData(), {
 *   maxAttempts: 5,
 *   initialDelay: 500,
 *   onError: (error, attempt) => console.log(`Attempt ${attempt} failed`),
 * });
 * ```
 */
export interface RetryOptions
  extends Partial<RetryConfigDefaults>,
    RetryCallbacks {}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result value if successful */
  value?: T;
  /** The final error if all attempts failed */
  error?: unknown;
  /** Number of attempts made */
  attempts: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryConfigDefaults = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  shouldRetry: () => true,
};

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt - Current attempt number (1-based)
 * @param options - Retry configuration options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: RetryConfigDefaults): number {
  const exponentialDelay =
    options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * options.jitterFactor * Math.random();
  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for the specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff and jitter
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to retry result
 * @example
 * ```typescript
 * // Basic retry with defaults (3 attempts, 1s initial delay)
 * const result = await retry(() => fetchData());
 *
 * // Custom configuration with error callback
 * const result = await retry(() => apiClient.post('/users', userData), {
 *   maxAttempts: 5,
 *   initialDelay: 500,
 *   onError: (error, attempt) => {
 *     logger.warn('API', `Attempt ${attempt} failed`, { error });
 *   },
 * });
 *
 * // Use server-provided Retry-After hint
 * const result = await retry(() => rateLimitedApi.call(), {
 *   getDelay: (attempt, error) => {
 *     if (error instanceof ApiError && error.retryAfter) {
 *       return error.retryAfter; // Use server-provided delay
 *     }
 *     return 1000 * Math.pow(2, attempt - 1); // Fallback to exponential
 *   },
 * });
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const config: ResolvedRetryConfig = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let actualAttempts = 0;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    actualAttempts = attempt;
    try {
      const result = await operation();
      return {
        success: true,
        value: result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;

      // Invoke onError callback if provided
      if (config.onError !== undefined) {
        await config.onError(error, attempt);
      }

      // Don't retry if we've reached max attempts or if shouldRetry says no
      if (
        attempt >= config.maxAttempts ||
        !config.shouldRetry(error, attempt)
      ) {
        break;
      }

      // Calculate delay: use custom getDelay if provided, otherwise default calculation
      const delay =
        config.getDelay !== undefined
          ? config.getDelay(attempt, error)
          : calculateDelay(attempt, config);

      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: actualAttempts,
  };
}

/**
 * Retry an operation with polling (fixed interval, no exponential backoff)
 * @param operation - The async operation to retry
 * @param maxAttempts - Maximum number of attempts
 * @param interval - Fixed interval between attempts in milliseconds
 * @param shouldRetry - Function to determine if retry should continue
 * @returns Promise resolving to retry result
 */
export async function retryWithPolling<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  interval: number,
  shouldRetry: (error: unknown, attempt: number) => boolean = () => true,
): Promise<RetryResult<T>> {
  return await retry(operation, {
    maxAttempts,
    initialDelay: interval,
    maxDelay: interval,
    backoffMultiplier: 1, // No backoff
    jitterFactor: 0, // No jitter for consistent polling
    shouldRetry,
  });
}

/**
 * Retry an operation with exponential backoff (simplified interface)
 * This function throws on failure instead of returning a result object.
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retries (attempts after the first try, default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise resolving to the operation's result
 * @throws {unknown} The last error if all attempts fail
 * @example
 * ```typescript
 * // Retry up to 3 times with exponential backoff
 * const result = await retryWithBackoff(() => fetchData(), 3, 500);
 *
 * // Use default retries (3) and delay (1000ms)
 * const user = await retryWithBackoff(() => createUser(userData));
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  const result = await retry(operation, {
    maxAttempts: maxRetries + 1, // Convert retries to attempts
    initialDelay: baseDelay,
  });

  if (result.success) {
    return result.value as T;
  }

  // Throw the error to match the simpler interface
  throw result.error;
}
