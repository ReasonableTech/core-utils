# Base Configuration API Reference

The base Vitest configuration provides common settings for all testing environments in the the ecosystem.

## Usage

### Basic Usage

```typescript
// vitest.config.ts
import { baseConfig } from "@reasonabletech/config-vitest";

export default baseConfig;
```

### Extended Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { baseConfig } from "@reasonabletech/config-vitest";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // Override or extend settings
    timeout: 30000,
    globals: true,
  },
});
```

## Configuration Options

### Test Settings

```typescript
interface TestConfig {
  // Test discovery
  include: string[];
  exclude: string[];

  // Test execution
  timeout: number;
  hookTimeout: number;
  testTimeout: number;

  // Environment
  environment: "node" | "jsdom" | "happy-dom";
  globals: boolean;

  // Coverage
  coverage: CoverageConfig;

  // Reporters
  reporter: string[];
  outputFile: Record<string, string>;

  // Setup
  setupFiles: string[];
  globalSetup: string[];
}
```

### Default Values

```typescript
const defaultConfig = {
  test: {
    // Test discovery
    include: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
      "**/tests/**/*.{ts,tsx,js,jsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/.vercel/**",
    ],

    // Test execution
    timeout: 10000,
    hookTimeout: 10000,
    testTimeout: 5000,

    // Environment
    environment: "node",
    globals: false,

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.*",
        "**/*.test.*",
        "**/coverage/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Reporters
    reporter: ["default", "json", "html"],
    outputFile: {
      json: "./coverage/results.json",
      html: "./coverage/index.html",
    },

    // Setup
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
  },
};
```

## Environment Configuration

### Node Environment

```typescript
const nodeConfig = {
  test: {
    environment: "node",
    // Node-specific settings
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
};
```

### Browser Environment

```typescript
const browserConfig = {
  test: {
    environment: "jsdom",
    // Browser-specific settings
    setupFiles: ["./tests/setup-jsdom.ts"],
    environmentOptions: {
      jsdom: {
        resources: "usable",
        url: "http://localhost:3000",
      },
    },
  },
};
```

## Coverage Configuration

### Default Coverage

```typescript
const coverageConfig = {
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html", "lcov"],
    reportsDirectory: "./coverage",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.config.*",
      "**/*.test.*",
      "**/coverage/**",
      "**/.next/**",
      "**/build/**",
    ],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    skipFull: true,
    clean: true,
  },
};
```

### Custom Coverage

```typescript
const customCoverageConfig = {
  coverage: {
    provider: "istanbul",
    reporter: ["text", "cobertura"],
    reportsDirectory: "./reports/coverage",
    thresholds: {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      "./src/core/**": {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
};
```

## Reporter Configuration

### Default Reporters

```typescript
const reporterConfig = {
  reporter: ["default", "json", "html"],
  outputFile: {
    json: "./test-results.json",
    html: "./test-results.html",
  },
};
```

### Custom Reporters

```typescript
const customReporterConfig = {
  reporter: [
    "default",
    "json",
    "junit",
    ["html", { outputFile: "./reports/test-results.html" }],
  ],
  outputFile: {
    json: "./reports/results.json",
    junit: "./reports/junit.xml",
  },
};
```

## Setup Files

### Test Setup

```typescript
// vitest.setup.ts
import "./tests/setup.js";

// tests/setup.ts
import { vi } from "vitest";
import { beforeEach, afterEach } from "vitest";

// Global test setup
beforeEach(() => {
  // Setup before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.resetAllMocks();
});

// Mock global objects
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Global Setup

```typescript
// tests/global-setup.ts
import { GlobalSetupContext } from "vitest/node";

export default function globalSetup({ provide }: GlobalSetupContext) {
  // Global setup logic
  console.log("Running global setup...");

  // Provide values to tests
  provide("testApiUrl", "http://localhost:3001");

  // Return cleanup function
  return () => {
    console.log("Running global teardown...");
  };
}
```

## TypeScript Configuration

### Type Definitions

```typescript
/// <reference types="vitest" />
/// <reference types="vite/client" />

declare module "vitest" {
  interface TestContext {
    // Custom test context
    testApiUrl: string;
  }
}
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "vitest/importMeta"]
  },
  "include": ["src/**/*", "tests/**/*", "vitest.config.ts"]
}
```

## Performance Optimization

### Parallel Execution

```typescript
const performanceConfig = {
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
        singleThread: false,
      },
    },
  },
};
```

### File Processing

```typescript
const optimizedConfig = {
  test: {
    // Optimize file processing
    cache: {
      dir: "./node_modules/.vitest",
    },

    // Optimize test discovery
    passWithNoTests: true,

    // Optimize coverage
    coverage: {
      skipFull: true,
      clean: true,
    },
  },
};
```

## Debugging Configuration

### Debug Mode

```typescript
const debugConfig = {
  test: {
    // Enable debugging
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Increase timeouts for debugging
    timeout: 0,
    hookTimeout: 0,
    testTimeout: 0,
  },
};
```

### Verbose Output

```typescript
const verboseConfig = {
  test: {
    reporter: ["verbose", "json"],
    logHeapUsage: true,
    silent: false,
  },
};
```

## Common Patterns

### Configuration Factory

```typescript
export function createTestConfig(options: TestConfigOptions = {}) {
  return defineConfig({
    ...baseConfig,
    test: {
      ...baseConfig.test,
      ...options,
      coverage: {
        ...baseConfig.test.coverage,
        ...options.coverage,
      },
    },
  });
}
```

### Environment-Specific Config

```typescript
export function createEnvironmentConfig(env: "node" | "jsdom" | "happy-dom") {
  const environmentConfigs = {
    node: nodeConfig,
    jsdom: browserConfig,
    "happy-dom": browserConfig,
  };

  return defineConfig({
    ...baseConfig,
    test: {
      ...baseConfig.test,
      ...environmentConfigs[env],
    },
  });
}
```

### Testing Utilities

```typescript
export const testUtils = {
  // Create test server
  createTestServer: () => {
    // Test server implementation
  },

  // Create test database
  createTestDatabase: () => {
    // Test database implementation
  },

  // Common test fixtures
  fixtures: {
    user: () => ({ id: "1", name: "Test User" }),
    post: () => ({ id: "1", title: "Test Post" }),
  },
};
```

## Integration Examples

### Monorepo Configuration

```typescript
// packages/shared/vitest.config.ts
import { defineConfig } from "vitest/config";
import { baseConfig } from "@reasonabletech/config-vitest";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // Package-specific settings
    environment: "node",
    coverage: {
      ...baseConfig.test.coverage,
      include: ["src/**/*"],
    },
  },
});
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test
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

## Best Practices

1. **Use consistent configuration** across all packages
2. **Set appropriate timeouts** for different test types
3. **Configure coverage thresholds** to maintain quality
4. **Use setup files** for common test initialization
5. **Optimize performance** with appropriate pool settings
6. **Enable debugging** when needed with single-threaded execution
7. **Use TypeScript** for better configuration validation

## See Also

- [Node Configuration](./node-config.md) - Node.js specific settings
- [React Configuration](./react-config.md) - React testing configuration
- [Testing Strategies](../guides/testing-strategies.md) - Testing best practices
