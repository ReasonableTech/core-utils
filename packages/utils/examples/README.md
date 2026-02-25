# @reasonabletech/utils Examples

This directory contains practical examples demonstrating how to use the utilities provided by `@reasonabletech/utils`.

## Running the Examples

Each example is a self-contained TypeScript file that can be run using `tsx`:

```bash
# From the packages/utils directory
npx tsx examples/result-handling.ts
npx tsx examples/retry-patterns.ts
npx tsx examples/object-construction.ts
npx tsx examples/datetime-utilities.ts
npx tsx examples/async-pipelines.ts
```

Or install tsx globally:

```bash
npm install -g tsx
tsx examples/result-handling.ts
```

## Examples Overview

### 1. `result-handling.ts` - Result Type Patterns

Demonstrates the `Result<T, E>` type for type-safe error handling without exceptions:

- Creating successful results with `ok()`
- Creating error results with `err()`
- Chaining operations with `andThen()`
- Transforming errors with `mapErr()`
- Combining multiple results with `combine()`
- Wrapping promises with `fromPromise()`

**Use cases:** API responses, validation, database operations, any function that can fail.

### 2. `retry-patterns.ts` - Retry with Exponential Backoff

Shows how to handle transient failures with automatic retries:

- Basic retry with `retryWithBackoff()`
- Custom retry configuration with `retry()`
- Conditional retries based on error type
- Custom delay calculations (e.g., respecting Retry-After headers)
- Fixed-interval polling with `retryWithPolling()`

**Use cases:** API calls, network requests, file operations, external service integrations.

### 3. `object-construction.ts` - Conditional Object Building

Demonstrates clean object construction patterns for TypeScript's `exactOptionalPropertyTypes`:

- Single conditional properties with `includeIf()`
- Multiple conditional properties with `includeIfDefined()`
- Picking/omitting properties with `pick()` and `omit()`
- Cleaning objects with `omitUndefined()`

**Use cases:** API response building, configuration objects, form data processing.

### 4. `datetime-utilities.ts` - Date/Time Helpers

Shows standardized date/time handling:

- Getting current time with `now()`
- Date arithmetic with `addDays()`, `addHours()`, etc.
- Formatting dates with `formatDateISO()`, `dateToISOString()`
- Comparing dates with `isSameDay()`, `isDateInPast()`
- Converting between formats (Unix timestamps, ISO strings)

**Use cases:** Token expiration, scheduling, date comparisons, API timestamp handling.

### 5. `async-pipelines.ts` - Async Function Composition

Demonstrates sequential async transformations:

- Piping data through transforms with `pipeAsync()`
- Sequential execution with `runSequentially()`
- Request/response interceptor patterns
- Data processing pipelines

**Use cases:** HTTP interceptors, middleware chains, ETL pipelines, data transformations.

## Package Imports

Examples demonstrate both import styles:

```typescript
// Import from main package (tree-shakeable)
import { ok, err, Result } from "@reasonabletech/utils";

// Import from specific subpath
import { ok, err, Result } from "@reasonabletech/utils/result";
import { now, addDays } from "@reasonabletech/utils/datetime";
import { includeIf } from "@reasonabletech/utils/object";
import { retryWithBackoff } from "@reasonabletech/utils/retry";
```

## Further Reading

- [Package README](../README.md) - Full API documentation
- [API Docs](../docs/) - Generated API reference
