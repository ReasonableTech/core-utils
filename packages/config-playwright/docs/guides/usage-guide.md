# @reasonabletech/config-playwright Usage Guide

This guide covers the canonical setup patterns for `@reasonabletech/config-playwright` in greenfield projects.

## Installation

```bash
pnpm add -D @reasonabletech/config-playwright @playwright/test
```

## Quick Start

```ts
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

## Core Config Factories

### Standard Configuration

```ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig();
```

### CI Configuration

```ts
import { createCIConfig } from "@reasonabletech/config-playwright";

export default createCIConfig({
  use: {
    baseURL: "https://staging.example.com",
  },
});
```

### Single-App Presets

```ts
import {
  createChromiumConfig,
  createDesktopConfig,
  createMobileConfig,
} from "@reasonabletech/config-playwright/base";

export default createDesktopConfig();
```

## Cross-App Workflows

`createCrossAppConfig` selects environment settings from `process.env.TEST_ENV` (default: `development`).

```ts
import { createCrossAppConfig } from "@reasonabletech/config-playwright/cross-app";

const environments = {
  development: {
    baseUrls: {
      app: "http://localhost:3000",
      admin: "http://localhost:3001",
    },
    services: {
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },
  staging: {
    baseUrls: {
      app: "https://staging.example.com",
      admin: "https://admin-staging.example.com",
    },
    services: {
      useRealServices: true,
      mockExternalAPIs: false,
    },
  },
} as const;

export default createCrossAppConfig({ environments });
```

## Generated Outputs

Default artifact locations:

- `generated/playwright/reports`
- `generated/playwright/results.json`
- `generated/playwright/test-results`

## Troubleshooting

### Unknown test environment

If `TEST_ENV` points to an environment key that is missing from your map, `createCrossAppConfig` throws. Ensure your environment map contains all expected deployment keys.

### Local server startup

The base config starts `pnpm dev` outside CI. Override `webServer` if your app uses a different startup command.

## Related Documentation

- [Package README](../../README.md)
