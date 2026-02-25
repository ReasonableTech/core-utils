# Testing Organization Standards

This document outlines our comprehensive approach to test coverage, organization, and file structure standards for @reasonabletech/core-utils, based on our commitment to 100% test coverage and semantic test organization.

## Test Coverage Requirements

### 100% Coverage Policy

All packages MUST achieve 100% test coverage across all metrics:

- **Lines**: 100%
- **Statements**: 100%
- **Functions**: 100%
- **Branches**: 100%

### Coverage Enforcement

Coverage thresholds are enforced via vitest configuration:

```typescript
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
// Note: Coverage thresholds are automatically set to 100% in the base config
```

**Critical Rules:**

- **Never lower thresholds to accommodate incomplete tests**
- **Never use coverage exclusions except for genuinely untestable code**
- **Achieve actual 100% coverage through comprehensive testing**

## Test Organization Principles

### Semantic Grouping Over Implementation Details

Tests should be organized by **functionality and user intent**, not by implementation details.

#### ✅ Correct Organization

```
tests/unit/
├── navigation-guards.test.ts       # Guard functionality
├── error-handling.test.ts          # Error states and recovery
├── routes.test.ts                  # Route management
├── multi-stack.test.ts             # Multi-stack operations
└── stack.test.ts                   # Single stack operations
```

#### ❌ Incorrect Organization

```
tests/unit/
├── coverage-tests.test.ts          # Bad: organized by testing concern
├── edge-cases.test.ts              # Bad: implementation detail grouping
└── private-methods.test.ts         # Bad: visibility-based grouping
```

## Testing Fundamentals

### The Three Distinct Concepts

Testing support files serve completely different purposes and should never be mixed:

- **Fixtures = Test Data** - Pure data objects and data factories
- **Mocks = Fake Implementations** - Replacement objects that simulate real dependencies
- **Helpers = Utility Functions** - Reusable functions that reduce test setup boilerplate

### Fixtures: Test Data Only

**Fixtures provide consistent test data across multiple tests.**

```typescript
// ✅ FIXTURE: Pure data object
export const userFixture = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-01"),
};

// ✅ FIXTURE: Data factory function
export function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    ...userFixture,
    ...overrides,
  };
}

// ✅ FIXTURE: Complex data with relationships
export const workspaceFixture = {
  id: "workspace-456",
  name: "Test Workspace",
  ownerId: userFixture.id,
  members: [userFixture],
};

// ❌ NOT A FIXTURE: This is a mock (fake implementation)
export const userServiceFixture = {
  createUser: vi.fn(),
  findUser: vi.fn(),
};

// ❌ NOT A FIXTURE: This is a helper (utility function)
export function setupUserFixture() {
  return render(<UserComponent user={userFixture} />);
}
```

### Mocks: Fake Implementations Only

**Mocks replace real dependencies with controllable fake implementations.**

```typescript
// ✅ MOCK: Fake service implementation
export const mockUserService = {
  createUser: vi.fn().mockResolvedValue(ok(userFixture)),
  findUser: vi.fn().mockResolvedValue(ok(userFixture)),
  updateUser: vi.fn().mockResolvedValue(ok(userFixture)),
};

// ✅ MOCK: Fake external dependency
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// ✅ MOCK: Fake database client
export const mockDatabase = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockDatabase)),
};

// ❌ NOT A MOCK: This is a fixture (test data)
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
};

// ❌ NOT A MOCK: This is a helper (utility function)
export function mockUserServiceSetup() {
  return new UserService(mockDatabase, mockApiClient);
}
```

**Mock Types Explained:**

- **Mock**: Verifies interactions - tracks calls, parameters, call counts
- **Stub**: Returns predetermined responses - no interaction verification
- **Spy**: Observes real method calls while allowing normal execution
- **Fake**: Working implementation with simplified logic (e.g., in-memory database)

### Helpers: Utility Functions Only

**Helpers reduce boilerplate and provide reusable test setup patterns.**

