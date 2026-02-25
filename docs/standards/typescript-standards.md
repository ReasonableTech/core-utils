# TypeScript Standards

> 📖 **For comprehensive TypeScript patterns and utility types, see:** [TypeScript Design Patterns](./typescript-design-patterns.md)

## CRITICAL: Type Safety Requirements

**ABSOLUTELY MANDATORY: Type checking must be performed after every single code change.** This is non-negotiable and supersedes all other considerations.

### Build vs Typecheck Rules

- Build scripts MUST NOT run `tsc --build` unless project references are enabled in that package.
- Build scripts MUST run `tsup` before `tsc --emitDeclarationOnly`.
- Build tsconfig MUST NOT include tests, stories, or tool config files.
- Typecheck MUST NOT rely on `dist` output; source paths must resolve to `src`.

### Non-Negotiable Requirements

❌ **NEVER** disable TypeScript type checking, set `dts: false`, use `@ts-ignore`/`@ts-nocheck`, or use `any` types without explicit approval
❌ **NEVER** use dynamic imports except for production code splitting with architectural approval
❌ **NEVER** proceed without running type checking commands
❌ **NEVER** consider work "complete" until all type errors are resolved
❌ **NEVER** parse error messages to determine error types - use error codes, status, instanceof, or typed properties only
❌ **NEVER** skip, ignore, or suppress ESLint errors - ALL linting issues must be resolved before proceeding
❌ **NEVER** use eslint-disable comments without explicit architectural approval

**See [ESLint Rule Antipatterns](./eslint-rule-antipatterns.md) for type safety antipatterns enforced by custom ESLint rules.**

### Mandatory Workflow

**After every edit, immediately run:**

```bash
pnpm typecheck  # REQUIRED - must pass with zero errors
pnpm lint       # REQUIRED - must pass with zero errors (warnings treated as errors)
```

**Before task completion:**

```bash
pnpm typecheck
pnpm lint
```

### Essential Type Patterns

**1. Branded Types for Domain Safety:**

```typescript
export declare const UserIdBrand: unique symbol;
export type UserId = string & { readonly [UserIdBrand]: never };

export declare const SessionIdBrand: unique symbol;
export type SessionId = string & { readonly [SessionIdBrand]: never };

const createUserId = (id: string): UserId => id as UserId;
```

**2. Exhaustive Union Checking:**

```typescript
function handleRole(role: "admin" | "user" | "moderator"): string[] {
  switch (role) {
    case "admin":
      return ["read", "write", "delete"];
    case "user":
      return ["read"];
    case "moderator":
      return ["read", "write"];
    default:
      const exhaustiveCheck: never = role; // Catches missing cases
      throw new Error(`Unhandled role: ${exhaustiveCheck}`);
  }
}
```

**3. Result Types Instead of Throwing:**

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

/**
 * Error type for user fetch operations
 *
 * - `not_found`: User with specified ID does not exist
 * - `network_error`: Network request failed
 */
export type FetchUserError = "not_found" | "network_error";

async function fetchUser(id: UserId): Promise<Result<User, FetchUserError>> {
  try {
    const user = await api.getUser(id);
    return { success: true, value: user };
  } catch (error) {
    return {
      success: false,
      error: error.status === 404 ? "not_found" : "network_error",
    };
  }
}
```

### Verification Checklist

Before completing ANY code change, verify:

- [ ] `pnpm typecheck` and `pnpm lint` pass with zero errors (ESLint warnings are treated as errors)
- [ ] No `any` types, `@ts-ignore`, or `as any` used
- [ ] All function parameters and return types explicitly declared
- [ ] Union types use exhaustive checking with `never`
- [ ] Domain types use branded types, not plain strings/numbers
- [ ] Error handling uses Result types, not throwing exceptions
- [ ] Interfaces designed for extension with `readonly` properties
- [ ] ALL ESLint errors resolved - no exceptions, workarounds, or disable comments

### Red Flags - Fix Immediately

- Unconstrained generics `<T>` instead of `<T extends SomeType>`
- String literals without union types: `status: string` vs `status: 'pending' | 'complete'`
- Functions with >5 parameters (use object parameter)
- Non-exhaustive switch statements on union types
- Mutable state in shared interfaces
- ESLint errors being ignored or suppressed instead of resolved

### ESLint Error Resolution Strategy

**If you encounter persistent ESLint errors that seem difficult to resolve:**

1. **First Priority**: Fix the actual code issues causing the violations
2. **If multiple similar errors persist**: This may indicate architectural problems
3. **Consider Rearchitecture**: Frequent linting violations often signal:
   - Poor separation of concerns
   - Overly complex functions or modules
   - Missing abstractions
   - Inappropriate coupling between components
4. **Never Suppress**: Resist the temptation to disable rules - instead, redesign the problematic code

**Remember**: ESLint errors are architectural feedback. Persistent issues suggest the code structure needs improvement, not rule suppression.

### MANDATORY: Type-First Design Principles

**ALWAYS design types before writing implementation code.** This prevents refactoring and ensures maintainable architecture:

1. **Define domain types first:** Use branded types, readonly properties, and proper constraints
2. **Design service interfaces with Result types:** All service methods return `Result<T, E>` for explicit error handling
3. **Use dependency injection:** Inject each dependency separately, never bundle into objects

```typescript
// ✅ Type-first approach
export declare const UserIdBrand: unique symbol;
export type UserId = string & { readonly [UserIdBrand]: never };

/**
 * Error type for user fetch operations
 *
 * - `not_found`: User with specified ID does not exist
 * - `network_error`: Network request failed
 */
export type GetUserError = "not_found" | "network_error";

/**
 * Error type for user creation operations
 *
 * - `email_exists`: Account with email already exists
 * - `validation_error`: User data failed validation
 */
export type CreateUserError = "email_exists" | "validation_error";

interface UserService {
  getUser(id: UserId): Promise<Result<User, GetUserError>>;
  createUser(data: CreateUserRequest): Promise<Result<User, CreateUserError>>;
}

class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}
}
```

**Do not use singletons under any circumstances.** Even long-lived services must be explicitly instantiated by the application on start.
