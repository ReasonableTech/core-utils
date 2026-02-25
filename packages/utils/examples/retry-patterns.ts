/**
 * Retry Patterns
 *
 * This example demonstrates various retry strategies for handling transient
 * failures in API calls, file operations, and external service integrations.
 *
 * Run: npx tsx examples/retry-patterns.ts
 */

import {
  retry,
  retryWithBackoff,
  retryWithPolling,
  sleep,
  type RetryOptions,
  type RetryResult,
} from "@reasonabletech/utils/retry";

// =============================================================================
// Helper: Simulated Flaky Operations
// =============================================================================

// Simulate a flaky API that fails intermittently
let apiCallCount = 0;
async function flakyApiCall(): Promise<{ data: string }> {
  apiCallCount++;
  console.log(`  [API call attempt ${apiCallCount}]`);

  // Fail the first 2 attempts, succeed on the 3rd
  if (apiCallCount < 3) {
    throw new Error(`Temporary failure (attempt ${apiCallCount})`);
  }

  return { data: "Success!" };
}

// Reset the counter for each example
function resetApiCounter(): void {
  apiCallCount = 0;
}

// =============================================================================
// Basic Retry with retryWithBackoff
// =============================================================================

console.log("=== Basic Retry with retryWithBackoff ===\n");

resetApiCounter();

try {
  // Simple retry: 3 retries, 100ms initial delay
  const result = await retryWithBackoff(flakyApiCall, 3, 100);
  console.log("Result:", result);
} catch (error) {
  console.log("Failed after all retries:", error);
}

// =============================================================================
// Full Control with retry()
// =============================================================================

console.log("\n=== Full Control with retry() ===\n");

resetApiCounter();

const fullResult = await retry(flakyApiCall, {
  maxAttempts: 5,
  initialDelay: 100,
  maxDelay: 2000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  onError: (error, attempt) => {
    console.log(`  [onError callback] Attempt ${attempt} failed:`, error);
  },
});

console.log("Full retry result:", {
  success: fullResult.success,
  attempts: fullResult.attempts,
  value: fullResult.value,
});

// =============================================================================
// Conditional Retry Based on Error Type
// =============================================================================

console.log("\n=== Conditional Retry Based on Error Type ===\n");

// Custom error types
class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}

let conditionalCallCount = 0;

async function operationWithDifferentErrors(): Promise<string> {
  conditionalCallCount++;
  console.log(`  [Conditional operation attempt ${conditionalCallCount}]`);

  if (conditionalCallCount === 1) {
    throw new RetryableError("Network timeout - this is retryable");
  }
  if (conditionalCallCount === 2) {
    throw new RetryableError("Service unavailable - this is retryable");
  }
  return "Operation succeeded!";
}

const conditionalResult = await retry(operationWithDifferentErrors, {
  maxAttempts: 5,
  initialDelay: 50,
  shouldRetry: (error) => {
    // Only retry for RetryableError
    const shouldRetry = error instanceof RetryableError;
    console.log(
      `  [shouldRetry] Error type: ${(error as Error).name}, will retry: ${shouldRetry}`
    );
    return shouldRetry;
  },
});

console.log("Conditional retry result:", conditionalResult);

// Demonstrate non-retryable error
conditionalCallCount = 0;

async function operationWithNonRetryableError(): Promise<string> {
  conditionalCallCount++;
  console.log(`  [Non-retryable attempt ${conditionalCallCount}]`);
  throw new NonRetryableError("Invalid authentication - do not retry");
}

const nonRetryableResult = await retry(operationWithNonRetryableError, {
  maxAttempts: 5,
  initialDelay: 50,
  shouldRetry: (error) => error instanceof RetryableError,
});

console.log("Non-retryable error result:", {
  success: nonRetryableResult.success,
  attempts: nonRetryableResult.attempts,
  error: (nonRetryableResult.error as Error)?.message,
});

// =============================================================================
// Custom Delay Calculation (Retry-After Header)
// =============================================================================

console.log("\n=== Custom Delay Calculation (Retry-After Header) ===\n");

