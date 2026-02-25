/**
 * Async Pipelines
 *
 * This example demonstrates composing async transformations using pipeAsync
 * and runSequentially. These utilities are useful for patterns like request/
 * response interceptors, data processing pipelines, and middleware chains.
 *
 * Run: npx tsx examples/async-pipelines.ts
 */

import { pipeAsync, runSequentially } from "@reasonabletech/utils";

// =============================================================================
// Basic pipeAsync Usage
// =============================================================================

console.log("=== Basic pipeAsync Usage ===\n");

// pipeAsync passes a value through a series of async transformations
const result = await pipeAsync(5, [
  async (x) => x * 2, // 10
  async (x) => x + 3, // 13
  async (x) => x * x, // 169
]);

console.log("pipeAsync(5, [x*2, x+3, x*x]):", result);

// Works with sync functions too
const mixedResult = await pipeAsync("hello", [
  (s) => s.toUpperCase(), // Sync
  async (s) => s + " WORLD", // Async
  (s) => s + "!", // Sync
]);

console.log('pipeAsync("hello", [toUpper, +" WORLD", +"!"]):', mixedResult);

// =============================================================================
// Real-World Example: HTTP Request Interceptors
// =============================================================================

console.log("\n=== HTTP Request Interceptors ===\n");

interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  metadata?: {
    requestId?: string;
    timestamp?: number;
    retryCount?: number;
  };
}

// Request interceptors modify the request before it's sent
type RequestInterceptor = (request: HttpRequest) => HttpRequest | Promise<HttpRequest>;

// Add authentication header
const addAuthHeader: RequestInterceptor = async (request) => {
  console.log("  [Interceptor] Adding auth header");
  return {
    ...request,
    headers: {
      ...request.headers,
      Authorization: "Bearer token123",
    },
  };
};

// Add request ID for tracing
const addRequestId: RequestInterceptor = (request) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.log(`  [Interceptor] Adding request ID: ${requestId}`);
  return {
    ...request,
    headers: {
      ...request.headers,
      "X-Request-Id": requestId,
    },
    metadata: {
      ...request.metadata,
      requestId,
    },
  };
};

// Add timestamp
const addTimestamp: RequestInterceptor = (request) => {
  const timestamp = Date.now();
  console.log(`  [Interceptor] Adding timestamp: ${timestamp}`);
  return {
    ...request,
    metadata: {
      ...request.metadata,
      timestamp,
    },
  };
};

// Apply all interceptors to a request
const initialRequest: HttpRequest = {
  method: "POST",
  url: "/api/users",
  headers: {
    "Content-Type": "application/json",
  },
  body: { name: "Alice" },
};

console.log("Initial request:", JSON.stringify(initialRequest, null, 2));

const processedRequest = await pipeAsync(initialRequest, [
  addRequestId,
  addAuthHeader,
  addTimestamp,
]);

console.log("\nProcessed request:", JSON.stringify(processedRequest, null, 2));

// =============================================================================
// Real-World Example: Response Interceptors
// =============================================================================

console.log("\n=== HTTP Response Interceptors ===\n");

interface HttpResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  data: T;
  metadata?: {
    receivedAt?: number;
    duration?: number;
    cached?: boolean;
  };
}

type ResponseInterceptor<T = unknown> = (
  response: HttpResponse<T>
) => HttpResponse<T> | Promise<HttpResponse<T>>;

// Log response status
const logResponse: ResponseInterceptor = (response) => {
  console.log(`  [Interceptor] Response status: ${response.status}`);
  return response;
};

// Add received timestamp
const addReceivedTimestamp: ResponseInterceptor = (response) => {
  console.log("  [Interceptor] Adding received timestamp");
  return {
    ...response,
    metadata: {
      ...response.metadata,
      receivedAt: Date.now(),
    },
  };
};

// Parse JSON data if needed
const parseJsonData: ResponseInterceptor = async (response) => {
  console.log("  [Interceptor] Processing response data");
  // In real code, this might parse JSON strings, handle dates, etc.
  return response;
};

const rawResponse: HttpResponse<{ user: { id: number; name: string } }> = {
  status: 200,
  headers: {
    "Content-Type": "application/json",
  },
  data: { user: { id: 1, name: "Alice" } },
};

console.log("Raw response:", JSON.stringify(rawResponse, null, 2));

