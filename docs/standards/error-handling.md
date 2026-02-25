# Error Handling Standards

## **CRITICAL: Error Detection Rules**

**🚨 NEVER EVER PARSE ERROR MESSAGES TO DETERMINE ERROR TYPES. 🚨**

This is a **MANDATORY** rule that applies to ALL error handling in the codebase. Error messages are unreliable and can change between library versions, locales, or environments.

### **❌ FORBIDDEN PATTERNS - NEVER USE THESE:**

```typescript
// ❌ ABSOLUTELY FORBIDDEN: Message parsing
if (error.message.includes("ECONNREFUSED")) {
  /* WRONG */
}
if (error.message.includes("401")) {
  /* WRONG */
}
if (error.message.includes("Unauthorized")) {
  /* WRONG */
}
if (error.message.includes("timeout")) {
  /* WRONG */
}
if (error.message.includes("not found")) {
  /* WRONG */
}

// ❌ FORBIDDEN: String matching on messages
if (error.message === "Network Error") {
  /* WRONG */
}
if (error.toString().includes("ValidationError")) {
  /* WRONG */
}
```

### **✅ REQUIRED PATTERNS - ALWAYS USE THESE:**

```typescript
// ✅ MANDATORY: Use structured properties
if (error.code === "ECONNREFUSED") {
  /* CORRECT */
}
if (error.status === 401) {
  /* CORRECT */
}
if (error.name === "ValidationError") {
  /* CORRECT */
}
if (error instanceof NetworkError) {
  /* CORRECT */
}

// ✅ REQUIRED: Check error types/classes
if (error instanceof ValidationError) {
  /* CORRECT */
}
if (error instanceof WebAuthnError) {
  /* CORRECT */
}
if (error instanceof ApiError) {
  /* CORRECT */
}

// ✅ MANDATORY: Use typed error properties
if (networkError.type === "authentication_failed") {
  /* CORRECT */
}
if (apiError.category === "validation") {
  /* CORRECT */
}
```

### **Proper error identification methods (IN ORDER OF PREFERENCE):**

1. **Error classes/types**: `instanceof` checks (most reliable)
2. **Error codes**: `error.code` property (very reliable)
3. **HTTP status codes**: `error.status` or `error.statusCode` (reliable)
4. **Error names**: `error.name` property (reliable)
5. **Custom error properties**: Domain-specific typed properties (reliable)

## **Universal Application**

This rule applies to **ALL ERROR HANDLING** across the entire codebase:

- ✅ **HTTP/Network errors**: Use status codes, not messages
- ✅ **WebAuthn errors**: Use error codes/types, not messages
- ✅ **Validation errors**: Use field names/codes, not messages
- ✅ **Database errors**: Use error codes, not messages
- ✅ **File system errors**: Use error codes (ENOENT, EACCES), not messages
- ✅ **Authentication errors**: Use typed error classes, not messages
- ✅ **Third-party library errors**: Use their error codes/types, not messages

## **Code Review Enforcement**

**ALL pull requests MUST be reviewed for message parsing violations.**

Reviewers should immediately reject any code that:

- Uses `.includes()`, `.startsWith()`, `.endsWith()` on error messages
- Uses equality checks (`===`, `==`) on error messages
- Uses regex matching on error messages
- Uses `.toString()` checks on errors for type detection