```typescript
// ✅ HELPER: React testing utility
export function renderWithAuth(
  component: React.ReactElement,
  user: User = userFixture
) {
  return render(
    <AuthProvider user={user}>
      {component}
    </AuthProvider>
  );
}

// ✅ HELPER: Test setup utility
export function setupUserServiceTest() {
  const userService = new UserService(mockDatabase, mockApiClient);

  return {
    userService,
    cleanup: () => {
      vi.clearAllMocks();
    },
  };
}

// ✅ HELPER: Assertion utility
export function expectUserToMatch(actual: User, expected: User) {
  expect(actual.id).toBe(expected.id);
  expect(actual.email).toBe(expected.email);
  expect(actual.name).toBe(expected.name);
}

// ❌ NOT A HELPER: This is a fixture (test data)
export function userHelper() {
  return {
    id: "user-123",
    email: "test@example.com",
  };
}

// ❌ NOT A HELPER: This is a mock (fake implementation)
export function helperUserService() {
  return {
    createUser: vi.fn(),
    findUser: vi.fn(),
  };
}
```

### Usage Examples

**Correct separation in tests:**

```typescript
// Import test data from fixtures
import { userFixture, createUserFixture } from '../fixtures/users';

// Import fake implementations from mocks
import { mockUserService, mockDatabase } from '../mocks/user-service';

// Import utility functions from helpers
import { renderWithAuth, setupUserServiceTest } from '../helpers/test-utils';

describe("UserComponent", () => {
  it("should display user information", () => {
    // Use FIXTURE for test data
    const user = createUserFixture({ name: "Custom Name" });

    // Use HELPER for utility function
    renderWithAuth(<UserComponent />, user);

    expect(screen.getByText("Custom Name")).toBeInTheDocument();
  });

  it("should call user service correctly", async () => {
    // Use HELPER for test setup
    const { userService, cleanup } = setupUserServiceTest();

    // Use FIXTURE for test data
    await userService.createUser(userFixture);

    // Use MOCK for interaction verification
    expect(mockUserService.createUser).toHaveBeenCalledWith(userFixture);

    cleanup();
  });
});
```

### How to Create Effective Test Support Files

**Creating Good Fixtures:**

```typescript
// ✅ Start with minimal valid data
export const minimalUserFixture = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
};

// ✅ Create specific variations for edge cases
export const userWithLongNameFixture = {
  ...minimalUserFixture,
  name: "A".repeat(255), // Test boundary condition
};

// ✅ Use factory functions for complex scenarios
export function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: `user-${Date.now()}`, // Unique IDs prevent test interference
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ✅ Create related data fixtures
export const userWithWorkspaceFixture = {
  user: minimalUserFixture,
  workspace: {
    id: "workspace-456",
    name: "Test Workspace",
    ownerId: minimalUserFixture.id,
  },
};
```

**Creating Good Mocks:**

```typescript
// ✅ Mock at the service boundary, not internal details
export const mockUserService = {
  createUser: vi.fn(),
  findUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
};

// ✅ Set up default return values that make tests pass
beforeEach(() => {
  mockUserService.createUser.mockResolvedValue(ok(minimalUserFixture));
  mockUserService.findUser.mockResolvedValue(ok(minimalUserFixture));
});

// ✅ Create typed mock factories for consistency
export function createMockUserService(overrides: Partial<UserService> = {}) {
  return {
    createUser: vi.fn().mockResolvedValue(ok(minimalUserFixture)),
    findUser: vi.fn().mockResolvedValue(ok(minimalUserFixture)),
    updateUser: vi.fn().mockResolvedValue(ok(minimalUserFixture)),
    deleteUser: vi.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  };
}

// ✅ Mock external dependencies, not your own code
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
```

**Creating Good Helpers:**

```typescript
// ✅ Encapsulate common setup patterns
export function renderUserComponent(user: User = minimalUserFixture) {
  return render(
    <AuthProvider user={user}>
      <UserProvider>
        <UserComponent />
      </UserProvider>
    </AuthProvider>
  );
}

// ✅ Create setup utilities that return cleanup functions
export function setupUserServiceTest() {
  const mockDb = createMockDatabase();
  const mockLogger = createMockLogger();
  const userService = new UserService(mockDb, mockLogger);

  return {
    userService,
    mockDb,
    mockLogger,
    cleanup: () => {
      vi.clearAllMocks();
    },
  };
}

// ✅ Create assertion helpers for complex verifications
export function expectUserToBeValid(user: User) {
  expect(user.id).toMatch(/^user-\d+$/);
  expect(user.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  expect(user.name).toBeTruthy();
  expect(user.createdAt).toBeInstanceOf(Date);
}

// ✅ Create helpers for async operations
export async function waitForUserToLoad() {
  await waitFor(() => {
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
  });
}
```

