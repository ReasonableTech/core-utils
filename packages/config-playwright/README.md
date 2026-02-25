# @reasonabletech/config-playwright

[![npm version](https://img.shields.io/npm/v/@reasonabletech/config-playwright.svg)](https://www.npmjs.com/package/@reasonabletech/config-playwright)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/config-playwright.svg)](https://www.npmjs.com/package/@reasonabletech/config-playwright)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/config-playwright` provides shared Playwright configuration factories for single-app and cross-app browser test suites. `createCrossAppConfig` is designed for suites that test across multiple running services, while `createPlaywrightConfig` handles the common single-app case.

## Installation

```bash
pnpm add -D @reasonabletech/config-playwright @playwright/test
```

## Peer Dependencies

| Dependency       | Version   | Required |
| ---------------- | --------- | -------- |
| @playwright/test | >= 1.40   | Yes      |
| lighthouse       | >= 10.0   | Optional |

This package provides Playwright configuration factories and requires @playwright/test 1.40+ for modern browser testing features. Install `lighthouse` if using the performance configuration exports.

## Exported Entry Points

| Import Path                                   | Purpose                          | Main Exports                                                                                                                       |
| --------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@reasonabletech/config-playwright`           | General Playwright defaults      | `createPlaywrightConfig`, `createCIConfig`, `createBaseConfig`, `createCrossAppConfig`                                             |
| `@reasonabletech/config-playwright/base`      | Single-app browser presets       | `createBaseConfig`, `createDesktopConfig`, `createMobileConfig`, `createChromiumConfig`                                            |
| `@reasonabletech/config-playwright/cross-app` | Cross-app and specialized suites | `createCrossAppConfig`, `createAccessibilityConfig`, `createPerformanceConfig`, `createAuthTestConfig`, `createAuthWorkflowConfig` |

## Usage

### Standard Project Configuration

```ts
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### CI-Oriented Configuration

```ts
// playwright.config.ts
import { createCIConfig } from "@reasonabletech/config-playwright";

export default createCIConfig({
  use: {
    baseURL: "https://staging.example.com",
  },
});
```

### Desktop-Only Configuration

```ts
// playwright.config.ts
import { createDesktopConfig } from "@reasonabletech/config-playwright/base";

export default createDesktopConfig();
```

### Cross-App Configuration

```ts
// playwright.config.ts
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

`createCrossAppConfig` uses `TEST_ENV` to select the active environment (`development` by default).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/README.md)