**See [ESLint Rule Antipatterns](./eslint-rule-antipatterns.md) for the complete catalog of error handling antipatterns (#1-4).**

## Error Message Structure

**Every error message should answer three questions:**

1. **What went wrong?** - Clear description
2. **Why did it happen?** - Context when helpful
3. **How can it be fixed?** - Specific, actionable steps

```typescript
// ❌ Poor: "Invalid input"
// ✅ Good: "Authentication failed: API key 'sk-***1234' is invalid or expired. Please check your API key in settings or generate a new one at https://platform.openai.com/api-keys"
```

## Error Categories & Patterns

| Error Type      | User Message                            | Developer Details                          | Actions                          |
| --------------- | --------------------------------------- | ------------------------------------------ | -------------------------------- |
| **Network**     | "Unable to connect to server"           | Include endpoint, timeout duration         | Check connection, retry          |
| **Validation**  | "Email format invalid: 'user@domain'"   | Field name, current value, expected format | Fix input format                 |
| **Auth**        | "Session expired. Please sign in again" | Token expiry, refresh attempts             | Re-authenticate                  |
| **File System** | "Cannot read project file"              | File path, permissions, error code         | Fix permissions, check existence |
| **API**         | "Rate limit exceeded"                   | Status code, endpoint, reset time          | Reduce frequency, upgrade plan   |

## Error Logging with Context

> Use structured logging appropriate for your application. Always include relevant context, never include sensitive information.

```typescript
// ✅ Structured error logging
structuredLogger.error("auth", "Authentication failed", {
  correlationId: "req_abc123",
  userId: user?.id ?? "anonymous",
  apiKey: apiKey?.slice(-4) ?? "none", // Only last 4 chars
  endpoint: "/api/v1/auth/login",
  errorCode: "INVALID_CREDENTIALS",
});
```

**Always include relevant context:**

- File paths, line numbers, correlation IDs for debugging
- Request URLs, HTTP methods, status codes for API errors
- Timestamps and sequence information for timing issues

**Never include sensitive information:**

- Full API keys, passwords, tokens (last 4 chars only)
- Personal information (emails, phone numbers)
- Internal system paths that reveal infrastructure

## Exception vs Result Type Guidelines

### Quick Reference

**Use Result<T, E> for expected failures:**

- Resource not found by ID
- User service won't start
- Agent refuses operation (low memory, rate limits)
- Validation failures
- Application layer boundaries

**Use Exceptions for unexpected errors:**

- File streams closing unexpectedly
- Memory allocation failures
- Programming errors/assertion failures
- Framework integration (React Error Boundaries, Next.js error pages)

```typescript
// ✅ Expected failure - use Result
async function getUserById(id: string): Promise<Result<User, "not_found">> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return { success: false, error: "not_found" };
  }
  return { success: true, value: user };
}

// ✅ Unexpected error - let exception throw
function processStream(stream: ReadableStream) {
  stream.on("error", (error) => {
    // Stream errors are unexpected - let them throw
    throw new Error(`Stream failed: ${error.message}`);
  });
}
```

## Error Type Organization & Documentation

**🚨 MANDATORY: All error union types MUST be extracted to separately documented named types. 🚨**

### **❌ FORBIDDEN PATTERNS - NEVER USE THESE:**

```typescript
// ❌ ABSOLUTELY FORBIDDEN: Inline union types in Result signatures
async function createUser(
  userData: UserData,
): Promise<
  Result<User, "validation_error" | "email_exists" | "database_error">
> {
  // WRONG - error types are not documented or reusable
}

// ❌ FORBIDDEN: Undocumented error union types
export type UserCreateError =
  | "validation_error"
  | "email_exists"
  | "database_error";
```

### **✅ REQUIRED PATTERNS - ALWAYS USE THESE:**

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

/**
 * Error type for user lookup operations
 *
 * - `not_found`: No user exists with the provided identifier
 * - `access_denied`: User exists but current session lacks permission to access
 */
export type UserLookupError = "not_found" | "access_denied";

// ✅ MANDATORY: Use documented error types in Result signatures
async function createUser(
  userData: UserData,
): Promise<Result<User, UserCreateError>> {
  // CORRECT - error type is documented and reusable
}

async function getUserById(id: string): Promise<Result<User, UserLookupError>> {
  // CORRECT - clear, documented error cases
}
```

### **Error Type Documentation Requirements**

**Every error union type MUST include:**

1. **JSDoc comment** explaining the overall operation context
2. **Individual error code documentation** with specific meanings
3. **Clear descriptions** of when each error occurs
4. **Actionable context** where helpful for debugging

```typescript
/**
 * Error type for workspace operations
 *
 * These errors can occur during workspace creation, updates, or management
 * operations and represent expected failure modes that calling code should handle.
 *
 * - `validation_error`: Input data failed schema validation (missing required fields, invalid formats)
 * - `conflict`: Operation conflicts with existing data (duplicate name, overlapping paths)
 * - `not_found`: Target workspace does not exist or is not accessible
 * - `permission_denied`: User lacks required permissions for this workspace operation
 * - `quota_exceeded`: User has reached their workspace limit for their plan
 */
export type WorkspaceOperationError =
  | "validation_error"
  | "conflict"
  | "not_found"
  | "permission_denied"
  | "quota_exceeded";
```

### **Error Type Organization**

1. **Co-locate with interfaces**: Define error types in the same file as the interfaces that use them
2. **Export from main module**: Re-export error types from package index files
3. **Namespace by domain**: Group related error types together (e.g., `AuthError`, `WorkspaceError`)
4. **Version with interfaces**: When interfaces change, update related error types

```typescript
// ✅ CORRECT: Error types in same file as interface
export interface WorkspaceDataSource {
  createWorkspace(
    workspace: Workspace,
  ): Promise<Result<Workspace, WorkspaceCreateError>>;
  updateWorkspace(
    uid: string,
    updates: WorkspaceUpdateData,
  ): Promise<Result<Workspace, WorkspaceUpdateError>>;
}

/**
 * Error type for workspace creation operations
 */
export type WorkspaceCreateError = "validation_error" | "conflict";

/**
 * Error type for workspace update operations
 */
export type WorkspaceUpdateError =
  | "not_found"
  | "validation_error"
  | "conflict";

// ✅ CORRECT: Re-export from main package
// In types/index.ts
export type {
  WorkspaceCreateError,
  WorkspaceUpdateError,
  WorkspaceDeleteError,
} from "../core/workspace-data-source.js";
```

### **Error Type Naming Conventions**

- **Use descriptive suffixes**: `CreateError`, `UpdateError`, `LookupError`, `OperationError`
- **Include domain context**: `WorkspaceCreateError`, `AuthenticationError`, `DatabaseError`
- **Match operation patterns**: If you have `createUser()`, use `UserCreateError`
- **Stay consistent**: Similar operations should have similar error type patterns

### **Migration Strategy**

**For existing code with inline error unions:**

1. **Extract the union type** to a named, documented type
2. **Add comprehensive JSDoc** explaining each error code
3. **Update the interface** to use the named type
4. **Export from package index** for external consumption
5. **Update all callers** to import and use the named type

```typescript
// Before: Inline union
createUser(data: UserData): Promise<Result<User, "validation_error" | "email_exists">>;

// After: Documented named type
/**
 * Error type for user creation operations
 *
 * - `validation_error`: User data failed validation checks
 * - `email_exists`: An account with this email address already exists
 */
export type UserCreateError = "validation_error" | "email_exists";

createUser(data: UserData): Promise<Result<User, UserCreateError>>;
```

## General Error Handling Guidelines

When handling errors, always ensure that you:

- **Extract error unions to documented types** - never use inline unions in Result types
- **Document every error code** with clear explanations and context
- Log the error with appropriate context using structured logging
- Provide user-friendly error messages in the UI when possible
- Avoid exposing sensitive information in error messages
- Use Error objects directly rather than converting them to strings
- Choose Result types for expected failures, exceptions for unexpected errors
