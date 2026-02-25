/**
 * Cross-App Playwright Configuration for Multi-Application Testing
 *
 * This example demonstrates how to configure Playwright for testing workflows
 * that span multiple applications or services using @reasonabletech/config-playwright.
 *
 * Common use cases:
 * - Single Sign-On (SSO) flows across multiple apps
 * - E-commerce checkout spanning cart, payment, and order services
 * - Dashboard apps that aggregate data from multiple microservices
 * - Multi-tenant applications with shared authentication
 *
 * Usage: Copy this file to your project root as `playwright.config.ts`
 *
 * @example
 * ```bash
 * # Run all cross-app tests
 * TEST_ENV=staging npx playwright test
 *
 * # Run authentication workflow tests
 * TEST_ENV=development npx playwright test tests/acceptance/auth/
 * ```
 */

import {
  createCrossAppConfig,
  createAuthWorkflowConfig,
  createAuthTestConfig,
  type TestEnvironmentConfig,
} from "@reasonabletech/config-playwright/cross-app";

// ============================================================
// Environment Configuration
// ============================================================

/**
 * Define your test environments with their respective base URLs.
 * The active environment is determined by the TEST_ENV environment variable.
 *
 * Each environment specifies:
 * - baseUrls: Map of application names to their URLs
 * - services: Configuration for backend/mock services
 * - smokeTestsOnly: Whether to run only critical path tests (e.g., production)
 */
const environments: Record<string, TestEnvironmentConfig> = {
  /**
   * Local development environment.
   * Apps run on localhost with different ports.
   */
  development: {
    baseUrls: {
      // Primary landing/marketing site
      landing: "http://localhost:3000",
      // Main application dashboard
      app: "http://localhost:3001",
      // Authentication/account management
      accounts: "http://localhost:3002",
      // API documentation portal
      docs: "http://localhost:3003",
    },
    services: {
      // Use mock services for faster, isolated testing
      useRealServices: false,
      mockExternalAPIs: true,
    },
  },

  /**
   * Staging environment.
   * Pre-production environment for integration testing.
   */
  staging: {
    baseUrls: {
      landing: "https://staging.example.com",
      app: "https://app.staging.example.com",
      accounts: "https://accounts.staging.example.com",
      docs: "https://docs.staging.example.com",
    },
    services: {
      // Use real services for realistic integration tests
      useRealServices: true,
      // Mock external APIs to avoid rate limits and costs
      mockExternalAPIs: true,
    },
  },

  /**
   * Production environment.
   * Only smoke tests should run against production.
   */
  production: {
    baseUrls: {
      landing: "https://example.com",
      app: "https://app.example.com",
      accounts: "https://accounts.example.com",
      docs: "https://docs.example.com",
    },
    services: {
      useRealServices: true,
      mockExternalAPIs: false,
    },
    // Only run critical path smoke tests in production
    smokeTestsOnly: true,
  },
};

// ============================================================
// Cross-App Configuration
// ============================================================

/**
 * Create the cross-app Playwright configuration.
 *
 * `createCrossAppConfig` provides:
 * - Extended timeouts for cross-domain navigation
 * - Cross-domain HTTP headers
 * - Authentication state storage for cross-app flows
 * - Video/trace capture for debugging complex workflows
 * - Desktop-focused projects for cross-app testing
 */
export default createCrossAppConfig({
  environments,
  customConfig: {
    // ============================================================
    // Cross-App Test Settings
    // ============================================================

    /**
     * Custom test directory for cross-app tests.
     * Default is './tests/acceptance/cross-app'.
     */
    testDir: "./tests/acceptance/cross-app",

    /**
     * Extended timeout for complex cross-app workflows.
     * These tests often involve multiple page navigations and API calls.
     */
    timeout: 90 * 1000, // 90 seconds per test

    /**
     * Extended assertion timeout for data synchronization.
     * Cross-app data may take longer to propagate.
     */
    expect: {
      timeout: 15 * 1000,
    },

    // ============================================================
    // Artifact Collection
    // ============================================================

    /**
     * Always collect traces for cross-app debugging.
     * These workflows are complex and traces are invaluable.
     */
    use: {
      trace: "on",
      video: "retain-on-failure",
      screenshot: "only-on-failure",
    },
  },
});

// ============================================================
// Authentication Workflow Configuration
// ============================================================

/**
 * Create authentication workflow configuration for cross-domain SSO testing.
 *
 * This configuration defines how authentication cookies should behave
 * across your application subdomains.
 */
export const authWorkflow = createAuthWorkflowConfig({
  // Root domain for authentication cookies
  domain: ".example.com",

  // Subdomains where authentication should persist
  expectedPersistence: [
    "accounts.example.com",
    "app.example.com",
    "docs.example.com",
  ],
});

// ============================================================
// Alternative: Auth-Only Test Configuration
// ============================================================

/**
 * Configuration specifically for authentication workflow tests.
 *
 * Use this when you want a separate test suite focused only on
 * login, logout, session management, and cross-app auth persistence.
 *
 * Key differences from cross-app config:
 * - Test directory: ./tests/acceptance/auth
 * - No pre-authenticated storage state (tests start logged out)
 */
export const authTestConfig = createAuthTestConfig({
  environments,
  customConfig: {
    /**
     * Lower timeout since auth flows should be relatively quick.
     */
    timeout: 45 * 1000,

    /**
     * Run auth tests sequentially to avoid session conflicts.
     */
    fullyParallel: false,
    workers: 1,
  },
});

// ============================================================
// Helper: Get Current Environment URLs
// ============================================================

/**
 * Utility function to get the current environment's base URLs.
 * Useful in test setup/teardown for dynamic URL construction.
 *
 * @example
 * ```typescript
 * // In your test file
 * import { getEnvironmentUrls } from './playwright.config';
 *
 * test('navigate between apps', async ({ page }) => {
 *   const urls = getEnvironmentUrls();
 *   await page.goto(urls.landing);
 *   await page.click('a[href*="app"]');
 *   await expect(page).toHaveURL(new RegExp(urls.app));
 * });
 * ```
 */
export function getEnvironmentUrls(): Record<string, string> {
  const env = process.env.TEST_ENV || "development";
  const config = environments[env];

  if (!config) {
    throw new Error(
      `Unknown environment: ${env}. Available: ${Object.keys(environments).join(", ")}`,
    );
  }

  return config.baseUrls;
}

// ============================================================
// Helper: Check if Running Smoke Tests Only
// ============================================================

/**
 * Utility function to check if only smoke tests should run.
 * Use this in test files to conditionally skip non-critical tests.
 *
 * @example
 * ```typescript
 * import { isSmokeTestOnly } from './playwright.config';
 *
 * test('comprehensive user journey', async ({ page }) => {
 *   test.skip(isSmokeTestOnly(), 'Skipping comprehensive test in production');
 *   // Full test implementation...
 * });
 * ```
 */
export function isSmokeTestOnly(): boolean {
  const env = process.env.TEST_ENV || "development";
  return environments[env]?.smokeTestsOnly ?? false;
}
