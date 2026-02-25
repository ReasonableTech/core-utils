# config-vitest API Reference

## Package Exports

### Main Entry Point (`@reasonabletech/config-vitest`)

```typescript
import {
  createVitestConfig,
  createLongRunningTestConfig,
  createReactConfig,
  createReactConfigWithPlugins,
  baseConfig,
} from "@reasonabletech/config-vitest";

import type {
  VitestConfig,
  DeepReadonly,
} from "@reasonabletech/config-vitest";
```

### Node Entry Point (`@reasonabletech/config-vitest/node`)

```typescript
import { createNodeConfig, nodeConfig } from "@reasonabletech/config-vitest/node";

import type { VitestConfig } from "@reasonabletech/config-vitest/node";
```

### React Entry Point (`@reasonabletech/config-vitest/react`)

```typescript
import {
  createReactConfig,
  createReactConfigWithPlugins,
  reactConfig,
} from "@reasonabletech/config-vitest/react";
```

---

## Factory Functions

### `createVitestConfig()`

Creates a base Vitest configuration with sensible defaults, auto-detection of setup files, and workspace alias support.

**Signatures:**

```typescript
// With project directory for automatic aliasing
function createVitestConfig(
  projectDir: string,
  customConfig?: VitestConfig
): ReturnType<typeof defineConfig>;

// With config object only
function createVitestConfig(
  config?: VitestConfig
): ReturnType<typeof defineConfig>;
```

**Parameters:**

| Parameter      | Type            | Description                                                                                |
| -------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `projectDir`   | `string`        | Absolute path to project root (use `import.meta.dirname`). Enables self-package aliasing. |
| `customConfig` | `VitestConfig`  | Additional configuration to merge                                                          |

**Returns:** Vite/Vitest config object

**Auto-Detection Features:**

- **Setup files:** Detects `vitest.setup.ts` or `tests/setup.ts`
- **Include patterns:** Defaults to `tests/**/*.test.{ts,tsx,js,jsx}`
- **Self-package alias:** Maps package name to `src/` directory
- **@ alias:** Maps `@` to `src/` directory

---

### `createLongRunningTestConfig()`

Creates a configuration with extended timeouts for integration tests or slow test suites.

**Signatures:**

```typescript
function createLongRunningTestConfig(
  projectDir: string,
  customConfig?: VitestConfig
): ReturnType<typeof defineConfig>;

function createLongRunningTestConfig(
  config?: VitestConfig
): ReturnType<typeof defineConfig>;
```

**Extended Timeouts:**

| Setting       | Default | Long-Running |
| ------------- | ------- | ------------ |
| `testTimeout` | 10,000ms | 30,000ms     |
| `hookTimeout` | 10,000ms | 30,000ms     |

---

### `createNodeConfig()`

Creates a Vitest configuration optimized for Node.js environments.

**Signatures:**

```typescript
function createNodeConfig(
  projectDir: string,
  customConfig?: VitestConfig
): ReturnType<typeof defineConfig>;

function createNodeConfig(
  config?: VitestConfig
): ReturnType<typeof defineConfig>;
```

**Node-Specific Settings:**

```typescript
{
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  }
}
```

---

### `createReactConfig()`

Creates a Vitest configuration for React component testing with jsdom and the React plugin.

**Signatures:**

```typescript
function createReactConfig(
  projectDir: string,
  customConfig?: VitestConfig
): ReturnType<typeof defineConfig>;

function createReactConfig(
  config?: VitestConfig
): ReturnType<typeof defineConfig>;
```

**Includes:**

- `@vitejs/plugin-react` for JSX/TSX support
- jsdom environment
- React deduplication for singleton enforcement
- Extended coverage exclusions for React patterns

---

### `createReactConfigWithPlugins()`

Creates a React Vitest configuration with custom Vite plugins.

**Signature:**

```typescript
function createReactConfigWithPlugins(
  plugins: readonly PluginOption[],
  projectDir: string,
  customConfig?: VitestConfig
): ReturnType<typeof defineConfig>;

function createReactConfigWithPlugins(
  plugins: readonly PluginOption[],
  config?: VitestConfig
): ReturnType<typeof defineConfig>;
```

**Parameters:**

