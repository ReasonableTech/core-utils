/**
 * Date/Time Utilities
 *
 * This example demonstrates standardized date/time handling using the
 * datetime utilities. These functions ensure consistent Date object usage
 * internally while providing conversions when required by external APIs.
 *
 * Run: npx tsx examples/datetime-utilities.ts
 */

import {
  now,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  subtractDays,
  subtractHours,
  subtractMinutes,
  subtractSeconds,
  dateToUnixTimestamp,
  unixTimestampToDate,
  dateToISOString,
  isoStringToDate,
  formatDateISO,
  formatTimeISO,
  isDateInPast,
  isDateInFuture,
  isSameDay,
  diffInDays,
  diffInHours,
  diffInMinutes,
  diffInSeconds,
  normalizeToDate,
} from "@reasonabletech/utils/datetime";

// =============================================================================
// Getting Current Time
// =============================================================================

console.log("=== Getting Current Time ===\n");

// now() returns a Date object for the current moment
const currentTime = now();
console.log("Current time (Date object):", currentTime);
console.log("Current time (ISO string):", dateToISOString(currentTime));
console.log("Current time (Unix timestamp):", dateToUnixTimestamp(currentTime));

// =============================================================================
// Date Arithmetic: Adding Time
// =============================================================================

console.log("\n=== Date Arithmetic: Adding Time ===\n");

const baseDate = new Date("2024-01-15T10:00:00Z");
console.log("Base date:", formatDateISO(baseDate), formatTimeISO(baseDate));

// Add various time units
const plus30Seconds = addSeconds(baseDate, 30);
const plus15Minutes = addMinutes(baseDate, 15);
const plus2Hours = addHours(baseDate, 2);
const plus7Days = addDays(baseDate, 7);

console.log("+ 30 seconds:", formatTimeISO(plus30Seconds));
console.log("+ 15 minutes:", formatTimeISO(plus15Minutes));
console.log("+ 2 hours:", formatTimeISO(plus2Hours));
console.log("+ 7 days:", formatDateISO(plus7Days));

// =============================================================================
// Date Arithmetic: Subtracting Time
// =============================================================================

console.log("\n=== Date Arithmetic: Subtracting Time ===\n");

const minus30Seconds = subtractSeconds(baseDate, 30);
const minus15Minutes = subtractMinutes(baseDate, 15);
const minus2Hours = subtractHours(baseDate, 2);
const minus7Days = subtractDays(baseDate, 7);

console.log("- 30 seconds:", formatTimeISO(minus30Seconds));
console.log("- 15 minutes:", formatTimeISO(minus15Minutes));
console.log("- 2 hours:", formatTimeISO(minus2Hours));
console.log("- 7 days:", formatDateISO(minus7Days));

// =============================================================================
// Real-World Example: Token Expiration
// =============================================================================

console.log("\n=== Real-World Example: Token Expiration ===\n");

interface AuthToken {
  token: string;
  issuedAt: Date;
  expiresAt: Date;
  refreshAfter: Date;
}

function createAuthToken(userId: string, expirationMinutes: number = 60): AuthToken {
  const issuedAt = now();
  const expiresAt = addMinutes(issuedAt, expirationMinutes);
  // Refresh token when 75% of lifetime has passed
  const refreshAfter = addMinutes(issuedAt, Math.floor(expirationMinutes * 0.75));

  return {
    token: `token_${userId}_${dateToUnixTimestamp(issuedAt)}`,
    issuedAt,
    expiresAt,
    refreshAfter,
  };
}

function isTokenExpired(token: AuthToken): boolean {
  return isDateInPast(token.expiresAt);
}

function shouldRefreshToken(token: AuthToken): boolean {
  return isDateInPast(token.refreshAfter) && !isTokenExpired(token);
}

const token = createAuthToken("user123", 60);
console.log("Token created:");
console.log("  Issued at:", dateToISOString(token.issuedAt));
console.log("  Expires at:", dateToISOString(token.expiresAt));
console.log("  Refresh after:", dateToISOString(token.refreshAfter));
console.log("  Is expired:", isTokenExpired(token));
console.log("  Should refresh:", shouldRefreshToken(token));

// Simulate an expired token
const expiredToken = createAuthToken("user456");
expiredToken.expiresAt = subtractHours(now(), 1); // Expired 1 hour ago
console.log("\nExpired token check:", isTokenExpired(expiredToken));