const processedResponse = await pipeAsync(rawResponse, [
  logResponse,
  addReceivedTimestamp,
  parseJsonData,
]);

console.log("\nProcessed response:", JSON.stringify(processedResponse, null, 2));

// =============================================================================
// Real-World Example: Data Transformation Pipeline
// =============================================================================

console.log("\n=== Data Transformation Pipeline ===\n");

interface RawUserData {
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string | null;
  created_at: string;
}

interface NormalizedUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  displayName?: string;
  initials?: string;
}

// Pipeline stages for transforming user data
const normalizeFieldNames = async (raw: RawUserData): Promise<NormalizedUser> => {
  console.log("  [Stage 1] Normalizing field names");
  return {
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email_address,
    phone: raw.phone_number,
    createdAt: new Date(raw.created_at),
  };
};

const normalizeEmail = async (user: NormalizedUser): Promise<NormalizedUser> => {
  console.log("  [Stage 2] Normalizing email");
  return {
    ...user,
    email: user.email.toLowerCase().trim(),
  };
};

const addDisplayName = async (user: NormalizedUser): Promise<NormalizedUser> => {
  console.log("  [Stage 3] Adding display name");
  return {
    ...user,
    displayName: `${user.firstName} ${user.lastName}`,
  };
};

const addInitials = async (user: NormalizedUser): Promise<NormalizedUser> => {
  console.log("  [Stage 4] Adding initials");
  return {
    ...user,
    initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
  };
};

const rawUserData: RawUserData = {
  first_name: "Alice",
  last_name: "Smith",
  email_address: "  ALICE@EXAMPLE.COM  ",
  phone_number: "+1-555-0123",
  created_at: "2024-01-15T10:00:00Z",
};

console.log("Raw user data:", rawUserData);

const normalizedUser = await pipeAsync(rawUserData, [
  normalizeFieldNames,
  normalizeEmail,
  addDisplayName,
  addInitials,
]);

console.log("\nNormalized user:", normalizedUser);

// =============================================================================
// runSequentially: Execute Functions in Order
// =============================================================================

console.log("\n=== runSequentially: Execute in Order ===\n");

// runSequentially executes async functions one after another
// Unlike Promise.all, it waits for each to complete before starting the next

async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  console.log(`  [Fetching user ${id}]`);
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { id, name: `User ${id}` };
}

const users = await runSequentially([
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3),
]);

console.log("Fetched users (in order):", users);

// =============================================================================
// Real-World Example: Database Migration Steps
// =============================================================================

console.log("\n=== Database Migration Steps ===\n");

interface MigrationResult {
  step: string;
  success: boolean;
  duration: number;
}

async function migrationStep(
  name: string,
  duration: number
): Promise<MigrationResult> {
  console.log(`  [Migration] Running: ${name}`);
  await new Promise((resolve) => setTimeout(resolve, duration));
  console.log(`  [Migration] Completed: ${name}`);
  return { step: name, success: true, duration };
}

const migrationResults = await runSequentially([
  () => migrationStep("Create users table", 50),
  () => migrationStep("Add indexes", 30),
  () => migrationStep("Seed initial data", 40),
  () => migrationStep("Run validation", 20),
]);

console.log("\nMigration results:");
migrationResults.forEach((result) => {
  console.log(`  ${result.step}: ${result.success ? "✓" : "✗"} (${result.duration}ms)`);
});

// =============================================================================
// Real-World Example: ETL Pipeline
// =============================================================================

console.log("\n=== ETL Pipeline ===\n");

interface DataRecord {
  id: string;
  value: number;
  timestamp: Date;
  source: string;
  validated?: boolean;
  transformed?: boolean;
  enriched?: boolean;
}

// Extract: Fetch data from source
const extractData = async (records: DataRecord[]): Promise<DataRecord[]> => {
  console.log(`  [Extract] Processing ${records.length} records`);
  await new Promise((resolve) => setTimeout(resolve, 50));
  return records;
};

// Transform: Apply business logic
const transformData = async (records: DataRecord[]): Promise<DataRecord[]> => {
  console.log("  [Transform] Applying transformations");
  await new Promise((resolve) => setTimeout(resolve, 50));
  return records.map((r) => ({
    ...r,
    value: r.value * 100, // Convert to cents
    transformed: true,
  }));
};