// Simulate an API that returns Retry-After hints
class RateLimitError extends Error {
  retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`Rate limited, retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

let rateLimitCallCount = 0;

async function rateLimitedApi(): Promise<{ data: string }> {
  rateLimitCallCount++;
  console.log(`  [Rate limited API attempt ${rateLimitCallCount}]`);

  if (rateLimitCallCount < 3) {
    // Server says "retry after 200ms"
    throw new RateLimitError(200);
  }

  return { data: "Rate limit cleared!" };
}

const rateLimitResult = await retry(rateLimitedApi, {
  maxAttempts: 5,
  initialDelay: 1000, // Default delay (will be overridden)
  getDelay: (attempt, error) => {
    // Use server-provided delay if available
    if (error instanceof RateLimitError) {
      console.log(`  [getDelay] Using server-provided delay: ${error.retryAfterMs}ms`);
      return error.retryAfterMs;
    }
    // Fallback to exponential backoff
    const fallbackDelay = 100 * Math.pow(2, attempt - 1);
    console.log(`  [getDelay] Using fallback delay: ${fallbackDelay}ms`);
    return fallbackDelay;
  },
});

console.log("Rate limit retry result:", rateLimitResult);

// =============================================================================
// Fixed-Interval Polling with retryWithPolling
// =============================================================================

console.log("\n=== Fixed-Interval Polling ===\n");

// Simulate a job status check
let jobCheckCount = 0;
const jobId = "job-12345";

async function checkJobStatus(): Promise<{ status: string; result?: string }> {
  jobCheckCount++;
  console.log(`  [Checking job ${jobId} - poll ${jobCheckCount}]`);

  // Simulate job completing after 3 checks
  if (jobCheckCount < 3) {
    throw new Error("Job still processing");
  }

  return { status: "completed", result: "Processing finished!" };
}

const pollingResult = await retryWithPolling(
  checkJobStatus,
  10, // Max 10 attempts
  100, // Check every 100ms
  () => true // Always retry (job is processing)
);

console.log("Polling result:", pollingResult);

// =============================================================================
// Real-World Example: File Download with Retry
// =============================================================================

console.log("\n=== Real-World Example: File Download ===\n");

interface DownloadResult {
  filename: string;
  size: number;
  checksum: string;
}

let downloadAttempt = 0;

async function downloadFile(url: string): Promise<DownloadResult> {
  downloadAttempt++;
  console.log(`  [Download attempt ${downloadAttempt} for ${url}]`);

  // Simulate network issues on first 2 attempts
  if (downloadAttempt === 1) {
    throw new Error("Connection reset by peer");
  }
  if (downloadAttempt === 2) {
    throw new Error("Timeout waiting for response");
  }

  // Simulate successful download
  await sleep(50); // Simulate download time
  return {
    filename: "data.json",
    size: 1024,
    checksum: "abc123",
  };
}

const downloadResult = await retry(() => downloadFile("https://api.example.com/data"), {
  maxAttempts: 5,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  onError: (error, attempt) => {
    console.log(`  [Download failed] Attempt ${attempt}: ${(error as Error).message}`);
  },
  shouldRetry: (error) => {
    // Retry on network errors, not on 404s
    const message = (error as Error).message;
    return !message.includes("404") && !message.includes("Not Found");
  },
});

if (downloadResult.success) {
  console.log("Download succeeded:", downloadResult.value);
} else {
  console.log("Download failed after all retries:", downloadResult.error);
}

// =============================================================================
// Real-World Example: Database Connection
// =============================================================================

console.log("\n=== Real-World Example: Database Connection ===\n");

interface DbConnection {
  id: string;
  connected: boolean;
}

let dbConnectAttempt = 0;

async function connectToDatabase(): Promise<DbConnection> {
  dbConnectAttempt++;
  console.log(`  [DB connection attempt ${dbConnectAttempt}]`);

  // Simulate database being temporarily unavailable
  if (dbConnectAttempt < 2) {
    throw new Error("ECONNREFUSED - database not ready");
  }

  return { id: "conn-" + Math.random().toString(36).slice(2, 8), connected: true };
}

const dbResult = await retry(connectToDatabase, {
  maxAttempts: 5,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.2, // More jitter for thundering herd prevention
  onError: (error, attempt) => {
    console.log(
      `  [DB connection failed] Attempt ${attempt}/${5}: ${(error as Error).message}`
    );
    console.log(`    Will retry with exponential backoff...`);
  },
});

if (dbResult.success) {
  console.log("Database connected:", dbResult.value);
} else {
  console.log("Database connection failed:", (dbResult.error as Error).message);
}

// =============================================================================
// Pattern: Retry with Circuit Breaker Logic
// =============================================================================

console.log("\n=== Pattern: Retry with Error Tracking ===\n");

// Track consecutive failures to implement circuit breaker-like behavior
let consecutiveFailures = 0;
const maxConsecutiveFailures = 3;
let circuitBreakerAttempt = 0;

async function callExternalService(): Promise<{ status: string }> {
  circuitBreakerAttempt++;
  console.log(`  [External service call ${circuitBreakerAttempt}]`);

  // Simulate intermittent failures
  if (circuitBreakerAttempt % 4 !== 0) {
    throw new Error("Service temporarily unavailable");
  }

  return { status: "ok" };
}

const circuitBreakerResult = await retry(callExternalService, {
  maxAttempts: 10,
  initialDelay: 50,
  shouldRetry: (error, attempt) => {
    consecutiveFailures++;
    console.log(`  [Circuit breaker] Consecutive failures: ${consecutiveFailures}`);

    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log(`  [Circuit breaker] Too many failures, stopping retries`);
      return false;
    }

    return true;
  },
  onError: () => {
    // Error callback runs before shouldRetry
  },
});

console.log("Circuit breaker result:", {
  success: circuitBreakerResult.success,
  attempts: circuitBreakerResult.attempts,
});

// =============================================================================
// Summary of Retry Options
// =============================================================================

console.log("\n=== Retry Options Summary ===\n");

const exampleOptions: RetryOptions = {
  // Number of total attempts (including first try)
  maxAttempts: 3,

  // Initial delay before first retry (ms)
  initialDelay: 1000,

  // Maximum delay cap (ms)
  maxDelay: 30000,

  // Multiplier for exponential backoff
  backoffMultiplier: 2,

  // Jitter factor (0-1) to add randomness
  jitterFactor: 0.1,

  // Function to decide if error should trigger retry
  shouldRetry: (error, attempt) => {
    console.log(`Checking if attempt ${attempt} should retry`);
    return true;
  },

  // Callback when an attempt fails
  onError: (error, attempt) => {
    console.log(`Attempt ${attempt} failed:`, error);
  },

  // Custom delay calculator (overrides default backoff)
  getDelay: (attempt, error) => {
    return 1000 * attempt; // Linear backoff example
  },
};

console.log("Example retry options:", Object.keys(exampleOptions));

console.log("\n=== Examples Complete ===");
