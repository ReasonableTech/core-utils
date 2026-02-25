# ESLint Rule Antipatterns

> Authoritative reference for code antipatterns enforced by `@reasonabletech/config-eslint`

This document catalogs all prohibited code patterns detected by custom ESLint rules. It serves as the definitive reference for understanding why certain patterns are forbidden and how to write correct alternatives.

## Table of Contents

### Error Handling Antipatterns

1. [Error Message Parsing](#antipattern-1-error-message-parsing) - Parsing error.message for type detection
2. [Inline Error Union Types](#antipattern-2-inline-error-union-types) - Undocumented error unions in Result types
3. [Undocumented Error Types](#antipattern-3-undocumented-error-types) - Missing JSDoc on error type definitions
4. [Incorrect Error Type Naming](#antipattern-4-incorrect-error-type-naming) - Non-standard error type naming conventions

### Type Safety Antipatterns

5. [Checking Both null and undefined](#antipattern-5-checking-both-null-and-undefined) - Type mismatch in null checks
6. [Using `as any` Casts](#antipattern-6-using-as-any-casts) - Bypassing the type system with any

### Architecture Antipatterns

7. [Dependency Bundling (God Objects)](#antipattern-7-dependency-bundling-god-objects) - Bundling dependencies into god objects
8. [Required Dependencies Being Optional](#antipattern-8-required-dependencies-being-optional) - Making required dependencies optional
9. [Singleton Pattern and Self-Created Dependencies](#antipattern-9-singleton-pattern-and-self-created-dependencies) - Services creating their own dependencies

### Code Quality Antipatterns

10. [Disabling Linter Rules Without Justification](#antipattern-10-disabling-linter-rules-without-justification) - Suppressing errors instead of fixing them
11. [Barrel Exports (`export *`)](#antipattern-11-barrel-exports) - Re-exporting everything from index files
12. [Mixed Async Patterns](#antipattern-12-mixed-async-patterns) - Mixing `.then()` with async/await

### Platform Convention Antipatterns

13. [Manual Result Construction](#antipattern-13-manual-result-construction) - Building Result objects by hand instead of using helpers
14. [UI Barrel Imports](#antipattern-14-ui-barrel-imports) - Importing from a UI component library barrel export

## Quick Reference Table

| #   | Antipattern                | Severity | Rule Source              | Auto-Fix | Migration Effort |
| --- | -------------------------- | -------- | ------------------------ | -------- | ---------------- |
| 1   | Error Message Parsing      | High     | error-handling.ts        | No       | Low              |
| 2   | Inline Error Unions        | High     | error-handling.ts        | No       | Medium           |
| 3   | Undocumented Error Types   | Medium   | error-handling.ts        | No       | Low              |
| 4   | Incorrect Error Naming     | Medium   | error-handling.ts        | No       | Low              |
| 5   | null + undefined Checks    | High     | null-undefined-checks.ts | No       | Low              |
| 6   | `as any` Casts             | High     | type-safety.ts           | No       | Medium           |
| 7   | Dependency Bundling        | High     | architecture-patterns.ts | No       | High             |
| 8   | Optional Required Deps     | High     | architecture-patterns.ts | No       | Medium           |
| 9   | Singletons / Self-DI       | High     | architecture-patterns.ts | No       | Medium           |
| 10  | Linter Rule Disabling      | High     | code-quality.ts          | No       | Medium           |
| 11  | Barrel Exports             | Medium   | code-quality.ts          | No       | Low              |
| 12  | Mixed Async Patterns       | Medium   | code-quality.ts          | No       | Low              |
| 13  | Manual Result Construction | High     | platform-conventions.ts  | No       | Low              |
| 14  | UI Barrel Imports          | High     | platform-conventions.ts  | No       | Low              |

---

## Error Handling Antipatterns

### Antipattern 1: Error Message Parsing

**Rule:** `error-message-parsing-prevention`

**Why This is Problematic:**

Error messages are unreliable indicators of error types because they can change between:

- Different versions of the same library
- Different locale settings
- Different runtime environments
- Different build configurations

Parsing error messages creates brittle code that breaks when dependencies update or when running in different environments.

**Forbidden Patterns:**

```typescript
// Message includes checking
if (error.message.includes("ECONNREFUSED")) {
  // Unreliable - message format can change
}

if (error.message.includes("401")) {
  // Unreliable - status might not appear in message
}

// String equality
if (error.message === "Network Error") {
  // Unreliable - exact wording can change
}

// Regex matching
if (error.message.match(/timeout/i)) {
  // Unreliable - message structure can change
}
```

**Required Patterns:**

```typescript
// Use error.code property
if (error.code === "ECONNREFUSED") {
  // Reliable - error codes are part of the API contract
}

// Use error.status property
if (error.status === 401) {
  // Reliable - HTTP status codes are standardized
}

// Use instanceof checks
if (error instanceof NetworkError) {
  // Reliable - type-based detection
}

// Use error.name property
if (error.name === "ValidationError") {
  // Reliable - error names are part of the interface
}

// Use custom typed properties
if (networkError.type === "authentication_failed") {
  // Reliable - explicitly defined error types
}
```

**Migration Guide:**

1. Identify all error.message checks in catch blocks
2. Determine the error source (which library or framework throws it)
3. Consult library documentation for error.code, error.status, or error type properties
4. Replace message string checks with property checks
5. Test with multiple error scenarios to verify correct behavior

**Referenced By:**

- [Error Handling Standards](./error-handling.md#error-detection-rules)
- [TypeScript Standards](./typescript-standards.md)

---

### Antipattern 2: Inline Error Union Types

**Rule:** `inline-error-union-detection`

**Why This is Problematic:**

Inline error union types in Result signatures are problematic because:

- Each error code lacks documentation explaining when it occurs
- Error types cannot be reused across functions
- Calling code cannot reference the error type for type narrowing
- No central location documents all possible error cases

**Forbidden Patterns:**

```typescript
// Inline union types - no documentation
async function createUser(
  userData: UserData,
): Promise<
  Result<User, "validation_error" | "email_exists" | "database_error">
> {
  // Error meanings are unclear
}

// Undocumented error union type
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";
```

**Required Patterns:**

```typescript
/**
 * Error type for user creation operations
 *
 * - `validation_error`: User data failed validation checks (invalid email, weak password, etc.)
 * - `email_exists`: An account with this email address already exists
 * - `database_error`: Database operation failed due to connection or constraint issues
 */
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";

// Use documented error types in Result signatures
async function createUser(
  userData: UserData,
): Promise<Result<User, UserCreateError>> {
  // Error type is documented and reusable
}
```

**Migration Guide:**

1. Extract the inline union type to a named, documented type
2. Add comprehensive JSDoc explaining each error code
3. Update the function signature to use the named type
4. Export from package index for external consumption
5. Update all calling code to import and use the named type

**Referenced By:**

- [Error Handling Standards](./error-handling.md#error-type-organization--documentation)
- [TypeScript Standards](./typescript-standards.md)

---

### Antipattern 3: Undocumented Error Types

**Rule:** `error-type-documentation`

**Why This is Problematic:**

Undocumented error types leave developers guessing about:

- When each error code occurs
- What conditions trigger each error
- How to handle each error appropriately
- Whether retry logic makes sense for a particular error

**Forbidden Patterns:**

```typescript
// No documentation
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";
```

**Required Patterns:**

```typescript
/**
 * Error type for user creation operations
 *
 * - `validation_error`: User data failed validation checks (invalid email format, password too weak)
 * - `email_exists`: An account with this email address already exists in the system
 * - `database_error`: Database operation failed (connection lost, constraint violation)
 */
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";
```

**Migration Guide:**

1. Locate all exported error type definitions
2. Add JSDoc comment above each type
3. Document each error code with brief description and specific conditions
4. Verify documentation matches actual usage

**Referenced By:**

- [Error Handling Standards](./error-handling.md#error-type-organization--documentation)

---

### Antipattern 4: Incorrect Error Type Naming

**Rule:** `error-type-naming`

**Why This is Problematic:**

Inconsistent error type naming makes it difficult to identify error types at a glance and follow established naming conventions.

**Forbidden Patterns:**

```typescript
// Wrong casing
export type userCreateError = "validation_error" | "email_exists";

// Wrong suffix
export type UserCreateErrors = "validation_error" | "email_exists";
export type CreateUserErr = "validation_error" | "email_exists";
```

**Required Patterns:**

```typescript
// PascalCase with "Error" suffix
export type UserCreateError = "validation_error" | "email_exists";
export type WorkspaceUpdateError = "not_found" | "validation_error";

// Error codes in lowercase_with_underscores
type NetworkError = "connection_timeout" | "dns_resolution_failed";
```

**Referenced By:**

- [Error Handling Standards](./error-handling.md#error-type-organization--documentation)
- [TypeScript Standards](./typescript-standards.md)

---

## Type Safety Antipatterns

### Antipattern 5: Checking Both null and undefined

**Rule:** `no-null-undefined-checks`

**Why This is Problematic:**

Checking for both `null` and `undefined` when the type only includes one indicates a type mismatch between the declared type and runtime check.

**Forbidden Patterns:**

```typescript
// Type says `| undefined` but checking for both
function process(value: string | undefined) {
  if (value === null || value === undefined) {
    // ERROR: null is NOT part of the union
    return;
  }
}
```

**Required Patterns:**

```typescript
// Type says `| undefined`, check only for undefined
function process(value: string | undefined) {
  if (value === undefined) {
    return;
  }
}

// Type says `| null`, check only for null
function handle(data: User | null) {
  if (data === null) {
    return;
  }
}

// Type says `| null | undefined`, both checks are fine
function transform(input: Data | null | undefined) {
  if (input === null || input === undefined) {
    return;
  }
}
```

**Referenced By:**

- [TypeScript Design Patterns](./typescript-design-patterns.md#null-vs-undefined-critical-distinction)
- [TypeScript Standards](./typescript-standards.md)

---

### Antipattern 6: Using `as any` Casts

**Rule:** `no-as-any-cast` (via `no-restricted-syntax` + `@typescript-eslint/no-explicit-any`)

**Why This is Problematic:**

`as any` casts completely bypass TypeScript's type system, creating invisible type safety holes that cause runtime errors. Double casts through `any` (e.g., `value as any as TargetType`) are even worse because they make any value satisfy any type, defeating the entire purpose of TypeScript.

**Forbidden Patterns:**

```typescript
// Direct as any cast
const data = response as any;

// Double cast through any to force a type
const user = (response as any) as User;

// any type annotation
function process(data: any) { ... }

// Array<any>
const items: Array<any> = [];
```

**Required Patterns:**

```typescript
// Use proper type assertions when you know the type
const data = response as ApiResponse;

// Use unknown with type guards for truly unknown data
function process(data: unknown) {
  if (isUser(data)) {
    // data is User here
  }
}

// Use generics for flexible but type-safe code
function parse<T>(raw: string): T {
  return JSON.parse(raw) as T;
}
```

**Migration Guide:**

1. Find all `as any` casts with `rg "as any" --type ts`
2. For each cast, determine the actual expected type
3. Replace with a proper type assertion (`as SpecificType`), type guard, or generic
4. If the type is truly unknown, use `unknown` and narrow with runtime checks

**Referenced By:**

- [TypeScript Standards](./typescript-standards.md)

---

## Architecture Antipatterns

### Antipattern 7: Dependency Bundling (God Objects)

**Rule:** `no-dependency-bundling`

**Why This is Problematic:**

Bundling dependencies into "god objects" (interfaces ending with `*Dependencies` or `*Deps`) creates tight coupling, makes testing harder, and hides actual dependency requirements.

**Forbidden Patterns:**

```typescript
interface ServiceDependencies {
  logger: Logger;
  database: Database;
  cache: CacheService;
}

class UserService {
  constructor(private deps: ServiceDependencies) {}

  async createUser(data: UserData) {
    this.deps.logger.info("Creating user");
    await this.deps.database.save(data);
  }
}
```

**Required Patterns:**

```typescript
class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly cache: CacheService,
  ) {}

  async createUser(data: UserData) {
    this.logger.info("Creating user");
    await this.database.save(data);
  }
}
```

**Migration Guide:**

1. Identify all `*Dependencies` / `*Deps` interfaces
2. Extract properties to individual constructor parameters
3. Update all instantiation sites to pass dependencies individually
4. Update tests to mock only the dependencies each test needs
5. Remove the container interface

**Referenced By:**

- [Architecture Principles](./architecture-principles.md#service-architecture)

---

### Antipattern 8: Required Dependencies Being Optional

**Rule:** `require-individual-dependencies`

**Why This is Problematic:**

Making required dependencies optional (`?` or `| undefined`) misrepresents the dependency contract, requiring unnecessary runtime checks and creating confusion about what's truly optional.

**Forbidden Patterns:**

```typescript
class UserService {
  constructor(
    private readonly database?: DatabaseClient, // Database is required!
    private readonly logger?: Logger, // Logger is required!
  ) {}
}
```

**Required Patterns:**

```typescript
class UserService {
  constructor(
    private readonly database: DatabaseClient, // Required
    private readonly logger: Logger, // Required
    private readonly config: UserServiceConfig = DEFAULT_CONFIG, // Optional with default
  ) {}
}
```

**Referenced By:**

- [Architecture Principles](./architecture-principles.md#service-architecture)

---

### Antipattern 9: Singleton Pattern and Self-Created Dependencies

**Rule:** `no-singleton-pattern` / `no-constructor-new-expression`

**Why This is Problematic:**

Services that create their own dependencies or use singleton patterns are untestable, tightly coupled, and hide their actual dependency graph. Dependency injection makes dependencies explicit and replaceable.

**Forbidden Patterns:**

```typescript
export class UserService {
  private db: Database;

  constructor(private config: Config) {
    this.db = new Database(config); // Creates own dependency
  }

  static getInstance() {
    // Singleton pattern
    if (!UserService.instance) {
      UserService.instance = new UserService(globalConfig);
    }
    return UserService.instance;
  }
}
```

**Required Patterns:**

```typescript
export class UserService {
  constructor(
    private readonly db: Database, // Injected
    private readonly config: Config,
  ) {}
}

// Instantiation happens at the composition root
const db = new Database(config);
const service = new UserService(db, config);
```

**Referenced By:**

- [Architecture Principles](./architecture-principles.md#service-architecture)

---

## Code Quality Antipatterns

### Antipattern 10: Disabling Linter Rules Without Justification

**Rule:** `no-linter-disabling` (custom ESLint rule)

**Why This is Problematic:**

Suppressing linter errors hides real problems. Every `eslint-disable`, `@ts-ignore`, or `@ts-nocheck` is a potential bug that the type system or linter would have caught. Disabling without justification accumulates technical debt silently.

**Forbidden Patterns:**

```typescript
/* eslint-disable */ // Blanket disabling
// @ts-ignore // TypeScript error suppression
// @ts-nocheck // File-level disabling
/* eslint-disable no-restricted-syntax */ // No explanation why
```

**Required Patterns:**

```typescript
// Reason: Testing error message parsing requires triggering the restricted pattern
/* eslint-disable no-restricted-syntax */
const hasMatch = items.some((x) => x.message?.includes("pattern"));
/* eslint-enable no-restricted-syntax */
```

In test files, linter disabling is permitted (the rule is relaxed for `*.test.ts` and `tests/` directories).

**Migration Guide:**

1. Find all `eslint-disable` / `@ts-ignore` / `@ts-nocheck` directives
2. For each one, fix the underlying issue instead of suppressing it
3. If suppression is genuinely necessary, add a `// Reason:` comment on the preceding line
4. Re-enable the rule as soon as the suppressed section ends

---

### Antipattern 11: Barrel Exports

**Rule:** `no-barrel-exports`

**Why This is Problematic:**

`export *` re-exports create bloated namespaces where consumers see hundreds of exports from a single import path. This makes autocomplete useless, increases bundle sizes, and obscures the actual API surface.

**Forbidden Patterns:**

```typescript
// index.ts
export * from "./user-service";
export * from "./workspace-service";
export * from "./billing-service";
// Consumer sees 100+ exports as one namespace
```

**Required Patterns:**

```typescript
// Explicit named exports
export { UserService, type UserCreateError } from "./user-service";
export { WorkspaceService } from "./workspace-service";

// Or import directly from implementation modules
import { UserService } from "@reasonabletech/platform/user-service";
```

---

### Antipattern 12: Mixed Async Patterns

**Rule:** `no-mixed-async-patterns`

**Why This is Problematic:**

Mixing `.then()` chains with `async/await` in the same function creates confusing control flow and makes error handling inconsistent.

**Forbidden Patterns:**

```typescript
async function fetchAndProcess() {
  const user = await getUser();
  return saveUser(user).then((result) => result); // Mixing patterns
}
```

**Required Patterns:**

```typescript
async function fetchAndProcess() {
  const user = await getUser();
  const result = await saveUser(user);
  return result;
}
```

---

## Platform Convention Antipatterns

### Antipattern 13: Manual Result Construction

**Rule:** `use-result-helpers` (via `no-restricted-syntax`)

**Why This is Problematic:**

Manually constructing `{ success: true, value: ... }` or `{ success: false, error: ... }` objects bypasses the `ok()` and `err()` helpers from `@reasonabletech/utils`. Manual construction is error-prone (typos like `{ sucess: true }`), inconsistent, and harder to refactor.

**Forbidden Patterns:**

```typescript
// Manual success result
return { success: true, value: user };

// Manual error result
return { success: false, error: "not_found" };
```

**Required Patterns:**

```typescript
import { ok, err } from "@reasonabletech/utils";

// Use ok() for success
return ok(user);

// Use err() for errors
return err("not_found");
```

**Migration Guide:**

1. Find manual Result construction with `rg "success: true, value:" --type ts`
2. Add `import { ok, err } from "@reasonabletech/utils"` to each file
3. Replace `{ success: true, value: value }` with `ok(value)`
4. Replace `{ success: false, error: code }` with `err(code)`

**Referenced By:**

- [Error Handling Standards](./error-handling.md)

---

### Antipattern 14: UI Barrel Imports

**Rule:** `no-ui-barrel-imports` (via `no-restricted-syntax`)

**Why This is Problematic:**

Importing named exports from a UI component library barrel can accidentally include client-only React components in server-side code, causing server/client boundary issues and bloating bundles. This applies when using any UI component library that organizes components under subpaths.

**Forbidden Patterns:**

```typescript
import { Button, Card, Input } from "your-ui-library"; // Barrel import
```

**Required Patterns:**

```typescript
// Import from specific subpaths
import Button from "your-ui-library/button";
import Card from "your-ui-library/card";
import Input from "your-ui-library/input";
```

**Migration Guide:**

1. Find barrel imports with `rg "from ['\"]your-ui-library['\"]" --type ts`
2. Replace each named import with a default import from the component's subpath
3. Verify server components don't accidentally import client-only components

---

## Implementation

### ESLint Rule Source Code

All custom rules live in `packages/config-eslint/src/custom-rules/`:

- [error-handling.ts](../../packages/config-eslint/src/custom-rules/error-handling.ts) - Antipatterns #1-4
- [null-undefined-checks.ts](../../packages/config-eslint/src/custom-rules/null-undefined-checks.ts) - Antipattern #5
- [type-safety.ts](../../packages/config-eslint/src/custom-rules/type-safety.ts) - Antipattern #6
- [architecture-patterns.ts](../../packages/config-eslint/src/custom-rules/architecture-patterns.ts) - Antipatterns #7-9
- [code-quality.ts](../../packages/config-eslint/src/custom-rules/code-quality.ts) - Antipatterns #10-12
- [platform-conventions.ts](../../packages/config-eslint/src/custom-rules/platform-conventions.ts) - Antipatterns #13-14

### Testing

- [Unit tests](../../packages/config-eslint/tests/unit/) - Rule configuration and options
- [Integration tests](../../packages/config-eslint/tests/integration/) - `Linter.verify()` against code samples
- [Test fixtures](../../packages/config-eslint/tests/fixtures/code-samples/) - Violation and correct code samples

### Referenced By

This authoritative reference is linked from:

- [Error Handling Standards](./error-handling.md) - References antipatterns #1-4
- [Architecture Principles](./architecture-principles.md) - References antipatterns #7-9
- [TypeScript Design Patterns](./typescript-design-patterns.md) - References antipattern #5
- [TypeScript Standards](./typescript-standards.md) - References all type-related antipatterns
- [Custom Rules README](../../packages/config-eslint/src/custom-rules/README.md) - Implementation guide