// =============================================================================
// Format Conversions
// =============================================================================

console.log("\n=== Format Conversions ===\n");

const sampleDate = new Date("2024-06-15T14:30:45.123Z");

// To various formats
console.log("Original Date:", sampleDate);
console.log("ISO String:", dateToISOString(sampleDate));
console.log("Unix Timestamp:", dateToUnixTimestamp(sampleDate));
console.log("Date only (YYYY-MM-DD):", formatDateISO(sampleDate));
console.log("Time only (HH:MM:SS):", formatTimeISO(sampleDate));

// From various formats
const fromIso = isoStringToDate("2024-12-25T00:00:00Z");
const fromUnix = unixTimestampToDate(1735084800); // Dec 25, 2024
console.log("\nFrom ISO string:", formatDateISO(fromIso));
console.log("From Unix timestamp:", formatDateISO(fromUnix));

// =============================================================================
// Real-World Example: API Timestamp Handling
// =============================================================================

console.log("\n=== Real-World Example: API Timestamp Handling ===\n");

// APIs often send dates in different formats
interface ApiResponse {
  createdAt: string; // ISO string
  updatedAt: number; // Unix timestamp
  expiresAt: string | Date; // Could be either
}

function parseApiTimestamps(response: ApiResponse): {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
} {
  return {
    createdAt: isoStringToDate(response.createdAt),
    updatedAt: unixTimestampToDate(response.updatedAt),
    expiresAt: normalizeToDate(response.expiresAt),
  };
}

const apiResponse: ApiResponse = {
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: 1705320000, // Unix timestamp
  expiresAt: "2024-12-31T23:59:59Z",
};

const parsed = parseApiTimestamps(apiResponse);
console.log("Parsed API timestamps:");
console.log("  Created:", formatDateISO(parsed.createdAt));
console.log("  Updated:", formatDateISO(parsed.updatedAt));
console.log("  Expires:", formatDateISO(parsed.expiresAt));

// =============================================================================
// Date Comparisons
// =============================================================================

console.log("\n=== Date Comparisons ===\n");

const pastDate = subtractDays(now(), 7);
const futureDate = addDays(now(), 7);

console.log("Is 7 days ago in the past?", isDateInPast(pastDate));
console.log("Is 7 days from now in the future?", isDateInFuture(futureDate));
console.log("Is now in the past?", isDateInPast(now()));
console.log("Is now in the future?", isDateInFuture(now()));

// Same day comparison
const morning = new Date("2024-06-15T09:00:00Z");
const evening = new Date("2024-06-15T21:00:00Z");
const nextDay = new Date("2024-06-16T09:00:00Z");

console.log("\nSame day comparisons:");
console.log("  Morning & Evening:", isSameDay(morning, evening)); // true
console.log("  Morning & Next Day:", isSameDay(morning, nextDay)); // false

// =============================================================================
// Calculating Differences
// =============================================================================

console.log("\n=== Calculating Differences ===\n");

const startDate = new Date("2024-01-01T00:00:00Z");
const endDate = new Date("2024-01-15T12:30:45Z");

console.log("Start:", dateToISOString(startDate));
console.log("End:", dateToISOString(endDate));
console.log("Difference:");
console.log("  Days:", diffInDays(endDate, startDate));
console.log("  Hours:", diffInHours(endDate, startDate));
console.log("  Minutes:", diffInMinutes(endDate, startDate));
console.log("  Seconds:", diffInSeconds(endDate, startDate));

// =============================================================================
// Real-World Example: Subscription Billing
// =============================================================================

console.log("\n=== Real-World Example: Subscription Billing ===\n");

interface Subscription {
  id: string;
  startDate: Date;
  billingCycleEnd: Date;
  status: "active" | "expired" | "expiring_soon";
}

function getSubscriptionStatus(sub: Subscription): "active" | "expired" | "expiring_soon" {
  const currentDate = now();

  if (isDateInPast(sub.billingCycleEnd)) {
    return "expired";
  }

  // Expiring soon if less than 7 days left
  const daysRemaining = diffInDays(sub.billingCycleEnd, currentDate);
  if (daysRemaining <= 7) {
    return "expiring_soon";
  }

  return "active";
}

function getDaysUntilRenewal(sub: Subscription): number {
  return diffInDays(sub.billingCycleEnd, now());
}