**Best Practices:**

1. **Fixtures should be deterministic** - Same input always produces same output
2. **Mocks should fail fast** - Don't set up return values that hide real problems
3. **Helpers should reduce duplication** - If you're copying setup code, create a helper
4. **Keep them simple** - Complex fixtures/mocks/helpers are harder to debug than the tests themselves
5. **Name them clearly** - `userFixture` vs `userServiceMock` vs `renderUserHelper`

## Directory Structure Requirements

All packages must follow the three-tier testing structure with semantic file organization:

```
tests/
├── setup.ts              # Test configuration and global setup
├── fixtures/             # Test data only - organized by feature/domain
│   ├── auth/
│   │   ├── users.ts      # User data objects and factories
│   │   ├── sessions.ts   # Session/token data
│   │   └── credentials.ts # WebAuthn/passkey data
│   ├── workspaces/
│   │   ├── workspaces.ts # Workspace data objects
│   │   ├── members.ts    # Member/invitation data
│   │   └── settings.ts   # Workspace settings data
│   └── projects/
│       ├── projects.ts   # Project data objects
│       ├── tasks.ts      # Task/milestone data
│       └── documents.ts  # Document data
├── mocks/                # Fake implementations only - organized by service boundary
│   ├── services/
│   │   ├── user-service.ts    # Mock UserService
│   │   ├── auth-service.ts    # Mock AuthService
│   │   └── workspace-service.ts # Mock WorkspaceService
│   ├── external/
│   │   ├── api-client.ts      # Mock HTTP client
│   │   ├── database.ts        # Mock database client
│   │   └── email-provider.ts  # Mock email service
│   └── ui/
│       ├── router.ts     # Mock Next.js router
│       └── third-party.ts # Mock external UI libraries
├── helpers/              # Utility functions only - organized by testing concern
│   ├── rendering/
│   │   ├── auth-providers.tsx    # renderWithAuth, renderWithUser
│   │   ├── theme-providers.tsx   # renderWithTheme
│   │   └── router-providers.tsx  # renderWithRouter
│   ├── setup/
│   │   ├── service-setup.ts     # setupUserServiceTest, etc.
│   │   ├── database-setup.ts    # setupTestDatabase
│   │   └── auth-setup.ts        # setupAuthenticatedUser
│   └── assertions/
│       ├── user-assertions.ts   # expectUserToBeValid
│       ├── api-assertions.ts    # expectApiCallToMatch
│       └── ui-assertions.ts     # expectComponentToRender
├── unit/                 # Unit tests (isolated component testing)
│   ├── auth/
│   │   ├── user-service.test.ts
│   │   ├── auth-guards.test.ts
│   │   ├── passkey-flow.test.tsx
│   │   └── token-validation.test.ts
│   ├── workspaces/
│   │   ├── workspace-service.test.ts
│   │   ├── member-management.test.ts
│   │   ├── workspace-settings.test.tsx
│   │   └── large-workspace-queries.test.ts
│   └── projects/
│       ├── project-service.test.ts
│       ├── task-management.test.ts
│       ├── document-editor.test.tsx
│       └── large-document-processing.test.ts
├── integration/          # Integration tests (component interactions)
│   ├── auth-flows/
│   │   ├── oauth-flow.test.ts
│   │   ├── cross-browser-auth.test.ts
│   │   └── oauth-compliance.test.ts
│   ├── workspace-workflows/
│   │   ├── member-sync.test.ts
│   │   └── bulk-member-operations.test.ts
│   └── api-contracts/
│       ├── user-api.test.ts
│       └── workspace-api.test.ts
├── acceptance/           # Acceptance tests (Playwright)
│   ├── user-onboarding/
│   │   ├── registration-flow.test.ts
│   │   └── browser-compatibility.test.ts
│   └── workspace-collaboration/
│       ├── real-time-sync.test.ts
│       └── concurrent-users.test.ts
└── e2e/                   # Service end-to-end tests (Vitest)
    ├── performance/
    │   ├── page-load-times.test.ts
    │   ├── memory-usage.test.ts
    │   └── api-response-times.test.ts
    └── workflows/
        ├── workspace-provisioning.test.ts
        └── billing-reconciliation.test.ts
```

