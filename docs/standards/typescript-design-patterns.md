# TypeScript Design Patterns

This guide documents recommended TypeScript patterns and utility types for maintaining clean, type-safe code across @reasonabletech/core-utils.

## Table of Contents

- [Core Principles](#core-principles)
- [Optional Properties Patterns](#optional-properties-patterns)
- [null vs undefined: Critical Distinction](#null-vs-undefined-critical-distinction)
- [Utility Types](#utility-types)
- [Interface Design Patterns](#interface-design-patterns)
- [Common Patterns](#common-patterns)
- [Examples from @reasonabletech/utils](#examples-from-reasonabletechutils)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

## Core Principles

### 1. **Prefer Utility Types Over Explicit Unions**

```typescript
// ❌ Verbose and repetitive
interface StatusInfo {
  readonly status: Status;
  readonly message?: string | undefined;
  readonly updatedAt: Date;
}

// ✅ Clean and expressive
interface BaseStatusInfo {
  readonly status: Status;
  readonly message: string;
  readonly updatedAt: Date;
}

export type StatusInfo = WithOptional<BaseStatusInfo, "message">;
```

### 2. **Define Base Interfaces with Required Properties**

Start with all properties required, then selectively make them optional. This makes the "complete" shape of the object clear.

### 3. **Use Descriptive Utility Type Names**

Name utility types based on their intent, not their implementation.

## Optional Properties Patterns

### Pattern 1: WithOptional Utility Type

```typescript
// Import from centralized utils package
import type { WithOptional } from "@reasonabletech/utils";

// Usage examples
interface BaseUser {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly avatar: string;
  readonly createdAt: Date;
}

// Make avatar optional for user creation
export type CreateUser = WithOptional<BaseUser, "id" | "avatar" | "createdAt">;

// Make multiple properties optional for updates
export type UpdateUser = WithOptional<BaseUser, "email" | "name" | "avatar">;
```

### Pattern 2: Configuration Objects

```typescript
interface BaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly timeout: number;
  readonly retries: number;
}

// Provide sensible defaults by making non-critical options optional
export type DatabaseConfig = WithOptional<
  BaseConfig,
  "ssl" | "timeout" | "retries"
>;

// For environment-specific configs
export type TestConfig = WithOptional<
  BaseConfig,
  "ssl" | "timeout" | "retries" | "password"
>;
```

### Pattern 3: API Request/Response Types

```typescript
interface BaseApiResponse<T = unknown> {
  readonly data: T;
  readonly message: string;
  readonly timestamp: Date;
  readonly requestId: string;
  readonly errors: string[];
}

// Success responses might not have errors
export type SuccessResponse<T> = WithOptional<BaseApiResponse<T>, "errors">;

// Error responses might not have data
export type ErrorResponse = WithOptional<BaseApiResponse<null>, "data">;
```

## null vs undefined: Critical Distinction

### The Fundamental Rule

**`null` and `undefined` are DIFFERENT TYPES in TypeScript, not interchangeable.**

- Checking for `null` is NOT the same as checking for `undefined`
- If your type says `T | undefined`, you check for `undefined` only
- If your type says `T | null`, you check for `null` only
- Never check for both unless BOTH are explicitly in the type union

Checking for both simultaneously is a **MASSIVE RED FLAG** indicating a type mismatch.

### Common Mistake

```typescript
// ❌ WRONG: Type says | undefined, but checking for both null and undefined
function processValue(value: string | undefined) {
  if (value === null || value === undefined) {
    // ERROR: @typescript-eslint/no-unnecessary-condition
    // "the types have no overlap" - null is NOT part of the union
    return;
  }
  // ... rest of function
}

// ✅ CORRECT: Only check for what's in the type union
function processValue(value: string | undefined) {
  if (value === undefined) {
    // ← Match the actual type
    return;
  }
  // ... rest of function
}
```

### Understanding the Lint Error

When ESLint reports:

```
error  Unnecessary conditional, the types have no overlap
@typescript-eslint/no-unnecessary-condition
```

**It means**: You're checking for a value that isn't part of your declared type union.

**This is a TYPE SYSTEM error**, not a runtime behavior issue.

**Example**:

```typescript
type Param = Record<string, string[]> | undefined;
//             ↑ Record type                  ↑ undefined
//             This is in the union          This is in the union
//             null is NOT in this union

// ❌ Checking for null fails lint check
if (param === null || param === undefined) {
  // null not in union!
  // "the types have no overlap" on the null check
}

// ✅ Correct check
if (param === undefined) {
  // Only check for what's in the union
  return [];
}
```

### Quick Reference Table

| Type Declaration         | Correct Check            | Wrong Check     |
| ------------------------ | ------------------------ | --------------- |
| `T \| undefined`         | `=== undefined`          | `=== null`      |
| `T \| null`              | `=== null`               | `=== undefined` |
| `T \| null \| undefined` | `== null` (catches both) | N/A             |

**Key**: When the type doesn't include a value, don't check for it. TypeScript's type system guarantees it won't happen.

### Why This Matters

1. **Type Safety**: The type system prevents impossible conditions
2. **Code Clarity**: Your conditionals match your actual types
3. **Lint Enforcement**: ESLint catches type mismatches automatically
4. **Maintainability**: Future developers see what values are actually possible

**See [ESLint Rule Antipatterns](./eslint-rule-antipatterns.md#antipattern-5-checking-both-null-and-undefined) for enforcement via ESLint.**

### Best Practice

Always ask yourself: "What values are actually in this type union?"

Then write conditionals that check only for those values.

```typescript
// Define the type clearly
type Input = { data: string } | undefined;
//            ↑ Object                 ↑ undefined (null NOT here)

// Check only for what's in the union
function handle(input: Input) {
  if (input === undefined) {
    // ✅ This is correct
    return;
  }

  // At this point, input is guaranteed to be { data: string }
  console.log(input.data);
}
```

## Utility Types

### Core Utility Types

All utility types are available from the centralized utils package:

```typescript
import type {
  WithOptional,
  WithRequired,
  OnlyOptional,
  DeepPartial,
  NonNullableProps,
  Brand,
} from "@reasonabletech/utils";
```

For complete documentation and examples, see the type definitions in `@reasonabletech/utils/types`.

### Specialized Utility Types

```typescript
// For configuration objects with environment overrides
type EnvironmentConfig<T> = {
  readonly default: T;
  readonly development?: Partial<T>;
  readonly testing?: Partial<T>;
  readonly staging?: Partial<T>;
  readonly production?: Partial<T>;
};

// For objects that can be in different states
type StatefulObject<T, S extends string> = T & {
  readonly state: S;
  readonly stateChangedAt: Date;
};

// For API operations with metadata
type WithMetadata<T> = T & {
  readonly metadata: {
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly version: number;
  };
};
```

## Interface Design Patterns

### Pattern 1: Base + Variants

```typescript
// 1. Define the complete base interface
interface BaseAgent {
  readonly id: AgentId;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: string[];
  readonly configuration: Record<string, unknown>;
  readonly status: AgentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// 2. Create specific variants
export type CreateAgentRequest = WithOptional<
  BaseAgent,
  "id" | "status" | "createdAt" | "updatedAt"
>;

export type UpdateAgentRequest = WithOptional<
  BaseAgent,
  | "id"
  | "name"
  | "description"
  | "version"
  | "capabilities"
  | "configuration"
  | "createdAt"
  | "updatedAt"
>;

export type AgentSummary = Pick<
  BaseAgent,
  "id" | "name" | "status" | "version"
>;
```

### Pattern 2: Factory Functions with Types

```typescript
interface BaseConnectionConfig {
  readonly host: string;
  readonly port: number;
  readonly timeout: number;
  readonly retries: number;
  readonly ssl: boolean;
}

// Type for factory function
export type ConnectionConfig = WithOptional<
  BaseConnectionConfig,
  "timeout" | "retries" | "ssl"
>;

// Factory with defaults
export function createConnectionConfig(
  config: ConnectionConfig,
): Required<BaseConnectionConfig> {
  return {
    timeout: 5000,
    retries: 3,
    ssl: true,
    ...config,
  };
}
```

### Pattern 3: Builder Pattern with Progressive Types

```typescript
interface BaseQuery {
  readonly table: string;
  readonly select: string[];
  readonly where: Record<string, unknown>;
  readonly orderBy: string;
  readonly limit: number;
  readonly offset: number;
}

// Progressive builder types
type QueryWithTable = Pick<BaseQuery, "table">;
type QueryWithSelect = QueryWithTable & Pick<BaseQuery, "select">;
type QueryWithWhere = QueryWithSelect & Partial<Pick<BaseQuery, "where">>;
type CompleteQuery = QueryWithWhere &
  Partial<Pick<BaseQuery, "orderBy" | "limit" | "offset">>;

class QueryBuilder {
  table(name: string): QueryBuilder & QueryWithTable {
    /* ... */
  }
  select(fields: string[]): QueryBuilder & QueryWithSelect {
    /* ... */
  }
  where(conditions: Record<string, unknown>): QueryBuilder & QueryWithWhere {
    /* ... */
  }
  build(): CompleteQuery {
    /* ... */
  }
}
```

## Error Type Patterns

### Documented Error Union Types

**🚨 MANDATORY: All error union types must be extracted to separately documented named types.**

#### Pattern: Base Interface + Named Error Types

```typescript
// ✅ CORRECT: Define comprehensive base interface
interface BaseWorkspaceDataSource {
  getAllWorkspaces(): Promise<Workspace[]>;
  getWorkspaceByUid(uid: string): Promise<Workspace | null>;
  createWorkspace(
    workspace: Workspace,
  ): Promise<Result<Workspace, WorkspaceCreateError>>;
  updateWorkspace(
    uid: string,
    updates: WorkspaceUpdateData,
  ): Promise<Result<Workspace, WorkspaceUpdateError>>;
  deleteWorkspace(uid: string): Promise<Result<boolean, WorkspaceDeleteError>>;
}

/**
 * Error type for workspace creation operations
 *
 * - `validation_error`: The workspace data failed validation checks
 * - `conflict`: A workspace with the same identifier already exists
 */
export type WorkspaceCreateError = "validation_error" | "conflict";

/**
 * Error type for workspace update operations
 *
 * - `not_found`: The workspace to update does not exist
 * - `validation_error`: The update data failed validation checks
 * - `conflict`: The update would create a conflict with existing data
 */
export type WorkspaceUpdateError =
  | "not_found"
  | "validation_error"
  | "conflict";

/**
 * Error type for workspace deletion operations
 *
 * - `not_found`: The workspace to delete does not exist
 */
export type WorkspaceDeleteError = "not_found";
```

#### Pattern: Domain-Grouped Error Types

```typescript
// ✅ CORRECT: Group related error types by domain
/**
 * Authentication error types for login operations
 *
 * - `invalid_credentials`: Username/password combination is incorrect
 * - `account_locked`: Account has been temporarily locked due to failed attempts
 * - `mfa_required`: Multi-factor authentication is required to complete login
 */
export type AuthLoginError =
  | "invalid_credentials"
  | "account_locked"
  | "mfa_required";

/**
 * Authentication error types for registration operations
 *
 * - `email_exists`: An account with this email already exists
 * - `weak_password`: Password does not meet security requirements
 * - `invalid_email`: Email format is invalid or from a blocked domain
 */
export type AuthRegistrationError =
  | "email_exists"
  | "weak_password"
  | "invalid_email";

/**
 * Authentication error types for session operations
 *
 * - `session_expired`: Current session has expired and needs refresh
 * - `invalid_token`: Session token is malformed or invalid
 * - `insufficient_permissions`: Session lacks required permissions for operation
 */
export type AuthSessionError =
  | "session_expired"
  | "invalid_token"
  | "insufficient_permissions";

// Use in service interface
interface AuthService {
  login(
    credentials: LoginCredentials,
  ): Promise<Result<Session, AuthLoginError>>;
  register(
    userData: RegistrationData,
  ): Promise<Result<User, AuthRegistrationError>>;
  validateSession(token: string): Promise<Result<Session, AuthSessionError>>;
}
```

#### Pattern: Error Type Hierarchies

```typescript
// ✅ CORRECT: Create composable error type hierarchies
/**
 * Base validation error types used across multiple operations
 *
 * - `required_field`: A required field is missing from the input
 * - `invalid_format`: Field value format is incorrect (email, phone, etc.)
 * - `value_too_long`: Field value exceeds maximum length limit
 * - `value_too_short`: Field value is below minimum length requirement
 */
export type ValidationError =
  | "required_field"
  | "invalid_format"
  | "value_too_long"
  | "value_too_short";

/**
 * Base permission error types used across multiple operations
 *
 * - `unauthorized`: No valid authentication provided
 * - `forbidden`: Authentication provided but lacks required permissions
 * - `rate_limited`: Too many requests from this user/IP
 */
export type PermissionError = "unauthorized" | "forbidden" | "rate_limited";

/**
 * User creation error types combining validation and business logic errors
 *
 * Includes all ValidationError and PermissionError types, plus:
 * - `email_exists`: An account with this email already exists
 * - `username_taken`: This username is already in use
 */
export type UserCreateError =
  | ValidationError
  | PermissionError
  | "email_exists"
  | "username_taken";

/**
 * User update error types for profile modifications
 *
 * Includes all ValidationError and PermissionError types, plus:
 * - `not_found`: User account does not exist
 * - `email_exists`: New email is already used by another account
 */
export type UserUpdateError =
  | ValidationError
  | PermissionError
  | "not_found"
  | "email_exists";
```

#### Pattern: Error Type Documentation Templates

```typescript
/**
 * Error type for [OPERATION DESCRIPTION] operations
 *
 * [OPTIONAL: Additional context about when these errors occur]
 *
 * - `error_code_1`: [Clear description of when this error occurs]
 * - `error_code_2`: [Clear description with specific examples if helpful]
 * - `error_code_3`: [Description including any remediation hints]
 */
export type [OperationName][Operation]Error = "error_code_1" | "error_code_2" | "error_code_3";

// Real example:
/**
 * Error type for document upload operations
 *
 * These errors represent expected failure cases during file upload processing
 * that client code should handle gracefully with appropriate user feedback.
 *
 * - `file_too_large`: Uploaded file exceeds the 10MB size limit
 * - `invalid_type`: File type is not supported (only PDF, DOCX, TXT allowed)
 * - `virus_detected`: File failed security scanning and was rejected
 * - `quota_exceeded`: User has reached their storage quota limit
 * - `processing_failed`: File processing encountered an unrecoverable error
 */
export type DocumentUploadError =
  | "file_too_large"
  | "invalid_type"
  | "virus_detected"
  | "quota_exceeded"
  | "processing_failed";
```

#### Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Use inline error unions
interface BadService {
  createUser(
    data: UserData,
  ): Promise<Result<User, "validation_error" | "email_exists">>;
  updateUser(
    id: string,
    data: UserData,
  ): Promise<Result<User, "not_found" | "validation_error">>;
}

// ❌ DON'T: Use undocumented error types
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";

// ❌ DON'T: Mix error abstraction levels inconsistently
export type MixedError =
  | "not_found"
  | "ECONNREFUSED"
  | "Invalid email format"
  | 500;

// ❌ DON'T: Use overly generic error types
export type GenericError = "error" | "failed" | "invalid";

// ❌ DON'T: Create deeply nested error type dependencies
export type OverlyComplexError =
  | UserError
  | DatabaseError
  | NetworkError
  | ValidationError
  | BusinessLogicError;
```

#### Export and Organization Strategy

```typescript
// ✅ CORRECT: Co-locate error types with their interfaces
// In core/user-service.ts
export interface UserService {
  createUser(data: UserData): Promise<Result<User, UserCreateError>>;
  updateUser(
    id: string,
    data: UserData,
  ): Promise<Result<User, UserUpdateError>>;
}

export type UserCreateError = "validation_error" | "email_exists";
export type UserUpdateError = "not_found" | "validation_error" | "email_exists";

// ✅ CORRECT: Re-export from package index
// In types/index.ts
export type {
  UserCreateError,
  UserUpdateError,
  UserDeleteError,
} from "../core/user-service.js";

// ✅ CORRECT: Group exports by domain
export type {
  // Workspace operation errors
  WorkspaceCreateError,
  WorkspaceUpdateError,
  WorkspaceDeleteError,

  // Authentication errors
  AuthLoginError,
  AuthRegistrationError,
  AuthSessionError,

  // Document operation errors
  DocumentUploadError,
  DocumentProcessingError,
} from "../core/index.js";
```

## Common Patterns

### 1. Result Types

```typescript
interface BaseResult<T, E = Error> {
  readonly success: boolean;
  readonly value: T;
  readonly error: E;
  readonly timestamp: Date;
}

// Success case - no error needed
export type SuccessResult<T> = WithOptional<BaseResult<T, never>, "error"> & {
  readonly success: true;
};

// Error case - no value needed
export type ErrorResult<E = Error> = WithOptional<
  BaseResult<never, E>,
  "value"
> & {
  readonly success: false;
};

export type Result<T, E = Error> = SuccessResult<T> | ErrorResult<E>;
```

### 2. Event Types

```typescript
interface BaseEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly source: string;
  readonly correlationId: string;
  readonly metadata: Record<string, unknown>;
}

// Domain events might not need correlation
export type DomainEvent<T = unknown> = WithOptional<
  BaseEvent,
  "correlationId"
> & {
  readonly payload: T;
};

// System events always have correlation
export type SystemEvent = BaseEvent & {
  readonly level: "info" | "warn" | "error";
};
```

### 3. Service Interfaces

```typescript
interface BaseService {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: ServiceStatus;
  readonly dependencies: string[];
  readonly configuration: Record<string, unknown>;
}

// For service registration
export type ServiceRegistration = WithOptional<
  BaseService,
  "status" | "dependencies" | "configuration"
>;

// For service discovery
export type ServiceInfo = Pick<
  BaseService,
  "id" | "name" | "version" | "status"
>;
```

## Examples from @reasonabletech/utils

### Result Type Patterns

```typescript
import { ok, err, type Result } from "@reasonabletech/utils";

/**
 * Error type for config parsing operations
 *
 * - `invalid_format`: Config data is not valid JSON or has wrong structure
 * - `missing_field`: A required configuration field is absent
 */
export type ParseConfigError = "invalid_format" | "missing_field";

function parseConfig(input: unknown): Result<Config, ParseConfigError> {
  if (typeof input !== "object" || input === null) {
    return err("invalid_format");
  }
  if (!("host" in input)) {
    return err("missing_field");
  }
  return ok(input as Config);
}

// Consuming the result
const result = parseConfig(rawInput);
if (result.success) {
  console.log(result.value.host); // Typed as Config
} else {
  console.log(result.error); // "invalid_format" | "missing_field"
}
```

### Config Factory Patterns

```typescript
import type { WithOptional } from "@reasonabletech/utils";

interface BaseServiceConfig {
  readonly host: string;
  readonly port: number;
  readonly timeout: number;
  readonly retries: number;
}

export type ServiceConfig = WithOptional<
  BaseServiceConfig,
  "timeout" | "retries"
>;

export function createServiceConfig(
  config: ServiceConfig,
): Required<BaseServiceConfig> {
  return {
    timeout: 5000,
    retries: 3,
    ...config,
  };
}
```

### Utility Type Examples

```typescript
import type { WithOptional } from "@reasonabletech/utils";

interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly name: string;
}

// For creation — ID and timestamps are auto-generated
export type CreateEntity = WithOptional<
  BaseEntity,
  "id" | "createdAt" | "updatedAt"
>;

// For updates — only some fields can change
export type UpdateEntity = WithOptional<
  BaseEntity,
  "id" | "name" | "createdAt" | "updatedAt"
>;
```

## Anti-Patterns to Avoid

### ❌ Don't: Explicit | undefined everywhere

```typescript
interface StatusInfo {
  readonly status: Status;
  readonly message?: string | undefined;
  readonly updatedAt: Date;
  readonly details?: Record<string, unknown> | undefined;
}
```

### ❌ Don't: Mixing required and optional arbitrarily

```typescript
interface BadConfig {
  host?: string; // Critical - should be required
  port: number; // Has sensible default - could be optional
  debug?: boolean;
  timeout: number;
}
```

### ❌ Don't: Overusing Partial<T>

```typescript
// Too broad - makes everything optional
type UpdateUser = Partial<User>;

// Better - be explicit about what can be updated
type UpdateUser = WithOptional<User, "name" | "email" | "avatar">;
```

### ❌ Don't: Deeply nested optional properties without structure

```typescript
interface BadNested {
  config?: {
    database?: {
      host?: string;
      port?: number;
    };
  };
}

// Better - use separate interfaces
interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
}

interface AppConfig {
  readonly database: DatabaseConfig;
}

export type PartialAppConfig = WithOptional<AppConfig, "database">;
```

## Best Practices Summary

1. **Start with complete base interfaces** - define the full shape first
2. **Use utility types for variants** - don't repeat interface definitions
3. **Be explicit about optionality** - use descriptive utility type names
4. **Provide factory functions** - encapsulate default value logic
5. **Group related optional properties** - make logical sense of what can be omitted
6. **Document the intent** - explain why properties are optional
7. **Use branded types for IDs** - prevent mixing different ID types
8. **Consider the consumer** - design types for how they'll be used

## Integration with exactOptionalPropertyTypes

If you choose to use `exactOptionalPropertyTypes: true` in your TypeScript config, these patterns become even more valuable as they encapsulate the `| undefined` complexity in reusable utility types rather than spreading it throughout your codebase.

```typescript
// Import the utility type from the centralized package
import type { WithOptional } from "@reasonabletech/utils";

// Your interfaces stay clean
interface BaseUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export type User = WithOptional<BaseUser, "email">;
```

This way, the type safety benefits are preserved while maintaining readable and maintainable code.
