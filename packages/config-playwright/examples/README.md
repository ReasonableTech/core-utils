# @reasonabletech/config-playwright Examples

This directory contains example Playwright configurations demonstrating various use cases for the `@reasonabletech/config-playwright` package.

## Examples Overview

### [basic-single-app.ts](./basic-single-app.ts)

A minimal configuration for testing a single web application. This is the best starting point for most projects.

**Use case:** Standard single-page applications or simple web apps that don't need cross-app testing.

**Key features demonstrated:**

- Basic `createPlaywrightConfig()` usage
- Setting a custom base URL
- Configuring a development server
- Overriding default timeout values

### [ci-configuration.ts](./ci-configuration.ts)

A configuration optimized for CI/CD pipeline environments like GitHub Actions, GitLab CI, or Jenkins.

**Use case:** Running E2E tests in automated build pipelines with optimized retry logic and artifact collection.

**Key features demonstrated:**

- Using `createCIConfig()` for CI-optimized settings
- Configuring multiple workers for parallel execution
- Retry strategies for flaky tests
- Artifact collection (traces, videos, screenshots)

### [cross-app-testing.ts](./cross-app-testing.ts)

A configuration for testing workflows that span multiple applications or services.

**Use case:** Testing authentication flows, cross-domain navigation, or multi-service integration scenarios.

**Key features demonstrated:**

- Using `createCrossAppConfig()` with environment-specific base URLs
- Environment configuration (development, staging, production)
- Cross-domain authentication workflows with `createAuthWorkflowConfig()`
- Authentication test configuration with `createAuthTestConfig()`

### [specialized-configs.ts](./specialized-configs.ts)

Configurations for specialized testing scenarios like accessibility audits and performance testing.

**Use case:** Dedicated test suites for accessibility compliance (WCAG) and performance metrics (Core Web Vitals).

**Key features demonstrated:**

- Using `createAccessibilityConfig()` for axe-core integration
- Using `createPerformanceConfig()` for Lighthouse integration
- Sequential test execution for accurate performance measurements
- Custom test directories for specialized test suites

## Usage

Copy the relevant example file to your project root as `playwright.config.ts` and modify it to fit your needs:

```bash
# Copy basic example
cp basic-single-app.ts ../../../your-app/playwright.config.ts

# Or for CI
cp ci-configuration.ts ../../../your-app/playwright.config.ts
```

## Package Exports

The package provides three entry points:

| Import Path                                | Description                             |
| ------------------------------------------ | --------------------------------------- |
| `@reasonabletech/config-playwright`        | Main exports including all config types |
| `@reasonabletech/config-playwright/base`   | Base browser configurations             |
| `@reasonabletech/config-playwright/cross-app` | Cross-app testing utilities          |

## Common Customizations

### Setting a custom base URL

```typescript
createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### Configuring a development server

```typescript
createPlaywrightConfig({
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Adding custom projects/browsers

```typescript
createPlaywrightConfig({
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```