### Test File Structure

Each test file should follow this semantic structure:

```typescript
describe("Feature/Component Name", () => {
  describe("Core Functionality", () => {
    it("should handle primary use case", () => {
      // Test main functionality
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid input gracefully", () => {
      // Test error states
    });
  });

  describe("Edge Cases", () => {
    it("should handle boundary conditions", () => {
      // Test edge cases
    });
  });
});
```

## Test File Naming

**Test Files (all use `.test.ts` or `.test.tsx`):**

- Unit tests: `user-service.test.ts`, `large-document-processing.test.ts`
- Integration tests: `oauth-flow.test.ts`, `bulk-member-operations.test.ts`
- Acceptance tests: `registration-flow.test.ts`, `concurrent-users.test.ts`
- Service E2E tests: `workspace-provisioning.test.ts`, `billing-reconciliation.test.ts`

**Support Files (organized by feature/scope):**

**Fixtures (test data):**

- Feature-based: `tests/fixtures/[feature]/[domain].ts` (e.g., `auth/users.ts`, `workspaces/members.ts`)
- Related data: `tests/fixtures/[feature]/[entity].ts` (e.g., `projects/tasks.ts`, `auth/sessions.ts`)

**Mocks (fake implementations):**

- Service mocks: `tests/mocks/services/[service-name].ts` (e.g., `user-service.ts`, `auth-service.ts`)
- External mocks: `tests/mocks/external/[dependency].ts` (e.g., `api-client.ts`, `database.ts`)
- UI mocks: `tests/mocks/ui/[component-type].ts` (e.g., `router.ts`, `third-party.ts`)

**Helpers (utility functions):**

- Rendering: `tests/helpers/rendering/[provider-type].tsx` (e.g., `auth-providers.tsx`)
- Setup: `tests/helpers/setup/[setup-type].ts` (e.g., `service-setup.ts`, `database-setup.ts`)
- Assertions: `tests/helpers/assertions/[assertion-type].ts` (e.g., `user-assertions.ts`)

### Organization Principles

- **Single naming convention** - All tests use `*.test.ts` or `*.test.tsx`
- **Name by functionality** - `large-document-processing.test.ts`, not `document-processing-perf.test.ts`
- **Co-locate related tests** - All auth tests in `auth/` folder regardless of test type
- **Feature-first organization** - Group by what you're testing, not how you're testing it

Use descriptive names that explain functionality:

```typescript
// ✅ Good: Describes behavior and conditions
it("should emit navigation-did-change event when navigation succeeds");
it("should throw error when attempting to navigate with invalid route");
it("should preserve stack state when navigation is cancelled by guard");

// ❌ Bad: Vague or implementation-focused
it("should work");
it("should test navigate function");
it("should cover line 42");
```

## Configuration Requirements

### Package.json Scripts

All packages must include these standard test scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:acceptance": "playwright test",
    "test:e2e": "vitest run tests/e2e",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Setup Files Organization

**Feature-Based Organization Principles:**

Each test support directory should be organized by feature/scope to prevent bloating:

**Test Data (Fixtures) - Organized by Domain:**

```
tests/fixtures/
├── auth/users.ts        # User data objects and factories
├── auth/sessions.ts     # Authentication session data
├── workspaces/workspaces.ts  # Workspace data objects
├── workspaces/members.ts     # Member/invitation data
└── projects/projects.ts      # Project data objects
```

**Fake Implementations (Mocks) - Organized by Service Boundary:**

```
tests/mocks/
├── services/user-service.ts     # Mock internal UserService
├── services/auth-service.ts     # Mock internal AuthService
├── external/api-client.ts       # Mock HTTP client
├── external/database.ts         # Mock database client
└── ui/router.ts                 # Mock Next.js router
```

**Utility Functions (Helpers) - Organized by Testing Concern:**

