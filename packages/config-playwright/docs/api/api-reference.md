# config-playwright API Reference

## Package Exports

### Main Entry Point (`@reasonabletech/config-playwright`)

```typescript
import {
  createPlaywrightConfig,
  createCIConfig,
  createCrossAppConfig,
  createBaseConfig,
  baseConfig,
} from "@reasonabletech/config-playwright";

import type {
  PlaywrightConfig,
  DeepReadonly,
  TestEnvironmentConfig,
  TestEnvironmentServices,
} from "@reasonabletech/config-playwright";
```

### Base Entry Point (`@reasonabletech/config-playwright/base`)

```typescript
import {
  createBaseConfig,
  createDesktopConfig,
  createMobileConfig,
  createChromiumConfig,
  desktopConfig,
  mobileConfig,
  chromiumOnlyConfig,
} from "@reasonabletech/config-playwright/base";
```

### Cross-App Entry Point (`@reasonabletech/config-playwright/cross-app`)

```typescript
import {
  createCrossAppConfig,
  createAccessibilityConfig,
  createPerformanceConfig,
  createAuthTestConfig,
  createAuthWorkflowConfig,
  crossAppConfig,
  accessibilityConfig,
  performanceConfig,
} from "@reasonabletech/config-playwright/cross-app";

import type {
  CrossAppConfigOptions,
  AuthWorkflowOptions,
  AuthWorkflowConfig,
} from "@reasonabletech/config-playwright/cross-app";
```

---

## Main Factory Functions

### `createPlaywrightConfig()`

Creates a merged Playwright configuration from the base config and custom options.

**Signature:**

```typescript
function createPlaywrightConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Parameters:**

| Parameter      | Type               | Default | Description               |
| -------------- | ------------------ | ------- | ------------------------- |
| `customConfig` | `PlaywrightConfig` | `{}`    | Custom configuration      |

**Returns:** `PlaywrightTestConfig`

---

### `createCIConfig()`

Creates a configuration optimized for CI/CD environments with parallel execution and artifact retention.

**Signature:**

```typescript
function createCIConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**CI-Specific Settings:**

| Setting       | Value                  |
| ------------- | ---------------------- |
| `fullyParallel` | `true`               |
| `retries`     | `3`                    |
| `workers`     | `4`                    |
| `trace`       | `"retain-on-failure"`  |
| `video`       | `"retain-on-failure"`  |
| `screenshot`  | `"only-on-failure"`    |

---

## Base Configuration Functions

### `createBaseConfig()`

Creates a base configuration for single-app testing.

**Signature:**

```typescript
function createBaseConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Includes:**

- All base config defaults
- `storageState: undefined` (no cross-app auth state)

---

### `createDesktopConfig()`

Creates a desktop-only configuration for faster testing cycles.

**Signature:**

```typescript
function createDesktopConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Browser Projects:**

- `chromium` (Desktop Chrome)
- `firefox` (Desktop Firefox)
- `webkit` (Desktop Safari)

---

### `createMobileConfig()`

Creates a mobile-only configuration for mobile-specific testing.

**Signature:**

```typescript
function createMobileConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Device Projects:**

- `Mobile Chrome` (Pixel 5)
- `Mobile Safari` (iPhone 12)

---

### `createChromiumConfig()`

Creates a Chromium-only configuration for fast development iteration.

**Signature:**

```typescript
function createChromiumConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Settings:**

- Single Chromium browser
- `workers: 1` for consistent debugging

---

## Cross-App Functions

### `createCrossAppConfig()`

Creates a Playwright configuration for testing workflows that span multiple applications.

**Signature:**

```typescript
function createCrossAppConfig(
  options: CrossAppConfigOptions
): PlaywrightTestConfig;
```

**Parameters:**

```typescript
interface CrossAppConfigOptions {
  environments: Record<string, TestEnvironmentConfig | undefined>;
  customConfig?: PlaywrightConfig;
}

interface TestEnvironmentConfig {
  baseUrls: Record<string, string>;
  services: TestEnvironmentServices;
  smokeTestsOnly?: boolean;
}

interface TestEnvironmentServices {
  useRealServices: boolean;
  mockExternalAPIs: boolean;
}
```

**Environment Selection:** Uses `TEST_ENV` environment variable, defaults to `"development"`.