// Validate: Check data integrity
const validateData = async (records: DataRecord[]): Promise<DataRecord[]> => {
  console.log("  [Validate] Checking data integrity");
  await new Promise((resolve) => setTimeout(resolve, 30));
  return records.map((r) => ({
    ...r,
    validated: r.value > 0,
  }));
};

// Enrich: Add additional context
const enrichData = async (records: DataRecord[]): Promise<DataRecord[]> => {
  console.log("  [Enrich] Adding context");
  await new Promise((resolve) => setTimeout(resolve, 40));
  return records.map((r) => ({
    ...r,
    enriched: true,
  }));
};

const rawRecords: DataRecord[] = [
  { id: "1", value: 10.5, timestamp: new Date(), source: "api" },
  { id: "2", value: 25.0, timestamp: new Date(), source: "manual" },
  { id: "3", value: 5.75, timestamp: new Date(), source: "import" },
];

console.log("Raw records:", rawRecords.map((r) => ({ id: r.id, value: r.value })));

const processedRecords = await pipeAsync(rawRecords, [
  extractData,
  transformData,
  validateData,
  enrichData,
]);

console.log("\nProcessed records:");
processedRecords.forEach((r) => {
  console.log(`  ID ${r.id}: value=${r.value}, validated=${r.validated}, enriched=${r.enriched}`);
});

// =============================================================================
// Real-World Example: Middleware Chain
// =============================================================================

console.log("\n=== Middleware Chain ===\n");

interface Context {
  request: { path: string; method: string };
  response: { status: number; body: unknown };
  user?: { id: string; role: string };
  logs: string[];
}

type Middleware = (ctx: Context) => Context | Promise<Context>;

// Logging middleware
const loggingMiddleware: Middleware = async (ctx) => {
  const log = `${ctx.request.method} ${ctx.request.path}`;
  console.log(`  [Middleware] Logging: ${log}`);
  return {
    ...ctx,
    logs: [...ctx.logs, log],
  };
};

// Auth middleware
const authMiddleware: Middleware = async (ctx) => {
  console.log("  [Middleware] Checking auth");
  // Simulate auth check
  return {
    ...ctx,
    user: { id: "user123", role: "admin" },
    logs: [...ctx.logs, "Auth: success"],
  };
};

// Rate limit middleware
const rateLimitMiddleware: Middleware = async (ctx) => {
  console.log("  [Middleware] Checking rate limit");
  return {
    ...ctx,
    logs: [...ctx.logs, "Rate limit: ok"],
  };
};

// Handler (final step)
const handler: Middleware = async (ctx) => {
  console.log("  [Handler] Processing request");
  return {
    ...ctx,
    response: {
      status: 200,
      body: { message: "Success", user: ctx.user },
    },
    logs: [...ctx.logs, "Handler: processed"],
  };
};

const initialContext: Context = {
  request: { path: "/api/users", method: "GET" },
  response: { status: 0, body: null },
  logs: [],
};

console.log("Initial context:", {
  request: initialContext.request,
  logs: initialContext.logs,
});

const finalContext = await pipeAsync(initialContext, [
  loggingMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  handler,
]);

console.log("\nFinal context:");
console.log("  Response:", finalContext.response);
console.log("  User:", finalContext.user);
console.log("  Logs:", finalContext.logs);

// =============================================================================
// Combining pipeAsync and runSequentially
// =============================================================================

console.log("\n=== Combining Patterns ===\n");

interface BatchItem {
  id: string;
  status: "pending" | "processing" | "complete";
  result?: string;
}

async function processItem(item: BatchItem): Promise<BatchItem> {
  // Process each item through its own pipeline
  return await pipeAsync(item, [
    async (i) => ({ ...i, status: "processing" as const }),
    async (i) => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return i;
    },
    async (i) => ({
      ...i,
      status: "complete" as const,
      result: `Processed ${i.id}`,
    }),
  ]);
}

const batchItems: BatchItem[] = [
  { id: "item-1", status: "pending" },
  { id: "item-2", status: "pending" },
  { id: "item-3", status: "pending" },
];

console.log("Processing batch items sequentially...");

// Process items one at a time, each through its own pipeline
const processedItems = await runSequentially(
  batchItems.map((item) => () => processItem(item))
);

console.log("\nProcessed items:");
processedItems.forEach((item) => {
  console.log(`  ${item.id}: ${item.status} - ${item.result}`);
});

console.log("\n=== Examples Complete ===");
