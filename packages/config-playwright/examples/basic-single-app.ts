/**
 * Basic Playwright Configuration for a Single Application
 *
 * This example demonstrates the simplest way to configure Playwright
 * for testing a single web application using @reasonabletech/config-playwright.
 *
 * Usage: Copy this file to your project root as `playwright.config.ts`
 *
 * @example
 * ```bash
 * # Run all tests
 * npx playwright test
 *
 * # Run with UI mode
 * npx playwright test --ui
 *
 * # Run specific test file
 * npx playwright test tests/acceptance/login.spec.ts
 * ```
 */

import { devices } from "@playwright/test";
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

/**
 * Create a Playwright configuration for your application.
 *
 * The `createPlaywrightConfig` function merges your custom options with
 * sensible defaults including:
 * - Test directory: ./tests/acceptance
 * - Parallel execution enabled
 * - Retries in CI (2), none locally
 * - HTML and JSON reporters
 * - Trace/video/screenshot on failure
 * - Desktop Chrome, Firefox, Safari + mobile devices in CI
 * - Desktop Chrome only for local development
 */
export default createPlaywrightConfig({
  // ============================================================
  // Application Settings
  // ============================================================

  /**
   * Base URL for all page.goto() calls and relative navigation.
   * This is the most common setting you'll want to customize.
   */
  use: {
    baseURL: "http://localhost:3000",
  },

  // ============================================================
  // Development Server (optional)
  // ============================================================

  /**
   * Configure a web server to run before tests start.
   * Set to `undefined` if your app is already running separately.
   */
  webServer: {
    // Command to start your development server
    command: "pnpm dev",

    // URL to wait for before running tests
    url: "http://localhost:3000",

    // Reuse an existing server if one is already running
    // (useful during development to avoid restarts)
    reuseExistingServer: !process.env.CI,

    // Maximum time to wait for server to start (2 minutes)
    timeout: 120 * 1000,
  },

  // ============================================================
  // Test Discovery (optional overrides)
  // ============================================================

  /**
   * Directory containing your test files.
   * Default is './tests/acceptance' - uncomment to override.
   */
  // testDir: './e2e',

  /**
   * Pattern for matching test files.
   * Default is '**\/*.{test,spec}.{ts,js}' - uncomment to override.
   */
  // testMatch: '**\/*.e2e.ts',

  // ============================================================
  // Timeouts (optional overrides)
  // ============================================================

  /**
   * Maximum time per test (30 seconds by default).
   * Increase for tests with complex workflows.
   */
  // timeout: 60 * 1000,

  /**
   * Assertion timeout (5 seconds by default).
   * Increase if your UI has slow animations or data loading.
   */
  // expect: {
  //   timeout: 10 * 1000,
  // },
});

// ============================================================
// Alternative: Minimal Configuration
// ============================================================

/**
 * If you want the absolute minimum configuration, you can use:
 *
 * export default createPlaywrightConfig({
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *   },
 * });
 *
 * This will use all defaults from the base configuration.
 */

// ============================================================
// Alternative: With Custom Browser Projects
// ============================================================

/**
 * To customize which browsers run locally vs in CI:
 *
 * export default createPlaywrightConfig({
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *   },
 *   projects: [
 *     {
 *       name: 'chromium',
 *       use: { ...devices['Desktop Chrome'] },
 *     },
 *     {
 *       name: 'Mobile Chrome',
 *       use: { ...devices['Pixel 5'] },
 *     },
 *   ],
 * });
 */
