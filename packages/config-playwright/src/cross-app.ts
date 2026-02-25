/**
 * Cross-app Playwright configuration for multi-frontend testing
 * @module @reasonabletech/config-playwright/cross-app
 */

import { type PlaywrightTestConfig } from "@playwright/test";
import {
  baseConfig,
  type PlaywrightConfig,
  type TestEnvironmentConfig,
} from "./index.js";

// Empty readonly config for default parameters
const EMPTY_CONFIG = {} as const satisfies PlaywrightConfig;

/**
 * Cross-app specific configuration options
 */
export const crossAppConfig: PlaywrightTestConfig = {
  testDir: "./tests/acceptance/cross-app",
  testMatch: "**/*.{test,spec}.{ts,js}",

  use: {
    // Extended timeout for cross-app navigation
    actionTimeout: 10000,
    navigationTimeout: 15000,

    // Cross-domain configuration
    extraHTTPHeaders: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },

    // Authentication state for cross-app flows
    storageState: "tests/fixtures/auth/cross-app-authenticated.json",

    // Enable video for complex cross-app debugging
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
};

/**
 * Accessibility testing configuration with axe-core
 */
export const accessibilityConfig: PlaywrightTestConfig = {
  testDir: "./tests/acceptance/accessibility",
  testMatch: "**/*.{test,spec}.{ts,js}",

  use: {
    // Slower execution for accessibility checks
    actionTimeout: 15000,
    navigationTimeout: 20000,
  },
};

/**
 * Performance testing configuration for Lighthouse integration
 */
export const performanceConfig: PlaywrightTestConfig = {
  testDir: "./tests/acceptance/performance",
  testMatch: "**/*.{test,spec}.{ts,js}",

  // Sequential execution for accurate performance measurements
  fullyParallel: false,
  workers: 1,

  use: {
    // Extended timeouts for performance measurements
    actionTimeout: 30000,
    navigationTimeout: 45000,

    // Minimal interference for accurate measurements
    video: "off",
    screenshot: "off",
    trace: "off",
  },
};

/**
 * Options for creating a cross-domain authentication workflow configuration.
 */
export interface AuthWorkflowOptions {
  /** The cookie domain (e.g. ".example.com"). */
  domain: string;
  /**
   * List of subdomains where authentication cookies should persist
   * (e.g. ["accounts.example.com", "app.example.com"]).
   */
  expectedPersistence: readonly string[];
}

/**
 * Configuration shape returned by {@link createAuthWorkflowConfig}.
 */
export interface AuthWorkflowConfig {
  /**
   * Cookie settings used for cross-domain authentication.
   */
  readonly cookieConfig: {
    readonly domain: string;
    readonly secure: true;
    readonly httpOnly: true;
    readonly sameSite: "lax";
  };
  /**
   * Subdomains where authentication should remain valid.
   */
  readonly expectedPersistence: readonly string[];
}

/**
 * Creates a cross-domain authentication configuration for the given domain.
 * @param options - Domain and persistence settings
 * @returns An authentication workflow config object
 */
export function createAuthWorkflowConfig(
  options: AuthWorkflowOptions,
): AuthWorkflowConfig {
  return {
    cookieConfig: {
      domain: options.domain,
      secure: true,
      httpOnly: true,
      sameSite: "lax" as const,
    },
    expectedPersistence: options.expectedPersistence,
  } as const;
}

/**
 * Options for creating a cross-app Playwright configuration.
 */
export interface CrossAppConfigOptions {
  /**
   * Map of environment names to their configuration.
   * The key used is determined by the `TEST_ENV` environment variable,
   * falling back to `"development"`.
   */
  environments: Readonly<Record<string, TestEnvironmentConfig | undefined>>;
  /** Additional Playwright configuration overrides. */
  customConfig?: PlaywrightConfig;
}