| Parameter      | Type                    | Description                    |
| -------------- | ----------------------- | ------------------------------ |
| `plugins`      | `readonly PluginOption[]` | Array of Vite plugins to include |
| `projectDir`   | `string`                | Absolute path to project root  |
| `customConfig` | `VitestConfig`          | Additional configuration       |

---

## Configuration Types

### `VitestConfig`

Immutable configuration object for Vitest.

```typescript
type VitestConfig = DeepReadonly<{
  test?: InlineConfig;
  resolve?: {
    conditions?: string[];
    alias?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}>;
```

### `DeepReadonly<T>`

Utility type that recursively makes all properties readonly.

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends Array<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};
```

---

## Preset Configurations

### `baseConfig`

Base configuration applied to all environments.

```typescript
const baseConfig = {
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./generated/test-coverage",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/tests/**",
        "**/*.d.ts",
        "**/*.config.{js,ts,mjs,mts}",
        "**/coverage/**",
        "**/examples/**",
        "**/src/index.ts",
        "**/src/*/index.ts",
        "**/src/types/**",
        "tsup.config.ts",
        "vitest.config.mts",
        "tailwind.config.mjs",
        "**/vitest.setup.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
};
```

**Note:** Coverage thresholds default to 100%. Set `VITEST_COVERAGE_THRESHOLDS_DISABLED=true` to disable.

### `nodeConfig`

Node.js-specific defaults (from `@reasonabletech/config-vitest/node`).

```typescript
const nodeConfig = {
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
};
```

### `reactConfig`

React-specific defaults (from `@reasonabletech/config-vitest/react`).

```typescript
const reactConfig = {
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**"],
    silent: false,
  },
};
```

---

## Default Options Reference

### Base Configuration Defaults

| Option                      | Default Value                          |
| --------------------------- | -------------------------------------- |
| `test.testTimeout`          | `10000` (10 seconds)                   |
| `test.hookTimeout`          | `10000` (10 seconds)                   |
| `test.coverage.provider`    | `"v8"`                                 |
| `test.coverage.thresholds`  | `100%` for all metrics                 |

### Resolve Conditions

The configuration adds `"source"` to resolve conditions, allowing Vitest to resolve workspace dependencies directly to TypeScript source without requiring a prior build.

```typescript
resolve: {
  conditions: ["source", ...defaultClientConditions],
}
```

### SSR Configuration

For proper SSR test resolution:

```typescript
ssr: {
  resolve: {
    conditions: ["source", ...defaultServerConditions],
    externalConditions: ["source"],
  },
}
```

---

## Usage Examples

### Basic Node.js Package

```typescript
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

### Node.js with Custom Settings

```typescript
// vitest.config.mts
import { createNodeConfig } from "@reasonabletech/config-vitest/node";

export default createNodeConfig(import.meta.dirname, {
  test: {
    testTimeout: 30000,
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### React Component Library

```typescript
// vitest.config.mts
import { createReactConfig } from "@reasonabletech/config-vitest";

export default createReactConfig(import.meta.dirname);
```

### React with Custom Plugins

```typescript
// vitest.config.mts
import { createReactConfigWithPlugins } from "@reasonabletech/config-vitest";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default createReactConfigWithPlugins(
  [react(), svgr()],
  import.meta.dirname,
);
```

### Long-Running Integration Tests

```typescript
// vitest.config.mts
import { createLongRunningTestConfig } from "@reasonabletech/config-vitest";

export default createLongRunningTestConfig(import.meta.dirname, {
  test: {
    include: ["tests/integration/**/*.test.ts"],
  },
});
```

### Custom Coverage Thresholds

```typescript
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname, {
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Custom Aliases

```typescript
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname, {
  resolve: {
    alias: {
      "@components": `${import.meta.dirname}/src/components`,
      "@utils": `${import.meta.dirname}/src/utils`,
    },
  },
});
```

### Without Project Directory

```typescript
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig({
  test: {
    include: ["src/**/*.test.ts"],
    setupFiles: ["./test-setup.ts"],
  },
});
```

---

## Environment Variables

| Variable                             | Effect                                    |
| ------------------------------------ | ----------------------------------------- |
| `VITEST_COVERAGE_THRESHOLDS_DISABLED` | When `"true"`, sets all thresholds to 0% |

---

## Related Documentation

- [Base Configuration](./base-config.md) — Detailed base config reference
- [Usage Guide](../guides/usage-guide.md) — Setup and patterns
- [Package README](../../README.md) — Quick start