const subscription: Subscription = {
  id: "sub_123",
  startDate: subtractDays(now(), 25),
  billingCycleEnd: addDays(now(), 5),
  status: "active",
};

console.log("Subscription ID:", subscription.id);
console.log("Status:", getSubscriptionStatus(subscription));
console.log("Days until renewal:", getDaysUntilRenewal(subscription));

// =============================================================================
// Real-World Example: Rate Limiting
// =============================================================================

console.log("\n=== Real-World Example: Rate Limiting ===\n");

interface RateLimitWindow {
  windowStart: Date;
  windowEnd: Date;
  requestCount: number;
  maxRequests: number;
}

function createRateLimitWindow(windowDurationSeconds: number, maxRequests: number): RateLimitWindow {
  const windowStart = now();
  return {
    windowStart,
    windowEnd: addSeconds(windowStart, windowDurationSeconds),
    requestCount: 0,
    maxRequests,
  };
}

function isWindowExpired(window: RateLimitWindow): boolean {
  return isDateInPast(window.windowEnd);
}

function getSecondsUntilReset(window: RateLimitWindow): number {
  return Math.max(0, diffInSeconds(window.windowEnd, now()));
}

const rateLimitWindow = createRateLimitWindow(60, 100);
console.log("Rate limit window:");
console.log("  Window start:", dateToISOString(rateLimitWindow.windowStart));
console.log("  Window end:", dateToISOString(rateLimitWindow.windowEnd));
console.log("  Seconds until reset:", getSecondsUntilReset(rateLimitWindow));
console.log("  Is expired:", isWindowExpired(rateLimitWindow));

// =============================================================================
// Real-World Example: Scheduled Tasks
// =============================================================================

console.log("\n=== Real-World Example: Scheduled Tasks ===\n");

interface ScheduledTask {
  id: string;
  name: string;
  scheduledFor: Date;
  createdAt: Date;
}

function createDailyTask(name: string, hoursFromNow: number): ScheduledTask {
  return {
    id: `task_${Date.now()}`,
    name,
    scheduledFor: addHours(now(), hoursFromNow),
    createdAt: now(),
  };
}

function isTaskDue(task: ScheduledTask): boolean {
  return isDateInPast(task.scheduledFor);
}

function getTimeUntilTask(task: ScheduledTask): string {
  const minutes = diffInMinutes(task.scheduledFor, now());

  if (minutes < 0) return "overdue";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

const morningTask = createDailyTask("Send daily report", 2);
const afternoonTask = createDailyTask("Database backup", 6);

console.log("Morning task:");
console.log("  Name:", morningTask.name);
console.log("  Scheduled for:", dateToISOString(morningTask.scheduledFor));
console.log("  Time until:", getTimeUntilTask(morningTask));
console.log("  Is due:", isTaskDue(morningTask));

console.log("\nAfternoon task:");
console.log("  Name:", afternoonTask.name);
console.log("  Scheduled for:", dateToISOString(afternoonTask.scheduledFor));
console.log("  Time until:", getTimeUntilTask(afternoonTask));
console.log("  Is due:", isTaskDue(afternoonTask));

// =============================================================================
// Chaining Date Operations
// =============================================================================

console.log("\n=== Chaining Date Operations ===\n");

// Calculate a deadline: Start tomorrow at 9 AM, add 5 business days
const startOfTomorrow = addDays(now(), 1);
const businessDeadline = addDays(startOfTomorrow, 5);

console.log("Today:", formatDateISO(now()));
console.log("Start of tomorrow:", formatDateISO(startOfTomorrow));
console.log("Business deadline (5 days later):", formatDateISO(businessDeadline));

// Calculate retry timing with exponential backoff
const baseRetryTime = now();
const retry1 = addSeconds(baseRetryTime, 1);
const retry2 = addSeconds(baseRetryTime, 2);
const retry3 = addSeconds(baseRetryTime, 4);
const retry4 = addSeconds(baseRetryTime, 8);

console.log("\nExponential backoff retry times:");
console.log("  Retry 1:", formatTimeISO(retry1));
console.log("  Retry 2:", formatTimeISO(retry2));
console.log("  Retry 3:", formatTimeISO(retry3));
console.log("  Retry 4:", formatTimeISO(retry4));

console.log("\n=== Examples Complete ===");