/**
 * Creates a Playwright configuration for cross-app workflows.
 *
 * Consumers must supply their own environment map so that base URLs are not
 * hardcoded in this shared package.
 * @param options - Environments map and optional custom config overrides
 * @returns A Playwright configuration optimized for cross-app testing
 */
export function createCrossAppConfig(
  options: CrossAppConfigOptions,
): PlaywrightTestConfig {
  const { environments, customConfig = EMPTY_CONFIG } = options;

  const environment = process.env.TEST_ENV ?? "development";
  const envConfig = environments[environment];

  if (envConfig === undefined) {
    throw new Error(
      `Unknown test environment "${environment}". Available environments: ${Object.keys(environments).join(", ")}`,
    );
  }

  const defaultBaseUrl = Object.values(envConfig.baseUrls).at(0);

  if (defaultBaseUrl === undefined) {
    throw new Error(
      `Environment "${environment}" must define at least one base URL`,
    );
  }

  return {
    ...baseConfig,
    ...crossAppConfig,
    ...customConfig,
    use: {
      ...baseConfig.use,
      ...crossAppConfig.use,
      ...(customConfig as PlaywrightTestConfig).use,
      // Set base URL to the first entry in baseUrls (typically the landing page)
      baseURL: defaultBaseUrl,
    },
    projects: [
      // Desktop browsers for cross-app flows
      {
        name: "cross-app-chromium",
        testDir: "./tests/acceptance/cross-app",
        use: {
          ...baseConfig.projects?.[0]?.use,
          // Cross-app specific browser settings
          viewport: { width: 1920, height: 1080 },
        },
      },
      {
        name: "cross-app-firefox",
        testDir: "./tests/acceptance/cross-app",
        use: {
          ...baseConfig.projects?.[1]?.use,
          viewport: { width: 1920, height: 1080 },
        },
      },
      {
        name: "cross-app-webkit",
        testDir: "./tests/acceptance/cross-app",
        use: {
          ...baseConfig.projects?.[2]?.use,
          viewport: { width: 1920, height: 1080 },
        },
      },
    ],
  };
}

/**
 * Creates a configuration for accessibility testing with axe-core
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration with accessibility testing setup
 */
export function createAccessibilityConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return {
    ...baseConfig,
    ...accessibilityConfig,
    ...customConfig,
    use: {
      ...baseConfig.use,
      ...accessibilityConfig.use,
      ...(customConfig as PlaywrightTestConfig).use,
    },
    projects: [
      {
        name: "accessibility-chromium",
        testDir: "./tests/acceptance/accessibility",
        use: {
          ...baseConfig.projects?.[0]?.use,
          viewport: { width: 1280, height: 720 },
        },
      },
    ],
  };
}

/**
 * Creates a configuration for performance testing with Lighthouse
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration with performance testing setup
 */
export function createPerformanceConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return {
    ...baseConfig,
    ...performanceConfig,
    ...customConfig,
    use: {
      ...baseConfig.use,
      ...performanceConfig.use,
      ...(customConfig as PlaywrightTestConfig).use,
    },
    projects: [
      {
        name: "performance-chromium",
        testDir: "./tests/acceptance/performance",
        use: {
          ...baseConfig.projects?.[0]?.use,
          viewport: { width: 1920, height: 1080 },
        },
      },
    ],
  };
}

/**
 * Creates a configuration optimized for authentication workflow testing
 * @param options - Cross-app config options (environments map and optional custom config)
 * @returns A Playwright configuration for auth workflow testing
 */
export function createAuthTestConfig(
  options: CrossAppConfigOptions,
): PlaywrightTestConfig {
  const { environments, customConfig = EMPTY_CONFIG } = options;
  return createCrossAppConfig({
    environments,
    customConfig: {
      ...customConfig,
      testDir: "./tests/acceptance/auth",
      use: {
        ...(customConfig as PlaywrightTestConfig).use,
        // No pre-authenticated state for auth tests
        storageState: undefined,
      },
    },
  });
}

export default createCrossAppConfig;
