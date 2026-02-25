# @reasonabletech/config-vitest Examples

This directory contains examples demonstrating how to use the Vitest configurations for different testing scenarios and project types.

## Examples Overview

### 🧪 Test Configurations

- **[Basic Setup](./basic-setup.ts)** - Standard Vitest configuration
- **[React Testing](./react-testing.ts)** - React component testing setup
- **[Node.js Testing](./node-testing.ts)** - Server-side testing configuration
- **[Integration Testing](./integration-testing.ts)** - Full-stack integration tests

## Quick Start

### Installation

```bash
pnpm install --save-dev @reasonabletech/config-vitest
```

### Basic Usage

Create a `vitest.config.ts` file in your project root:

```ts
import { defineConfig } from "vitest/config";
import { base } from "@reasonabletech/config-vitest";

export default defineConfig({
  ...base,
  test: {
    // Your custom test options
  },
});
```

## Available Configurations

### Base Configuration

Foundation setup for all Vitest projects:

```ts
import { base } from "@reasonabletech/config-vitest";

export default defineConfig(base);
```

**Features:**

- TypeScript support
- Path mapping resolution
- Coverage reporting setup
- Watch mode configuration

### React Configuration

Optimized for React component testing:

```ts
import { react } from "@reasonabletech/config-vitest";

export default defineConfig(react);
```

**Features:**

- JSDOM environment
- React Testing Library integration
- JSX support
- Component test utilities

### Node.js Configuration

For server-side testing:

```ts
import { node } from "@reasonabletech/config-vitest";

export default defineConfig(node);
```

**Features:**

- Node.js environment
- Built-in mocking capabilities
- API testing utilities
- Database testing support

## Configuration Examples

### Custom Test Environment

```ts
import { defineConfig } from "vitest/config";
import { base } from "@reasonabletech/config-vitest";

export default defineConfig({
  ...base,
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,

    // Custom test patterns
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["node_modules", "dist", "build"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["coverage/**", "dist/**", "**/*.d.ts", "**/*.config.*"],
    },
  },
});
```

### Workspace Configuration

For monorepo testing:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // Unit tests
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      include: ["src/**/*.{test,spec}.ts"],
    },
  },

  // Integration tests
  {
    extends: "./vitest.config.ts",
    test: {
      name: "integration",
      include: ["tests/integration/**/*.test.ts"],
      timeout: 10000,
    },
  },

  // E2E tests
  {
    extends: "./vitest.config.ts",
    test: {
      name: "e2e",
      include: ["tests/e2e/**/*.test.ts"],
      timeout: 30000,
    },
  },
]);
```

### Browser Testing

For browser environment testing:

```ts
import { defineConfig } from "vitest/config";
import { base } from "@reasonabletech/config-vitest";

export default defineConfig({
  ...base,
  test: {
    browser: {
      enabled: true,
      name: "chrome",
      provider: "webdriverio",
    },
  },
});
```

## Testing Patterns

### Component Testing

```ts
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Testing

```ts
// useCounter.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

### API Testing

```ts
// api.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { fetchUser } from "./api";

const server = setupServer(
  rest.get("/api/users/:id", (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        name: "John Doe",
        email: "john@example.com",
      }),
    );
  }),
);

describe("API", () => {
  beforeEach(() => server.listen());
  afterEach(() => server.resetHandlers());

  it("fetches user data", async () => {
    const user = await fetchUser("123");

    expect(user).toEqual({
      id: "123",
      name: "John Doe",
      email: "john@example.com",
    });
  });

  it("handles fetch errors", async () => {
    server.use(
      rest.get("/api/users/:id", (req, res, ctx) => {
        return res(ctx.status(404));
      }),
    );

    await expect(fetchUser("999")).rejects.toThrow("User not found");
  });
});
```

### Database Testing

```ts
// database.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDatabase, clearDatabase } from "./test-utils";
import { UserRepository } from "./UserRepository";

describe("UserRepository", () => {
  let db: TestDatabase;
  let userRepo: UserRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    userRepo = new UserRepository(db);
  });

  afterEach(async () => {
    await clearDatabase(db);
    await db.close();
  });

  it("creates a user", async () => {
    const userData = {
      name: "Jane Doe",
      email: "jane@example.com",
    };

    const user = await userRepo.create(userData);

    expect(user.id).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });

  it("finds user by email", async () => {
    const userData = {
      name: "Jane Doe",
      email: "jane@example.com",
    };

    await userRepo.create(userData);
    const found = await userRepo.findByEmail("jane@example.com");

    expect(found).toBeDefined();
    expect(found?.name).toBe("Jane Doe");
  });
});
```

## Setup Files

### React Testing Setup

```ts
// vitest.setup.ts
import "./tests/setup.js";

// tests/setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

### MSW Setup

```ts
// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// vitest.setup.ts
import "./tests/setup.js";

// tests/setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Package Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:reporter": "vitest --reporter=verbose"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Performance Testing

```ts
// performance.test.ts
import { describe, it, expect } from "vitest";
import { performance } from "perf_hooks";

describe("Performance Tests", () => {
  it("function completes within time limit", () => {
    const start = performance.now();

    // Your function to test
    const result = expensiveOperation();

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    expect(result).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

**TypeScript path mapping not working:**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**ESM import issues:**

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    transformMode: {
      web: [/\.tsx?$/],
    },
  },
});
```

## Running Examples

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific test file
pnpm exec vitest src/components/Button.test.tsx

# Run with coverage
pnpm test:coverage

# Run in UI mode
pnpm test:ui
```