**Cross-App Specific Settings:**

| Setting             | Value                                       |
| ------------------- | ------------------------------------------- |
| `testDir`           | `"./tests/acceptance/cross-app"`            |
| `actionTimeout`     | `10000` (10 seconds)                        |
| `navigationTimeout` | `15000` (15 seconds)                        |
| `video`             | `"retain-on-failure"`                       |
| `trace`             | `"retain-on-failure"`                       |
| `viewport`          | `{ width: 1920, height: 1080 }`             |

---

### `createAccessibilityConfig()`

Creates a configuration for accessibility testing with axe-core.

**Signature:**

```typescript
function createAccessibilityConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Accessibility-Specific Settings:**

| Setting             | Value                                |
| ------------------- | ------------------------------------ |
| `testDir`           | `"./tests/acceptance/accessibility"` |
| `actionTimeout`     | `15000` (15 seconds)                 |
| `navigationTimeout` | `20000` (20 seconds)                 |
| `viewport`          | `{ width: 1280, height: 720 }`       |

---

### `createPerformanceConfig()`

Creates a configuration for performance testing with Lighthouse integration.

**Signature:**

```typescript
function createPerformanceConfig(
  customConfig?: PlaywrightConfig
): PlaywrightTestConfig;
```

**Performance-Specific Settings:**

| Setting             | Value                                |
| ------------------- | ------------------------------------ |
| `testDir`           | `"./tests/acceptance/performance"`   |
| `fullyParallel`     | `false` (sequential for accuracy)    |
| `workers`           | `1`                                  |
| `actionTimeout`     | `30000` (30 seconds)                 |
| `navigationTimeout` | `45000` (45 seconds)                 |
| `video`             | `"off"`                              |
| `screenshot`        | `"off"`                              |
| `trace`             | `"off"`                              |

---

### `createAuthTestConfig()`

Creates a configuration optimized for authentication workflow testing.

**Signature:**

```typescript
function createAuthTestConfig(
  options: CrossAppConfigOptions
): PlaywrightTestConfig;
```

**Auth Test Settings:**

- `testDir: "./tests/acceptance/auth"`
- `storageState: undefined` (starts unauthenticated)

---

### `createAuthWorkflowConfig()`

Creates a cross-domain authentication configuration object (not a Playwright config).

**Signature:**

```typescript
function createAuthWorkflowConfig(
  options: AuthWorkflowOptions
): AuthWorkflowConfig;
```

**Parameters:**

```typescript
interface AuthWorkflowOptions {
  domain: string;                    // Cookie domain (e.g., ".example.com")
  expectedPersistence: readonly string[];  // Subdomains for persistence
}
```

**Returns:**

```typescript
interface AuthWorkflowConfig {
  cookieConfig: {
    domain: string;
    secure: true;
    httpOnly: true;
    sameSite: "lax";
  };
  expectedPersistence: readonly string[];
}
```

---

## Configuration Types

### `PlaywrightConfig`

Immutable Playwright configuration type.

```typescript
type PlaywrightConfig = DeepReadonly<PlaywrightTestConfig>;
```

### `DeepReadonly<T>`

Utility type for immutable configuration objects.

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

Base configuration applied to all test types.

```typescript
const baseConfig: PlaywrightTestConfig = {
  testDir: "./tests/acceptance",
  testMatch: "**/*.{test,spec}.{ts,js}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: [
    ["html", { outputFolder: "./generated/playwright/reports" }],
    ["json", { outputFile: "./generated/playwright/results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],
  outputDir: "./generated/playwright/test-results",
  use: {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    storageState: undefined,
  },
  projects: [/* Dynamic based on CI */],
  webServer: process.env.CI ? undefined : {
    command: "pnpm dev",
    reuseExistingServer: true,
    timeout: 120000,
  },
};
```

### `desktopConfig`

Desktop browser matrix.

```typescript
const desktopConfig = {
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
};
```

### `mobileConfig`

Mobile device matrix.

```typescript
const mobileConfig = {
  projects: [
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],
};
```

### `chromiumOnlyConfig`

Single-browser development config.

```typescript
const chromiumOnlyConfig = {
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
};
```

---

## Default Options Reference

### Base Configuration Defaults

| Option               | Local Dev          | CI                      |
| -------------------- | ------------------ | ----------------------- |
| `fullyParallel`      | `true`             | `true`                  |
| `retries`            | `0`                | `2`                     |
| `workers`            | `undefined` (auto) | `4`                     |
| `forbidOnly`         | `false`            | `true`                  |
| `projects`           | Chromium only      | Full browser + devices  |
| `webServer`          | `pnpm dev`         | `undefined`             |
| `reporter`           | `["list"]`         | `["github"]`            |

### Timeout Defaults

| Timeout              | Value     |
| -------------------- | --------- |
| `timeout` (test)     | 30 seconds |
| `expect.timeout`     | 5 seconds  |
| `actionTimeout`      | 10 seconds |
| `navigationTimeout`  | 30 seconds |
| `webServer.timeout`  | 120 seconds |

---

## Usage Examples

### Basic Single-App Testing

```typescript
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig();
```

### Custom Base URL

```typescript
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Desktop-Only Testing

```typescript
// playwright.config.ts
import { createDesktopConfig } from "@reasonabletech/config-playwright/base";

export default createDesktopConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Mobile-Only Testing

```typescript
// playwright.config.ts
import { createMobileConfig } from "@reasonabletech/config-playwright/base";

export default createMobileConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Fast Development Testing

```typescript
// playwright.config.ts
import { createChromiumConfig } from "@reasonabletech/config-playwright/base";

export default createChromiumConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### CI/CD Pipeline

```typescript
// playwright.config.ts
import { createCIConfig } from "@reasonabletech/config-playwright";

export default createCIConfig({
  use: {
    baseURL: process.env.BASE_URL,
  },
});
```

### Cross-App Workflow Testing

```typescript
// playwright.config.ts
import { createCrossAppConfig } from "@reasonabletech/config-playwright/cross-app";

const environments = {
  development: {
    baseUrls: {
      landing: "http://localhost:3000",
      app: "http://localhost:3001",
      admin: "http://localhost:3002",
    },
    services: {
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },
  staging: {
    baseUrls: {
      landing: "https://staging.example.com",
      app: "https://app.staging.example.com",
      admin: "https://admin.staging.example.com",
    },
    services: {
      useRealServices: true,
      mockExternalAPIs: false,
    },
  },
};

export default createCrossAppConfig({ environments });
```

### Accessibility Testing

```typescript
// playwright.config.ts
import { createAccessibilityConfig } from "@reasonabletech/config-playwright/cross-app";

export default createAccessibilityConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Performance Testing

```typescript
// playwright.config.ts
import { createPerformanceConfig } from "@reasonabletech/config-playwright/cross-app";

export default createPerformanceConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Authentication Flow Testing

```typescript
// playwright.config.ts
import { createAuthTestConfig } from "@reasonabletech/config-playwright/cross-app";

const environments = {
  development: {
    baseUrls: {
      auth: "http://localhost:4000",
      app: "http://localhost:3000",
    },
    services: {
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },
};

export default createAuthTestConfig({ environments });
```

### Cross-Domain Cookie Configuration

```typescript
// tests/helpers/auth.ts
import { createAuthWorkflowConfig } from "@reasonabletech/config-playwright/cross-app";

export const authConfig = createAuthWorkflowConfig({
  domain: ".example.com",
  expectedPersistence: [
    "accounts.example.com",
    "app.example.com",
    "admin.example.com",
  ],
});

// Use in tests:
// expect(authConfig.cookieConfig.secure).toBe(true);
// await expect(page).toHaveURL(authConfig.expectedPersistence[1]);
```

### Custom Project Matrix

```typescript
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";
import { devices } from "@playwright/test";

export default createPlaywrightConfig({
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "edge", use: { ...devices["Desktop Edge"] } },
    { name: "tablet", use: { ...devices["iPad Mini"] } },
  ],
});
```

---

## Environment Variables

| Variable    | Effect                                          |
| ----------- | ----------------------------------------------- |
| `CI`        | Enables CI mode (retries, full browser matrix)  |
| `TEST_ENV`  | Selects environment for cross-app configs       |

---

## Related Documentation

- [Usage Guide](../guides/usage-guide.md) — Setup and patterns
- [Package README](../../README.md) — Quick start