```
tests/helpers/
├── rendering/auth-providers.tsx   # renderWithAuth, renderWithUser
├── rendering/theme-providers.tsx  # renderWithTheme
├── setup/service-setup.ts         # setupUserServiceTest, etc.
├── setup/database-setup.ts        # setupTestDatabase
└── assertions/user-assertions.ts  # expectUserToBeValid
```

**Organization Guidelines:**

1. **Group by feature first** - All auth-related fixtures go in `fixtures/auth/`
2. **Group by responsibility** - Service mocks vs external dependency mocks
3. **Group by testing concern** - Rendering helpers vs setup helpers vs assertion helpers
4. **Keep related files together** - User fixtures and user assertions in same feature area
5. **Prevent top-level bloat** - Max 5-8 files per directory before creating subfolders

**Never mix these concepts:**

- ❌ Don't put data factories in `tests/helpers/` (that's fixtures)
- ❌ Don't put mock implementations in `tests/fixtures/` (that's mocks)
- ❌ Don't put utility functions in `tests/mocks/` (that's helpers)

## Coverage Achievement Strategies

### 1. Impossible Branch Coverage

For TypeScript exhaustiveness checks:

```typescript
// In implementation
switch (action.type) {
  case "navigate":
    return handleNavigate(action);
  case "goBack":
    return handleGoBack(action);
  default:
    // For 100% branch coverage
    throw new Error(`Invalid navigation action type: ${(action as any).type}`);
}

// In tests
it("should throw error for invalid action types", () => {
  const invalidAction = { type: "invalid-action-type" } as any;
  expect(() => handler(invalidAction)).toThrow(
    "Invalid navigation action type",
  );
});
```

### 2. Private Method Testing

When necessary for branch coverage:

```typescript
it("should cover private method branches", () => {
  const stack = new NavigationStack();
  const privateMethod = (stack as any)._privateMethodName;

  // Test branches in private methods
  expect(privateMethod(validInput)).toBe(expectedOutput);
  expect(privateMethod(invalidInput)).toBe(fallbackOutput);
});
```

### 3. React Component Testing

For React components, focus on:

1. **Provider functionality**: Context provision and cleanup
2. **Hook behavior**: State management and event handling
3. **Error boundaries**: Proper error handling for missing providers
4. **Type safety**: Generic type parameters work correctly

Avoid async operations that can hang tests:

```typescript
// ✅ Good: Direct state manipulation
it('should update state when navigation changes', async () => {
  const stack = new NavigationStack();

  render(
    <NavigationProvider stack={stack}>
      <TestComponent />
    </NavigationProvider>
  );

  // Navigate directly through stack, not through UI
  await stack.navigate({ /* ... */ });

  // Assert state immediately
  expect(screen.getByTestId('current-route')).toHaveTextContent('expected-route');
});

// ❌ Avoid: Complex async UI interactions that can hang
it('should handle button clicks', async () => {
  await act(async () => {
    fireEvent.click(button); // Can cause hanging
  });

  await waitFor(() => {
    // Can cause infinite waiting
  });
});
```

## Quality Gates

### Pre-commit Requirements

All tests must pass before commit:

```bash
pnpm test --coverage  # Must achieve 100% across all metrics
pnpm lint            # Must pass with zero errors
pnpm typecheck       # Must pass with zero errors
```

### Quality Gate Rules

- **Never lower coverage thresholds** to accommodate incomplete tests
- **Never use coverage exclusions** except for genuinely untestable code
- **Never bypass pre-commit hooks** — see [CONTRIBUTING.md](../../CONTRIBUTING.md) for commit guidelines

## Implementation Guidelines

For detailed implementation patterns and examples, see:

- **[TypeScript Standards](./typescript-standards.md)** - Type safety requirements
- **[Error Handling](./error-handling.md)** - Structured error detection patterns

## Example: @reasonabletech/utils Package

The utils package demonstrates these principles with comprehensive testing of Result types, datetime helpers, object utilities, retry logic, and string utilities.

## Compliance

All packages must meet these standards before being accepted into the monorepo.

**Remember**: 100% test coverage is non-negotiable. It ensures code reliability, prevents regressions, and maintains the high quality standards that make @reasonabletech/core-utils robust and trustworthy.
