/**
 * Base Playwright configuration for all applications
 * @module @reasonabletech/config-playwright
 */

import { type PlaywrightTestConfig, devices } from "@playwright/test";

/**
 * Recursively makes all properties of `T` readonly.
 *
 * Useful for configuration objects defined with `as const`, ensuring callers
 * don't accidentally mutate shared config.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends Array<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

/**
 * Immutable Playwright config type accepted by config helpers.
 */
export type PlaywrightConfig = DeepReadonly<PlaywrightTestConfig>;

// Empty readonly config for default parameters
const EMPTY_CONFIG = {} as const satisfies PlaywrightConfig;

/**
 * Service configuration for a test environment.
 */
export interface TestEnvironmentServices {
  /** Whether to use real backend services instead of mocks. */
  useRealServices: boolean;
  /** Whether to mock external (third-party) API calls. */
  mockExternalAPIs: boolean;
}

/**
 * Configuration for a single test environment (e.g. development, staging, production).
 *
 * Consumers define their own environment map and pass it to helpers like
 * {@link createCrossAppConfig} in `cross-app.ts`.
 */
export interface TestEnvironmentConfig {
  /** Map of application names to their base URLs. */
  baseUrls: Record<string, string>;
  /** Service-layer settings for this environment. */
  services: TestEnvironmentServices;
  /** When true, only smoke tests should run (e.g. in production). */
  smokeTestsOnly?: boolean;
}

/**
 * Base configuration options that apply to all acceptance test environments
 */
export const baseConfig: PlaywrightTestConfig = {
  // Test discovery and execution
  testDir: "./tests/acceptance",
  testMatch: "**/*.{test,spec}.{ts,js}",

  // Global test settings
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI !== undefined ? 2 : 0,
  workers: process.env.CI !== undefined ? 4 : undefined,

  // Test execution timeouts
  timeout: 30 * 1000, // 30 seconds for individual tests
  expect: {
    timeout: 5 * 1000, // 5 seconds for assertions
  },

  // Reporter configuration for different environments
  reporter: [
    ["html", { outputFolder: "./generated/playwright/reports" }],
    ["json", { outputFile: "./generated/playwright/results.json" }],
    process.env.CI !== undefined ? ["github"] : ["list"],
  ],

  // Output folder for test results
  outputDir: "./generated/playwright/test-results",

  // Global test options
  use: {
    // Browser context settings
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    headless: true, // Always headless by default (use --headed flag to override)

    // Action timeouts
    actionTimeout: 10 * 1000, // 10 seconds for actions
    navigationTimeout: 30 * 1000, // 30 seconds for navigation

    // Debugging and artifact collection - sensible defaults
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",

    // No authentication state by default (apps can override)
    storageState: undefined,
  },

  // Browser and device matrix
  // Local dev: Chromium only for speed
  // CI: Full browser matrix for compatibility testing
  projects:
    process.env.CI !== undefined
      ? [
          // Desktop browsers
          {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
          },
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },

          // Mobile devices
          {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 5"] },
          },
          {
            name: "Mobile Safari",
            use: { ...devices["iPhone 12"] },
          },

          // Tablet devices
          {
            name: "iPad",
            use: { ...devices["iPad Pro"] },
          },
        ]
      : [
          // Local development: Chromium only for fast iteration
          {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
          },
        ],

  // Development server integration - common defaults for web apps
  webServer:
    process.env.CI !== undefined
      ? undefined
      : {
          command: "pnpm dev",
          reuseExistingServer: true,
          timeout: 120 * 1000, // 2 minutes to start
        },
};

/**
 * Creates a merged configuration from the base and any custom options
 * @param customConfig - Additional configuration options
 * @returns A merged Playwright configuration
 */
export function createPlaywrightConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return {
    ...baseConfig,
    ...customConfig,
    use: {
      ...baseConfig.use,
      ...customConfig.use,
    },
    projects: customConfig.projects ?? baseConfig.projects,
  };
}

/**
 * Creates a configuration optimized for CI/CD environments
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration optimized for CI/CD
 */
export function createCIConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return createPlaywrightConfig({
    ...customConfig,
    fullyParallel: true,
    retries: 3,
    workers: 4,
    use: {
      ...customConfig.use,
      trace: "retain-on-failure",
      video: "retain-on-failure",
      screenshot: "only-on-failure",
    },
  });
}

// Re-export for convenience
export { createCrossAppConfig } from "./cross-app.js";
export { createBaseConfig } from "./base.js";

export default createPlaywrightConfig;
