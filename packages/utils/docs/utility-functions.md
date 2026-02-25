# Utility Functions

This document describes the utility functions available in `@reasonabletech/utils` for common value checking, object construction, date/time handling, error handling, and retry patterns.

## Overview

The utility functions provide clean, reusable ways to handle common patterns in TypeScript applications, especially when dealing with optional properties, `exactOptionalPropertyTypes: true`, Result-based error handling, and retry logic.

## Table of Contents

- [String Functions](#string-functions)
- [Object Functions](#object-functions)
- [Date/Time Functions](#datetime-functions)
- [Result Type](#result-type)
- [Retry Functions](#retry-functions)

## String Functions

### `isEmptyString(value)`

Checks if a string value is empty, null, or undefined.

**Type Signature:**

```typescript
function isEmptyString(
  value: string | null | undefined,
): value is null | undefined | "";
```

**Parameters:**

- `value` - The string value to check

**Returns:**

- `true` if the value is `null`, `undefined`, or empty string `""`
- `false` otherwise

**Type Guard:**
This function acts as a type guard. When it returns `false`, TypeScript knows the value is a non-empty string.

**Examples:**

```typescript
import { isEmptyString } from "@reasonabletech/utils";

// Basic usage
if (isEmptyString(someValue)) {
  return null; // Handle empty case
}

// Type narrowing
const value: string | null | undefined = getUserInput();
if (!isEmptyString(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}

// Replacing verbose checks
// ❌ Before:
if (base64Url === undefined || base64Url === null || base64Url === "") {
  return null;
}

// ✅ After:
if (isEmptyString(base64Url)) {
  return null;
}
```

---

### `isNonEmptyString(value)`

Checks if a string is not empty and contains non-whitespace characters. This is a type guard version.

**Type Signature:**

```typescript
function isNonEmptyString(value: string | null | undefined): value is string;
```

**Parameters:**

- `value` - The string to check

**Returns:**

- `true` if the value is a non-empty string with non-whitespace content
- `false` for `null`, `undefined`, empty string, or whitespace-only string

**Type Guard:**
This function acts as a type guard. When it returns `true`, TypeScript knows the value is a string.

**Examples:**

```typescript
import { isNonEmptyString } from "@reasonabletech/utils";

// Type narrowing
const input: string | null | undefined = getUserInput();
if (isNonEmptyString(input)) {
  // TypeScript knows input is string here
  processInput(input.trim());
}

// Filtering arrays
const values = ["hello", "", null, "  ", "world"];
const nonEmpty = values.filter(isNonEmptyString);
// Result: ["hello", "world"]
```

---

### `truncateString(str, maxLength)`

Truncates a string to a maximum length, adding ellipsis if truncated.

**Type Signature:**

```typescript
function truncateString(str: string, maxLength: number): string;
```

**Parameters:**

- `str` - The string to truncate
- `maxLength` - Maximum length including ellipsis (must be >= 3 for truncation to show ellipsis)

**Returns:**

- Original string if within maxLength
- Truncated string with "..." appended if exceeds maxLength

**Examples:**

```typescript
import { truncateString } from "@reasonabletech/utils";

// Short string unchanged
truncateString("Hello", 10);
// Result: "Hello"

// Long string truncated
truncateString("Hello, World!", 10);
// Result: "Hello, ..."

// Useful for UI display
const displayName = truncateString(user.fullName, 20);
const preview = truncateString(article.content, 150);
```

---

### `capitalize(str)`

Capitalizes the first letter of a string.

**Type Signature:**

```typescript
function capitalize(str: string): string;
```

**Parameters:**

- `str` - The string to capitalize

**Returns:**

- String with first letter capitalized, rest unchanged
- Empty string if input is empty

**Examples:**

```typescript
import { capitalize } from "@reasonabletech/utils";

capitalize("hello");
// Result: "Hello"

capitalize("hello world");
// Result: "Hello world"

capitalize("");
// Result: ""

// Useful for display formatting
const label = capitalize(fieldName.replace(/_/g, " "));
```

---

### `encodeBase64Url(data)`

Creates a base64url encoded string (URL-safe, no padding).

**Type Signature:**

```typescript
function encodeBase64Url(data: string | Buffer): string;
```

**Parameters:**

- `data` - Data to encode (string or Buffer)

**Returns:**

- Base64url encoded string with URL-safe characters (`-` instead of `+`, `_` instead of `/`) and no padding (`=`)

**Examples:**

```typescript
import { encodeBase64Url } from "@reasonabletech/utils";

// Encode a string
encodeBase64Url("Hello, World!");
// Result: "SGVsbG8sIFdvcmxkIQ"

// Encode binary data
const buffer = Buffer.from([0x00, 0x01, 0x02, 0xff]);
encodeBase64Url(buffer);
// Result: "AAEC_w"

// Useful for JWT tokens, URL parameters
const encodedPayload = encodeBase64Url(JSON.stringify(payload));
```

---

### `decodeBase64Url(encoded)`

Decodes a base64url encoded string.

**Type Signature:**

```typescript
function decodeBase64Url(encoded: string): Buffer;
```

**Parameters:**

- `encoded` - Base64url encoded string

**Returns:**

- Decoded data as Buffer

**Examples:**

```typescript
import { decodeBase64Url } from "@reasonabletech/utils";

// Decode to string
const buffer = decodeBase64Url("SGVsbG8sIFdvcmxkIQ");
buffer.toString("utf-8");
// Result: "Hello, World!"

// Decode JWT payload
const payload = JSON.parse(decodeBase64Url(jwtPayloadPart).toString("utf-8"));
```

---

### `isValidBase64Url(str)`

Checks if a string is in valid base64url format.

**Type Signature:**

```typescript
function isValidBase64Url(str: string): boolean;
```

**Parameters:**

- `str` - String to validate

**Returns:**

- `true` if the string only contains valid base64url characters (`A-Z`, `a-z`, `0-9`, `-`, `_`)
- `false` otherwise

**Examples:**

```typescript
import { isValidBase64Url } from "@reasonabletech/utils";

isValidBase64Url("SGVsbG8");      // true
isValidBase64Url("SGVs+bG8");     // false (contains +)
isValidBase64Url("SGVs/bG8");     // false (contains /)
isValidBase64Url("SGVsbG8=");     // false (contains =)

// Validate before decoding
if (isValidBase64Url(token)) {
  const decoded = decodeBase64Url(token);
}
```

---

### `getErrorMessage(error)` *(Deprecated)*

> **⚠️ Deprecated:** This utility is unnecessary. The logger accepts `ErrorLike` (unknown) directly via `logger.error(tag, message, error)`. Pass errors directly to the logger instead of manually converting to strings.

Extracts a message string from an unknown error value.

**Type Signature:**

```typescript
function getErrorMessage(error: unknown): string;
```

**Parameters:**

- `error` - Error value (Error object, string, or other)

**Returns:**

- Error message string extracted from the error

**Examples:**

```typescript
// ❌ DEPRECATED: Manual error string extraction
try {
  await operation();
} catch (error) {
  logger.error("Component", getErrorMessage(error));
}

// ✅ CORRECT: Pass error directly to logger
try {
  await operation();
} catch (error) {
  logger.error("Component", "Operation failed", error);
}
```

---

### `hasContent(value)`

Checks if a value has meaningful content (is a non-empty string).

**Type Signature:**

```typescript
function hasContent(value: unknown): value is string;
```

**Parameters:**

- `value` - The value to check (can be any type)

**Returns:**

- `true` if the value is a non-empty string
- `false` for `null`, `undefined`, empty string, or any non-string type

**Type Guard:**
This function acts as a type guard. When it returns `true`, TypeScript knows the value is a string.

**Examples:**

```typescript
import { hasContent } from "@reasonabletech/utils";

// Type-safe content checking
const payload: Record<string, unknown> = getTokenPayload();

if (hasContent(payload.email)) {
  // TypeScript knows payload.email is string here
  sendEmailTo(payload.email);
}

// Filtering arrays
const values = [null, "", "hello", undefined, "world", 123];
const validStrings = values.filter(hasContent);
// validStrings: ["hello", "world"] (typed as string[])

// Object construction
const user = {
  id: "123",
  // Only include email if it has content
  ...(hasContent(userData.email) ? { email: userData.email } : {}),
};
```

---

### `withProperty(key, value)`

Creates an object with a property only if the value has content. This is particularly useful for building objects with optional properties while maintaining `exactOptionalPropertyTypes` compliance.

**Type Signature:**

```typescript
function withProperty<K extends string>(
  key: K,
  value: unknown,
): Record<K, string> | Record<string, never>;
```

**Parameters:**

- `key` - The property key (must be a string literal type)
- `value` - The value to check

**Returns:**

- Object with the property if value has content: `{ [key]: value }`
- Empty object if value doesn't have content: `{}`

**Type Safety:**
The return type ensures proper TypeScript inference when used with object spread.

**Examples:**

```typescript
import { withProperty } from "@reasonabletech/utils";

// Basic usage
const emailProp = withProperty("email", "user@example.com");
// Result: { email: "user@example.com" }

const emptyProp = withProperty("email", "");
// Result: {}

// Object construction with optional properties
const payload = {
  sub: "user123",
  email: "test@example.com",
  name: "",
  avatar: null,
};

const user = {
  id: payload.sub as string,
  ...withProperty("email", payload.email),
  ...withProperty("name", payload.name),
  ...withProperty("avatar", payload.avatar),
};
// Result: { id: "user123", email: "test@example.com" }

// Replacing verbose conditional spreads
// ❌ Before:
const user = {
  id: "123",
  ...(payload.email !== undefined &&
  payload.email !== null &&
  payload.email !== ""
    ? { email: payload.email as string }
    : {}),
  ...(payload.name !== undefined && payload.name !== null && payload.name !== ""
    ? { name: payload.name as string }
    : {}),
};

// ✅ After:
const user = {
  id: "123",
  ...withProperty("email", payload.email),
  ...withProperty("name", payload.name),
};
```

---

## Object Functions

### `includeIf(key, value)`

Conditionally includes a property in an object if the value is not undefined. This is useful for `exactOptionalPropertyTypes` compliance.

**Type Signature:**

```typescript
function includeIf<K extends string, V>(
  key: K,
  value: V | undefined,
): Record<string, unknown>;
```

**Parameters:**

- `key` - The property key to conditionally include
- `value` - The value to include, or undefined to omit the property

**Returns:**

- Empty object `{}` if value is undefined
- Object `{ [key]: value }` if value is defined

**Examples:**

```typescript
import { includeIf } from "@reasonabletech/utils";

// Basic usage
const obj = {
  required: "value",
  ...includeIf("optional", maybeUndefinedValue),
};
// If maybeUndefinedValue is "hello": { required: "value", optional: "hello" }
// If maybeUndefinedValue is undefined: { required: "value" }

// API response building
function createUserResponse(user: User) {
  return {
    id: user.id,
    name: user.name,
    ...includeIf("email", user.email),
    ...includeIf("avatar", user.avatar?.url),
    ...includeIf("lastLogin", user.lastLoginAt?.toISOString()),
  };
}

// Billing service usage
return {
  amount: pricing.amount,
  ...includeIf("setupFee", pricing.setupFee),
  ...includeIf("savings", calculatedSavings),
};
```

---

### `includeIfDefined(obj)`

Conditionally includes multiple properties from an object, omitting any with undefined values.

**Type Signature:**

```typescript
function includeIfDefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown>;
```

**Parameters:**

- `obj` - Object containing key-value pairs where values may be undefined

**Returns:**

- New object containing only the properties where values are not undefined

**Examples:**

```typescript
import { includeIfDefined } from "@reasonabletech/utils";

// Basic usage
const obj = {
  required: "value",
  ...includeIfDefined({
    optional1: maybeUndefined1,
    optional2: maybeUndefined2,
  }),
};

// Configuration object building
const config = {
  host: "localhost",
  port: 3000,
  ...includeIfDefined({
    ssl: sslEnabled ? sslConfig : undefined,
    auth: authConfig,
    timeout: userTimeout,
    retries: retryCount,
  }),
};

// Form data processing
const formData = {
  name: data.name,
  email: data.email,
  ...includeIfDefined({
    phone: data.phone?.trim() || undefined,
    company: data.company?.trim() || undefined,
  }),
};
```

---

### `omitUndefined(obj)`

Omits properties with undefined values from an object. Alias for `includeIfDefined`.

**Type Signature:**

```typescript
function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown>;
```

**Parameters:**

- `obj` - The object to clean of undefined properties

**Returns:**

- New object with undefined properties removed (null, 0, "", false are preserved)

**Examples:**

```typescript
import { omitUndefined } from "@reasonabletech/utils";

// Basic cleanup
const cleanObj = omitUndefined({
  a: "defined",
  b: undefined,    // ❌ removed
  c: null,         // ✅ preserved (null ≠ undefined)
  d: 0,            // ✅ preserved (falsy but defined)
  e: "",           // ✅ preserved (falsy but defined)
  f: false,        // ✅ preserved (falsy but defined)
});
// Result: { a: "defined", c: null, d: 0, e: "", f: false }

// Before database save
const userUpdate = omitUndefined({
  name: formData.name,
  email: formData.email,
  avatar: formData.avatar,
  settings: formData.settings,
});
```

---

### `conditionalProps(conditions)`

Creates an object with conditional properties based on boolean conditions.

**Type Signature:**

```typescript
function conditionalProps(
  conditions: Record<string, Record<string, unknown>>,
): Record<string, unknown>;
```

**Parameters:**

- `conditions` - Object where keys are stringified boolean conditions and values are objects to include

**Returns:**

- Object containing properties from all truthy conditions

**Examples:**

```typescript
import { conditionalProps } from "@reasonabletech/utils";

// Basic conditional properties
const obj = {
  always: "included",
  ...conditionalProps({
    [String(isEnabled)]: { feature: "enabled" },
    [String(hasPermission)]: { admin: true },
  }),
};

// Feature flags
const config = {
  baseUrl: "https://api.example.com",
  ...conditionalProps({
    [String(enableLogging)]: { logging: { level: "debug" } },
    [String(enableMetrics)]: { metrics: { endpoint: "/metrics" } },
    [String(enableAuth)]: { auth: { provider: "oauth" } },
  }),
};

// User permission-based UI
const uiConfig = {
  showProfile: true,
  ...conditionalProps({
    [String(user.isAdmin)]: { showAdminPanel: true },
    [String(user.isPremium)]: { showPremiumFeatures: true },
  }),
};
```

---

### `pick(obj, keys)`

Type-safe way to pick properties from an object.

**Type Signature:**

```typescript
function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K>;
```

**Parameters:**

- `obj` - The source object to pick properties from
- `keys` - Array of keys to pick from the object

**Returns:**

- New object containing only the specified properties

**Examples:**

```typescript
import { pick } from "@reasonabletech/utils";

// Basic property picking
const user = { id: 1, name: "John", email: "john@example.com", password: "secret" };
const publicUser = pick(user, ["id", "name", "email"]);
// Result: { id: 1, name: "John", email: "john@example.com" }

// API response filtering
function createPublicProfile(fullUser: FullUser) {
  return pick(fullUser, ["id", "username", "displayName", "avatar", "joinedAt"]);
}

// Configuration subset
const fullConfig = { host: "localhost", port: 3000, ssl: true, debug: true, secret: "xxx" };
const clientConfig = pick(fullConfig, ["host", "port", "ssl"]);
// Result: { host: "localhost", port: 3000, ssl: true }
```

---

### `omit(obj, keys)`

Type-safe way to omit properties from an object.

**Type Signature:**

```typescript
function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K>;
```

**Parameters:**

- `obj` - The source object to omit properties from
- `keys` - Array of keys to omit from the object

**Returns:**

- New object with the specified properties removed

**Examples:**

```typescript
import { omit } from "@reasonabletech/utils";

// Remove sensitive data
const user = { id: 1, name: "John", email: "john@example.com", password: "secret", ssn: "xxx" };
const safeUser = omit(user, ["password", "ssn"]);
// Result: { id: 1, name: "John", email: "john@example.com" }

// Remove internal properties
function toApiResponse(internalObj: InternalUser) {
  return omit(internalObj, ["_id", "_version", "_internal", "hashedPassword", "secretKey"]);
}

// Configuration sanitization
const fullConfig = {
  host: "localhost",
  port: 3000,
  apiSecret: "xxx",
  dbPassword: "yyy",
};
const publicConfig = omit(fullConfig, ["apiSecret", "dbPassword"]);
// Result: { host: "localhost", port: 3000 }
```

---

## Common Patterns

### JWT Token Parsing

```typescript
import { withProperty } from "@reasonabletech/utils";

function extractUserFromToken(token: string): {
  id: string;
  email?: string;
  name?: string;
} | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id: (payload.sub as string) || "",
    ...withProperty("email", payload.email),
    ...withProperty("name", payload.name),
  };
}
```

### API Response Processing

```typescript
import { withProperty, hasContent } from "@reasonabletech/utils";

function processUserData(apiResponse: Record<string, unknown>) {
  const user = {
    id: apiResponse.id as string,
    ...withProperty("email", apiResponse.email),
    ...withProperty("displayName", apiResponse.display_name),
    ...withProperty("avatar", apiResponse.avatar_url),
  };

  // Validate required fields
  if (!hasContent(user.id)) {
    throw new Error("User ID is required");
  }

  return user;
}
```

### Form Data Validation

```typescript
import { hasContent, withProperty } from "@reasonabletech/utils";

function validateRegistrationForm(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString();

  const errors: string[] = [];

  if (!hasContent(email)) {
    errors.push("Email is required");
  }

  if (!hasContent(password)) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email: email as string, // TypeScript knows this is string
      password: password as string,
      ...withProperty("name", name), // Optional field
    },
  };
}
```

## Integration with exactOptionalPropertyTypes

These utilities are specifically designed to work well with TypeScript's `exactOptionalPropertyTypes: true` setting, which prevents assigning `undefined` to optional properties.

```typescript
// ❌ This fails with exactOptionalPropertyTypes: true
interface User {
  id: string;
  email?: string;
}

const user: User = {
  id: "123",
  email: someValue, // Error if someValue could be undefined
};

// ✅ This works perfectly
const user: User = {
  id: "123",
  ...withProperty("email", someValue), // Only includes email if it has content
};
```

## Performance Considerations

- All functions are lightweight with minimal overhead
- `hasContent()` performs a simple type check and string comparison
- `withProperty()` creates objects conditionally, avoiding unnecessary object creation
- Functions are tree-shakeable when using modern bundlers

## Modern Usage Refactors

### Verbose Null Checks

```typescript
// Before
if (value === null || value === undefined || value === "") {
  // handle empty case
}

// After
if (isEmptyString(value)) {
  // handle empty case
}
```

### Complex Conditional Spreads

```typescript
// Before
const obj = {
  required: "value",
  ...(optional !== undefined && optional !== null && optional !== ""
    ? { optional: optional as string }
    : {}),
};

// After
const obj = {
  required: "value",
  ...withProperty("optional", optional),
};
```

### Manual Type Guards

```typescript
// Before
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

// After
import { hasContent } from "@reasonabletech/utils";
// Use hasContent directly
```

---

## Date/Time Functions

This module provides standardized date/time handling utilities. Key principles:
- Use Date objects for all internal date/time representations
- Only convert to strings/numbers when required by external specs/APIs
- Provide clear, descriptive function names

### `now()`

Gets the current Date object.

**Type Signature:**

```typescript
function now(): Date;
```

**Returns:**

- Current Date object

**Examples:**

```typescript
import { now } from "@reasonabletech/utils";

const currentTime = now();
console.log(currentTime.toISOString());

// Use as a base for calculations
const tomorrow = addDays(now(), 1);
const lastWeek = subtractDays(now(), 7);
```

---

### `dateToUnixTimestamp(date)`

Converts a Date object to Unix timestamp (seconds since epoch).

**Type Signature:**

```typescript
function dateToUnixTimestamp(date: Date): number;
```

**Parameters:**

- `date` - The Date object to convert

**Returns:**

- Unix timestamp in seconds

**Examples:**

```typescript
import { dateToUnixTimestamp, now } from "@reasonabletech/utils";

const timestamp = dateToUnixTimestamp(now());
// Result: 1699876543 (example)

// Useful for JWT claims
const jwtPayload = {
  sub: userId,
  iat: dateToUnixTimestamp(now()),
  exp: dateToUnixTimestamp(addHours(now(), 24)),
};
```

---

### `unixTimestampToDate(timestamp)`

Converts a Unix timestamp (seconds since epoch) to a Date object.

**Type Signature:**

```typescript
function unixTimestampToDate(timestamp: number): Date;
```

**Parameters:**

- `timestamp` - Unix timestamp in seconds

**Returns:**

- Date object

**Examples:**

```typescript
import { unixTimestampToDate } from "@reasonabletech/utils";

const date = unixTimestampToDate(1699876543);
console.log(date.toISOString());
// Result: "2023-11-13T12:15:43.000Z" (example)

// Parse JWT expiration
const expiresAt = unixTimestampToDate(jwtPayload.exp);
if (isDateInPast(expiresAt)) {
  throw new Error("Token expired");
}
```

---

### `dateToISOString(date)`

Converts a Date object to ISO string.

**Type Signature:**

```typescript
function dateToISOString(date: Date): string;
```

**Parameters:**

- `date` - The Date object to convert

**Returns:**

- ISO string representation (e.g., "2023-11-13T12:15:43.000Z")

**Examples:**

```typescript
import { dateToISOString, now } from "@reasonabletech/utils";

const isoString = dateToISOString(now());
// Result: "2023-11-13T12:15:43.000Z"

// For API responses
const response = {
  createdAt: dateToISOString(entity.createdAt),
  updatedAt: dateToISOString(entity.updatedAt),
};
```

---

### `isoStringToDate(isoString)`

Converts an ISO string to a Date object.

**Type Signature:**

```typescript
function isoStringToDate(isoString: string): Date;
```

**Parameters:**

- `isoString` - ISO string representation

**Returns:**

- Date object

**Examples:**

```typescript
import { isoStringToDate } from "@reasonabletech/utils";

const date = isoStringToDate("2023-11-13T12:15:43.000Z");

// Parse API response dates
const createdAt = isoStringToDate(apiResponse.created_at);
```

---

### `normalizeToDate(dateOrString)`

Converts a Date | string union to a Date object. Useful for migration from mixed patterns.

**Type Signature:**

```typescript
function normalizeToDate(dateOrString: Date | string): Date;
```

**Parameters:**

- `dateOrString` - Date object or ISO string

**Returns:**

- Date object (returns input directly if already a Date)

**Examples:**

```typescript
import { normalizeToDate } from "@reasonabletech/utils";

// Handles both Date and string inputs
const date1 = normalizeToDate(new Date());
const date2 = normalizeToDate("2023-11-13T12:15:43.000Z");

// Useful when migrating APIs
function processEvent(event: { timestamp: Date | string }) {
  const timestamp = normalizeToDate(event.timestamp);
  // Now always a Date object
}
```

---

### `isDateInPast(date)`

Checks if a Date object represents a time in the past.

**Type Signature:**

```typescript
function isDateInPast(date: Date): boolean;
```

**Parameters:**

- `date` - The Date object to check

**Returns:**

- `true` if the date is in the past

**Examples:**

```typescript
import { isDateInPast, subtractDays, now } from "@reasonabletech/utils";

const yesterday = subtractDays(now(), 1);
isDateInPast(yesterday);  // true

const tomorrow = addDays(now(), 1);
isDateInPast(tomorrow);   // false

// Token validation
if (isDateInPast(tokenExpiresAt)) {
  throw new TokenExpiredError();
}
```

---

### `isDateInFuture(date)`

Checks if a Date object represents a time in the future.

**Type Signature:**

```typescript
function isDateInFuture(date: Date): boolean;
```

**Parameters:**

- `date` - The Date object to check

**Returns:**

- `true` if the date is in the future

**Examples:**

```typescript
import { isDateInFuture, addDays, now } from "@reasonabletech/utils";

const tomorrow = addDays(now(), 1);
isDateInFuture(tomorrow);  // true

const yesterday = subtractDays(now(), 1);
isDateInFuture(yesterday); // false

// Scheduling validation
if (!isDateInFuture(scheduledAt)) {
  throw new Error("Scheduled time must be in the future");
}
```

---

### `addSeconds(date, seconds)`

Adds seconds to a Date object.

**Type Signature:**

```typescript
function addSeconds(date: Date, seconds: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `seconds` - Number of seconds to add

**Returns:**

- New Date object with added seconds

**Examples:**

```typescript
import { addSeconds, now } from "@reasonabletech/utils";

const later = addSeconds(now(), 30);
// 30 seconds from now

// Token with short lifetime
const tokenExpiry = addSeconds(now(), 300); // 5 minutes
```

---

### `subtractSeconds(date, seconds)`

Subtracts seconds from a Date object.

**Type Signature:**

```typescript
function subtractSeconds(date: Date, seconds: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `seconds` - Number of seconds to subtract

**Returns:**

- New Date object with subtracted seconds

**Examples:**

```typescript
import { subtractSeconds, now } from "@reasonabletech/utils";

const earlier = subtractSeconds(now(), 60);
// 1 minute ago
```

---

### `addMinutes(date, minutes)`

Adds minutes to a Date object.

**Type Signature:**

```typescript
function addMinutes(date: Date, minutes: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `minutes` - Number of minutes to add

**Returns:**

- New Date object with added minutes

**Examples:**

```typescript
import { addMinutes, now } from "@reasonabletech/utils";

const meetingEnd = addMinutes(meetingStart, 60);

// Session timeout
const sessionExpiry = addMinutes(now(), 30);
```

---

### `subtractMinutes(date, minutes)`

Subtracts minutes from a Date object.

**Type Signature:**

```typescript
function subtractMinutes(date: Date, minutes: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `minutes` - Number of minutes to subtract

**Returns:**

- New Date object with subtracted minutes

**Examples:**

```typescript
import { subtractMinutes, now } from "@reasonabletech/utils";

const gracePeriodStart = subtractMinutes(deadline, 15);
```

---

### `addHours(date, hours)`

Adds hours to a Date object.

**Type Signature:**

```typescript
function addHours(date: Date, hours: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `hours` - Number of hours to add

**Returns:**

- New Date object with added hours

**Examples:**

```typescript
import { addHours, now } from "@reasonabletech/utils";

const tokenExpiry = addHours(now(), 24);
// Token valid for 24 hours

const nextShift = addHours(shiftStart, 8);
```

---

### `subtractHours(date, hours)`

Subtracts hours from a Date object.

**Type Signature:**

```typescript
function subtractHours(date: Date, hours: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `hours` - Number of hours to subtract

**Returns:**

- New Date object with subtracted hours

**Examples:**

```typescript
import { subtractHours, now } from "@reasonabletech/utils";

const startTime = subtractHours(now(), 2);
// 2 hours ago
```

---

### `addDays(date, days)`

Adds days to a Date object.

**Type Signature:**

```typescript
function addDays(date: Date, days: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `days` - Number of days to add

**Returns:**

- New Date object with added days

**Examples:**

```typescript
import { addDays, now } from "@reasonabletech/utils";

const nextWeek = addDays(now(), 7);
const trialEnd = addDays(signupDate, 14);

// Calculate due date
const dueDate = addDays(invoiceDate, 30);
```

---

### `subtractDays(date, days)`

Subtracts days from a Date object.

**Type Signature:**

```typescript
function subtractDays(date: Date, days: number): Date;
```

**Parameters:**

- `date` - The base Date object
- `days` - Number of days to subtract

**Returns:**

- New Date object with subtracted days

**Examples:**

```typescript
import { subtractDays, now } from "@reasonabletech/utils";

const lastWeek = subtractDays(now(), 7);

// Get records from last 30 days
const startDate = subtractDays(now(), 30);
```

---

### `diffInSeconds(laterDate, earlierDate)`

Calculates the difference between two dates in seconds.

**Type Signature:**

```typescript
function diffInSeconds(laterDate: Date, earlierDate: Date): number;
```

**Parameters:**

- `laterDate` - The later date
- `earlierDate` - The earlier date

**Returns:**

- Difference in seconds (positive if laterDate is after earlierDate)

**Examples:**

```typescript
import { diffInSeconds, now, addMinutes } from "@reasonabletech/utils";

const start = now();
const end = addMinutes(start, 5);
diffInSeconds(end, start);  // 300

// Calculate elapsed time
const elapsedSeconds = diffInSeconds(now(), startTime);
```

---

### `diffInMinutes(laterDate, earlierDate)`

Calculates the difference between two dates in minutes.

**Type Signature:**

```typescript
function diffInMinutes(laterDate: Date, earlierDate: Date): number;
```

**Parameters:**

- `laterDate` - The later date
- `earlierDate` - The earlier date

**Returns:**

- Difference in minutes (positive if laterDate is after earlierDate)

**Examples:**

```typescript
import { diffInMinutes, now } from "@reasonabletech/utils";

const minutesElapsed = diffInMinutes(now(), sessionStart);
if (minutesElapsed > 30) {
  // Session timeout
}
```

---

### `diffInHours(laterDate, earlierDate)`

Calculates the difference between two dates in hours.

**Type Signature:**

```typescript
function diffInHours(laterDate: Date, earlierDate: Date): number;
```

**Parameters:**

- `laterDate` - The later date
- `earlierDate` - The earlier date

**Returns:**

- Difference in hours (positive if laterDate is after earlierDate)

**Examples:**

```typescript
import { diffInHours, now } from "@reasonabletech/utils";

const hoursAgo = diffInHours(now(), lastActivity);
if (hoursAgo > 24) {
  // More than a day since last activity
}
```

---

### `diffInDays(laterDate, earlierDate)`

Calculates the difference between two dates in days.

**Type Signature:**

```typescript
function diffInDays(laterDate: Date, earlierDate: Date): number;
```

**Parameters:**

- `laterDate` - The later date
- `earlierDate` - The earlier date

**Returns:**

- Difference in days (positive if laterDate is after earlierDate)

**Examples:**

```typescript
import { diffInDays, now } from "@reasonabletech/utils";

const daysRemaining = diffInDays(subscriptionEnd, now());
if (daysRemaining <= 7) {
  // Send renewal reminder
}

const accountAge = diffInDays(now(), user.createdAt);
```

---

### `isSameDay(date1, date2)`

Checks if two dates represent the same calendar day (in UTC).

**Type Signature:**

```typescript
function isSameDay(date1: Date, date2: Date): boolean;
```

**Parameters:**

- `date1` - First date
- `date2` - Second date

**Returns:**

- `true` if both dates represent the same calendar day in UTC

**Examples:**

```typescript
import { isSameDay, now, addHours } from "@reasonabletech/utils";

const morning = new Date("2023-11-13T08:00:00Z");
const evening = new Date("2023-11-13T20:00:00Z");
isSameDay(morning, evening);  // true

const today = now();
const tomorrow = addDays(today, 1);
isSameDay(today, tomorrow);   // false

// Group events by day
if (isSameDay(event.date, selectedDate)) {
  dayEvents.push(event);
}
```

---

### `formatDateISO(date)`

Formats a date as YYYY-MM-DD.

**Type Signature:**

```typescript
function formatDateISO(date: Date): string;
```

**Parameters:**

- `date` - The date to format

**Returns:**

- Date string in YYYY-MM-DD format

**Examples:**

```typescript
import { formatDateISO, now } from "@reasonabletech/utils";

formatDateISO(now());
// Result: "2023-11-13"

// For date inputs
const dateInput = formatDateISO(selectedDate);
// <input type="date" value={dateInput} />

// File naming
const filename = `report-${formatDateISO(now())}.csv`;
```

---

### `formatTimeISO(date)`

Formats a date as HH:MM:SS.

**Type Signature:**

```typescript
function formatTimeISO(date: Date): string;
```

**Parameters:**

- `date` - The date to format

**Returns:**

- Time string in HH:MM:SS format

**Examples:**

```typescript
import { formatTimeISO, now } from "@reasonabletech/utils";

formatTimeISO(now());
// Result: "14:30:45"

// Logging with timestamp
console.log(`[${formatTimeISO(now())}] Event occurred`);

// Display time only
const displayTime = formatTimeISO(appointment.scheduledAt);
```

---

## Result Type

A simplified Result type inspired by Rust's Result for consistent error handling.

### Types

```typescript
// Success variant
interface Success<T> {
  success: true;
  value: T;
  error?: undefined;
}

// Failure variant
interface Failure<E> {
  success: false;
  error: E;
  value?: undefined;
}

// Union type
type Result<T, E = Error> = Success<T> | Failure<E>;
```

### `ok(value)`

Creates a successful Result.

**Type Signature:**

```typescript
function ok<T, E = Error>(value: T): Result<T, E>;
function ok<E = Error>(): Result<void, E>;
```

**Parameters:**

- `value` - Optional value to wrap in a successful Result

**Returns:**

- A successful Result containing the value

**Examples:**

```typescript
import { ok, Result } from "@reasonabletech/utils";

// With a value
const result: Result<number> = ok(42);
// { success: true, value: 42 }

// Without a value (void)
const voidResult: Result<void> = ok();
// { success: true, value: undefined }

// In a function
function divide(a: number, b: number): Result<number> {
  if (b === 0) return err(new Error("Division by zero"));
  return ok(a / b);
}
```

---

### `err(error)`

Creates an error Result.

**Type Signature:**

```typescript
function err<T = never, E = Error>(error: E): Result<T, E>;
```

**Parameters:**

- `error` - The error to wrap in an error Result

**Returns:**

- An error Result containing the error

**Examples:**

```typescript
import { err, Result } from "@reasonabletech/utils";

const result: Result<string> = err(new Error("Something went wrong"));
// { success: false, error: Error("Something went wrong") }

// Custom error types
type ValidationError = { field: string; message: string };
const validationResult: Result<User, ValidationError> = err({
  field: "email",
  message: "Invalid email format",
});
```

---

### `isSuccess(result)`

Type guard to check if a Result is successful.

**Type Signature:**

```typescript
function isSuccess<T, E = Error>(result: Result<T, E>): result is Success<T>;
```

**Parameters:**

- `result` - The Result to check

**Returns:**

- `true` if the Result is successful

**Examples:**

```typescript
import { isSuccess, ok, err } from "@reasonabletech/utils";

const success = ok(42);
const failure = err(new Error("failed"));

isSuccess(success);  // true
isSuccess(failure);  // false

// Type narrowing
if (isSuccess(result)) {
  console.log(result.value); // TypeScript knows value exists
}
```

---

### `isFailure(result)`

Type guard to check if a Result is an error.

**Type Signature:**

```typescript
function isFailure<T, E = Error>(result: Result<T, E>): result is Failure<E>;
```

**Parameters:**

- `result` - The Result to check

**Returns:**

- `true` if the Result is an error

**Examples:**

```typescript
import { isFailure, ok, err } from "@reasonabletech/utils";

if (isFailure(result)) {
  logger.error("Operation failed", result.error);
  return;
}
// TypeScript knows result is Success here
```

---

### `fromPromise(promise)`

Wraps a Promise to return a Result.

**Type Signature:**

```typescript
function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>>;
```

**Parameters:**

- `promise` - The Promise to wrap

**Returns:**

- A Promise that resolves to a Result

**Examples:**

```typescript
import { fromPromise, isSuccess } from "@reasonabletech/utils";

// Convert throwing async function to Result
const result = await fromPromise(fetchUser(id));
if (isSuccess(result)) {
  return result.value;
} else {
  logger.error("Failed to fetch user", result.error);
  return null;
}

// Chain multiple operations
const userResult = await fromPromise(fetchUser(id));
if (!isSuccess(userResult)) return userResult;

const ordersResult = await fromPromise(fetchOrders(userResult.value.id));
```

---

### `map(result, fn)`

Maps a successful Result to a new Result with a transformed value.

**Type Signature:**

```typescript
function map<T, U, E = Error>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E>;
```

**Parameters:**

- `result` - The Result to map
- `fn` - The function to apply to the value

**Returns:**

- A new Result with the transformed value or the original error

**Examples:**

```typescript
import { map, ok, err } from "@reasonabletech/utils";

const result = ok(5);
const doubled = map(result, (x) => x * 2);
// { success: true, value: 10 }

const failed = err<number>(new Error("failed"));
const stillFailed = map(failed, (x) => x * 2);
// { success: false, error: Error("failed") }

// Transform user data
const userResult = await fetchUser(id);
const nameResult = map(userResult, (user) => user.name);
```

---

### `mapErr(result, fn)`

Maps an error Result to a new Result with a transformed error.

**Type Signature:**

```typescript
function mapErr<T, E = Error, F = Error>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F>;
```

**Parameters:**

- `result` - The Result to map
- `fn` - The function to apply to the error

**Returns:**

- A new Result with the transformed error or the original value

**Examples:**

```typescript
import { mapErr, err, ok } from "@reasonabletech/utils";

// Transform error type
const result = err(new Error("DB error"));
const apiError = mapErr(result, (e) => ({
  code: "DATABASE_ERROR",
  message: e.message,
}));

// Add context to errors
const enrichedError = mapErr(result, (e) => 
  new Error(`User fetch failed: ${e.message}`)
);
```

---

### `andThen(result, fn)`

Chains a function that returns a Result after a successful Result.

**Type Signature:**

```typescript
function andThen<T, U, E = Error>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E>;
```

**Parameters:**

- `result` - The Result to chain
- `fn` - The function to apply to the value that returns a Result

**Returns:**

- The Result returned by the function or the original error

**Examples:**

```typescript
import { andThen, ok, err } from "@reasonabletech/utils";

function parseNumber(s: string): Result<number> {
  const n = parseInt(s, 10);
  return isNaN(n) ? err(new Error("Invalid number")) : ok(n);
}

function validatePositive(n: number): Result<number> {
  return n > 0 ? ok(n) : err(new Error("Must be positive"));
}

// Chain validations
const result = andThen(parseNumber("42"), validatePositive);
// { success: true, value: 42 }

const failed = andThen(parseNumber("-5"), validatePositive);
// { success: false, error: Error("Must be positive") }
```

---

### `orElse(result, fn)`

Applies a fallback function to an error Result.

**Type Signature:**

```typescript
function orElse<T, E = Error, F = Error>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>,
): Result<T, F>;
```

**Parameters:**

- `result` - The Result to check
- `fn` - The function to apply to the error that returns a Result

**Returns:**

- The original Result if successful, or the Result returned by the function

**Examples:**

```typescript
import { orElse, ok, err } from "@reasonabletech/utils";

// Provide fallback value
const result = err<number>(new Error("failed"));
const recovered = orElse(result, () => ok(0));
// { success: true, value: 0 }

// Try alternative source
const fromCache = orElse(fetchFromPrimary(), () => fetchFromCache());
```

---

### `unwrap(result)`

Unwraps a Result, returning the value or throwing the error.

**Type Signature:**

```typescript
function unwrap<T, E = Error>(result: Result<T, E>): T;
```

**Parameters:**

- `result` - The Result to unwrap

**Returns:**

- The value if the Result is successful

**Throws:**

- The error if the Result is an error

**Examples:**

```typescript
import { unwrap, ok, err } from "@reasonabletech/utils";

const value = unwrap(ok(42));  // 42
unwrap(err(new Error("failed")));  // throws Error("failed")

// Use when you know it's safe
const config = unwrap(loadConfig()); // throws if config fails to load
```

---

### `unwrapOr(result, defaultValue)`

Unwraps a Result, returning the value or a default value.

**Type Signature:**

```typescript
function unwrapOr<T, E = Error>(result: Result<T, E>, defaultValue: T): T;
```

**Parameters:**

- `result` - The Result to unwrap
- `defaultValue` - The default value to return if the Result is an error

**Returns:**

- The value if the Result is successful, or the default value

**Examples:**

```typescript
import { unwrapOr, ok, err } from "@reasonabletech/utils";

unwrapOr(ok(42), 0);           // 42
unwrapOr(err(new Error()), 0); // 0

// Provide defaults
const port = unwrapOr(parsePort(envVar), 3000);
const timeout = unwrapOr(getConfigValue("timeout"), 5000);
```

---

### `unwrapOrElse(result, fn)`

Unwraps a Result, returning the value or computing a default from the error.

**Type Signature:**

```typescript
function unwrapOrElse<T, E = Error>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T;
```

**Parameters:**

- `result` - The Result to unwrap
- `fn` - The function to compute the default value from the error

**Returns:**

- The value if the Result is successful, or the computed default value

**Examples:**

```typescript
import { unwrapOrElse, err } from "@reasonabletech/utils";

const result = err<number>(new Error("missing"));
const value = unwrapOrElse(result, (e) => {
  logger.warn("Using fallback", e);
  return 0;
});

// Error-based fallback logic
const data = unwrapOrElse(fetchResult, (error) => {
  if (error.code === "NOT_FOUND") return defaultData;
  throw error; // Re-throw unexpected errors
});
```

---

### `combine(results)`

Combines an array of Results into a single Result containing an array of values.

**Type Signature:**

```typescript
function combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E>;
```

**Parameters:**

- `results` - Array of Results to combine

**Returns:**

- A Result containing an array of values or the first error

**Examples:**

```typescript
import { combine, ok, err, isSuccess } from "@reasonabletech/utils";

// All successful
const results = [ok(1), ok(2), ok(3)];
const combined = combine(results);
// { success: true, value: [1, 2, 3] }

// One failure (returns first error)
const mixed = [ok(1), err(new Error("failed")), ok(3)];
const combinedMixed = combine(mixed);
// { success: false, error: Error("failed") }

// Validate multiple fields
const validations = [
  validateEmail(email),
  validatePassword(password),
  validateUsername(username),
];
const allValid = combine(validations);
if (!isSuccess(allValid)) {
  return { error: allValid.error };
}
```

---

## Retry Functions

Utilities for retrying async operations with exponential backoff and jitter.

### Configuration Types

```typescript
interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor 0-1 (default: 0.1) */
  jitterFactor?: number;
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback when an attempt fails */
  onError?: (error: unknown, attempt: number) => void | Promise<void>;
  /** Custom delay calculator */
  getDelay?: (attempt: number, error: unknown) => number;
}

interface RetryResult<T> {
  success: boolean;
  value?: T;
  error?: unknown;
  attempts: number;
}
```

### `retry(operation, options)`

Retry an async operation with exponential backoff and jitter.

**Type Signature:**

```typescript
function retry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions,
): Promise<RetryResult<T>>;
```

**Parameters:**

- `operation` - The async operation to retry
- `options` - Retry configuration options

**Returns:**

- Promise resolving to retry result with success status, value/error, and attempt count

**Examples:**

```typescript
import { retry } from "@reasonabletech/utils";

// Basic retry with defaults (3 attempts, 1s initial delay)
const result = await retry(() => fetchData());
if (result.success) {
  console.log(result.value);
} else {
  console.error(`Failed after ${result.attempts} attempts`, result.error);
}

// Custom configuration with error callback
const result = await retry(() => apiClient.post("/users", userData), {
  maxAttempts: 5,
  initialDelay: 500,
  onError: (error, attempt) => {
    logger.warn("API", `Attempt ${attempt} failed`, { error });
  },
});

// Use server-provided Retry-After hint
const result = await retry(() => rateLimitedApi.call(), {
  getDelay: (attempt, error) => {
    if (error instanceof ApiError && error.retryAfter) {
      return error.retryAfter; // Use server-provided delay
    }
    return 1000 * Math.pow(2, attempt - 1); // Fallback
  },
});

// Only retry specific errors
const result = await retry(() => dbOperation(), {
  shouldRetry: (error) => {
    return error instanceof TransientError;
  },
});
```

---

### `retryWithBackoff(operation, maxRetries, baseDelay)`

Simplified retry with exponential backoff that throws on failure.

**Type Signature:**

```typescript
function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number,
): Promise<T>;
```

**Parameters:**

- `operation` - The async operation to retry
- `maxRetries` - Maximum number of retries after first attempt (default: 3)
- `baseDelay` - Base delay in milliseconds (default: 1000)

**Returns:**

- Promise resolving to the operation's result

**Throws:**

- The last error if all attempts fail

**Examples:**

```typescript
import { retryWithBackoff } from "@reasonabletech/utils";

// Retry up to 3 times with exponential backoff
const result = await retryWithBackoff(() => fetchData(), 3, 500);

// Use default retries (3) and delay (1000ms)
try {
  const user = await retryWithBackoff(() => createUser(userData));
} catch (error) {
  // All retries exhausted
  logger.error("Failed to create user", error);
}
```

---

### `retryWithPolling(operation, maxAttempts, interval, shouldRetry)`

Retry an operation with fixed interval polling (no exponential backoff).

**Type Signature:**

```typescript
function retryWithPolling<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  interval: number,
  shouldRetry?: (error: unknown, attempt: number) => boolean,
): Promise<RetryResult<T>>;
```

**Parameters:**

- `operation` - The async operation to retry
- `maxAttempts` - Maximum number of attempts
- `interval` - Fixed interval between attempts in milliseconds
- `shouldRetry` - Optional function to determine if retry should continue

**Returns:**

- Promise resolving to retry result

**Examples:**

```typescript
import { retryWithPolling } from "@reasonabletech/utils";

// Poll for job completion every 2 seconds, up to 30 times
const result = await retryWithPolling(
  () => checkJobStatus(jobId),
  30,
  2000,
  (error) => error instanceof JobPendingError,
);

// Wait for resource to become available
const resource = await retryWithPolling(
  () => fetchResource(resourceId),
  10,
  1000,
);
```

---

### `sleep(ms)`

Sleep for the specified number of milliseconds.

**Type Signature:**

```typescript
function sleep(ms: number): Promise<void>;
```

**Parameters:**

- `ms` - Milliseconds to sleep

**Returns:**

- Promise that resolves after the delay

**Examples:**

```typescript
import { sleep } from "@reasonabletech/utils";

// Wait 1 second
await sleep(1000);

// Rate limiting
for (const item of items) {
  await processItem(item);
  await sleep(100); // 100ms between items
}
```
