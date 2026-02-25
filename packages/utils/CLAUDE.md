# @reasonabletech/utils

## ⚠️ CRITICAL: Follow Global Standards

**Before working on utils code, read these mandatory standards:**

- **[TypeScript Standards](../../docs/standards/typescript-standards.md)** - Type safety is non-negotiable
- **[Error Handling](../../docs/standards/error-handling.md)** - Never parse error messages
- **[Git Guidelines](../../docs/standards/git-guidelines.md)** - Safe commit practices
- **[Architecture Principles](../../docs/standards/architecture-principles.md)** - Service patterns

## Package Purpose

This is the **foundational utility package** for the platform. Every other package should import utilities from here rather than implementing their own.

**Before implementing any utility function, check if it already exists here.**

## Key Exports

### Result Types (Most Important)

The `Result<T, E>` type is the standard way to handle expected errors:

```typescript
import { ok, err, type Result } from "@reasonabletech/utils";

function divide(a: number, b: number): Result<number, "division_by_zero"> {
  if (b === 0) return err("division_by_zero");
  return ok(a / b);
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.value); // 5
} else {
  console.log(result.error); // "division_by_zero"
}
```

**Result utilities**: `ok`, `err`, `isSuccess`, `isFailure`, `unwrap`, `unwrapOr`, `unwrapOrElse`, `map`, `mapErr`, `andThen`, `orElse`, `combine`, `fromPromise`

### Datetime Helpers

Pure functions for date manipulation without external dependencies:

```typescript
import { now, addDays, formatDateISO, isDateInPast } from "@reasonabletech/utils";

const today = now();
const nextWeek = addDays(today, 7);
const formatted = formatDateISO(nextWeek); // "2024-01-15"
```

### Object Utilities

Type-safe object manipulation:

```typescript
import { pick, omit, omitUndefined, includeIfDefined } from "@reasonabletech/utils";

const user = { id: "1", name: "Alice", email: "a@example.com" };
const publicUser = pick(user, ["id", "name"]); // { id: "1", name: "Alice" }
const withoutEmail = omit(user, ["email"]); // { id: "1", name: "Alice" }
```

### Retry Utilities

Resilient async operations with configurable backoff:

```typescript
import { retry, retryWithBackoff } from "@reasonabletech/utils";

const result = await retryWithBackoff(() => fetchFromAPI(), {
  maxAttempts: 3,
  initialDelayMs: 100,
});
```

### String Utilities

Common string operations:

```typescript
import { capitalize, truncateString, isNonEmptyString } from "@reasonabletech/utils";

capitalize("hello");          // "Hello"
truncateString("long text", 5); // "long..."
isNonEmptyString("test");    // true
```

### Type Guards

Runtime type checking:

```typescript
import { isPresent } from "@reasonabletech/utils";

const items = [1, null, 2, undefined, 3].filter(isPresent); // [1, 2, 3]
```

## Development Guidelines

### Adding New Utilities

1. **Check existing utilities first** — Don't duplicate functionality
2. **Keep functions pure** — No side effects, no mutations
3. **Export from index.ts** — All utilities must be re-exported
4. **Add comprehensive tests** — Unit tests for all edge cases
5. **Document with JSDoc** — Every function needs documentation

### Testing Patterns

```typescript
import { describe, it, expect } from "vitest";
import { ok, err, isSuccess } from "../src/result";

describe("Result", () => {
  describe("ok", () => {
    it("should create a success result", () => {
      const result = ok(42);
      expect(isSuccess(result)).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe("err", () => {
    it("should create a failure result", () => {
      const result = err("not_found");
      expect(isSuccess(result)).toBe(false);
      expect(result.error).toBe("not_found");
    });
  });
});
```

### Commands

```bash
pnpm test       # Run all tests
pnpm typecheck  # Type check
pnpm build      # Build package
```

## Do Not Duplicate

If you find yourself writing utilities for:

- Date/time manipulation → Use datetime exports
- Object picking/omitting → Use object exports
- String formatting → Use string exports
- Retry logic → Use retry exports
- Error result handling → Use result exports

**Import from `@reasonabletech/utils` instead of creating local copies.**
