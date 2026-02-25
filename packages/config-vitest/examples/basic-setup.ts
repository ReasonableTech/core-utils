/**
 * Basic Vitest Setup Example
 *
 * Demonstrates standard Vitest configuration for TypeScript projects
 * using the the platform base configuration with common customizations.
 */

import { createVitestConfig } from "../src/index.js";
import path from "path";

/**
 * Basic Vitest configuration that extends the platform base setup
 * Suitable for most TypeScript projects with standard testing needs
 */
export default createVitestConfig({
  // Resolve path aliases to match tsconfig.json
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
    },
  },

  test: {
    // Test environment (node is default, jsdom for browser APIs)
    environment: "node",

    // Global test APIs (describe, it, expect, etc.)
    globals: true,

    // Setup files to run before tests
    setupFiles: ["./vitest.setup.ts"],

    // Test file patterns
    include: [
      "src/**/*.{test,spec}.{js,ts,tsx}",
      "tests/**/*.{test,spec}.{js,ts,tsx}",
    ],

    // Files to exclude from testing
    exclude: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "**/*.d.ts",
      "**/*.config.*",
    ],

    // Test timeout (milliseconds)
    testTimeout: 5000,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",

      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },

      // Files to exclude from coverage
      exclude: [
        "coverage/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.*",
        "**/*.spec.*",
        "**/node_modules/**",
      ],
    },

    // Watch mode configuration (boolean or object)
    watch: false, // Disabled for CI environments

    // Reporter configuration
    reporters: ["default", "json", "html"],

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});

/**
 * Alternative configuration for stricter testing
 */
export const strictConfig = createVitestConfig({
  test: {
    globals: true,
    environment: "node",

    // Stricter settings
    bail: 1, // Stop on first test failure
    passWithNoTests: false, // Fail if no tests found

    // Higher coverage thresholds
    coverage: {
      provider: "v8",
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      // Fail if coverage is below thresholds
      skipFull: false,
    },

    // Concurrent testing disabled for debugging
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});

/**
 * Development-friendly configuration
 */
export const devConfig = createVitestConfig({
  test: {
    globals: true,
    environment: "node",

    // Development optimizations
    watch: true,
    ui: true, // Enable Vitest UI
    open: true, // Auto-open UI in browser

    // Faster feedback
    reporters: ["verbose"],

    // Less strict coverage for development
    coverage: {
      provider: "v8",
      enabled: false, // Disable by default in dev
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
  },
});

/**
 * Example test setup entrypoint (vitest.setup.ts)
 */
export const setupFileExample = `
// vitest.setup.ts
import "./tests/setup.js";

// tests/setup.ts
import { beforeEach, afterEach, vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Mock console methods to reduce noise
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks();
});

// Mock global APIs that might not be available in test environment
Object.defineProperty(global, 'fetch', {
  value: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })
  ),
  writable: true
});

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid',
    getRandomValues: (arr: any) => arr
  }
});
`;

/**
 * Example package.json scripts for basic testing setup
 */
export const packageScripts = {
  scripts: {
    // Basic test commands
    test: "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",

    // Coverage commands
    "test:coverage": "vitest --coverage",
    "test:coverage:ui": "vitest --coverage --ui",

    // Development commands
    "test:dev": "vitest --watch --ui --open",

    // CI commands
    "test:ci": "vitest run --coverage --reporter=json --reporter=default",

    // Specific test patterns
    "test:unit": "vitest run src/**/*.test.ts",
    "test:integration": "vitest run tests/integration/**/*.test.ts",
  },
};

/**
 * Example environment configuration for different test types
 */
export const environmentConfigs = {
  // Unit tests (default)
  unit: createVitestConfig({
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  }),

  // Integration tests
  integration: createVitestConfig({
    test: {
      environment: "node",
      include: ["tests/integration/**/*.test.ts"],
      testTimeout: 10000,
    },
  }),

  // Browser-like tests
  browser: createVitestConfig({
    test: {
      environment: "jsdom",
      include: ["src/**/*.browser.test.ts"],
    },
  }),
};

/**
 * Example VS Code settings for Vitest integration
 */
export const vscodeSettings = {
  "vitest.enable": true,
  "vitest.commandLine": "pnpm test",
  "testing.automaticallyOpenPeekView": "never",
  "typescript.preferences.includePackageJsonAutoImports": "on",
};
