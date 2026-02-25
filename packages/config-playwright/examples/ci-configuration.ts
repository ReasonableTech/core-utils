/**
 * CI/CD Optimized Playwright Configuration
 *
 * This example demonstrates how to configure Playwright for CI/CD pipelines
 * using @reasonabletech/config-playwright's CI-specific helper.
 *
 * Key CI optimizations:
 * - Increased retry count for handling flaky tests
 * - Parallel execution with fixed worker count
 * - Artifact collection (traces, videos) only on failure
 * - Extended timeouts for potentially slower CI environments
 *
 * Usage: Copy this file to your project root as `playwright.config.ts`
 *
 * @example GitHub Actions workflow
 * ```yaml
 * - name: Run E2E Tests
 *   run: npx playwright test
 *   env:
 *     CI: true
 *     BASE_URL: ${{ vars.STAGING_URL }}
 * ```
 */

import { devices } from "@playwright/test";
import { createCIConfig } from "@reasonabletech/config-playwright";

/**
 * Determine base URL from environment variables.
 * This allows different URLs for different CI environments.
 */
const baseURL =
  process.env.BASE_URL ||
  process.env.DEPLOY_URL ||
  "https://staging.example.com";

/**
 * Create a CI-optimized Playwright configuration.
 *
 * `createCIConfig` provides these defaults optimized for CI:
 * - fullyParallel: true (maximize parallelization)
 * - retries: 3 (handle transient failures)
 * - workers: 4 (balanced concurrency)
 * - trace: 'retain-on-failure' (debug failed tests)
 * - video: 'retain-on-failure' (visual debugging)
 * - screenshot: 'only-on-failure' (save storage)
 */
export default createCIConfig({
  // ============================================================
  // Application Settings
  // ============================================================

  use: {
    /**
     * Base URL from environment - allows testing against different
     * deployment targets (staging, preview, production smoke tests).
     */
    baseURL,

    /**
     * Extended timeouts for CI environments which may be slower
     * than local development machines.
     */
    actionTimeout: 15 * 1000, // 15 seconds for actions
    navigationTimeout: 45 * 1000, // 45 seconds for page loads
  },

  // ============================================================
  // CI-Specific Settings
  // ============================================================

  /**
   * Extended test timeout for CI.
   * Individual tests get 60 seconds instead of the default 30.
   */
  timeout: 60 * 1000,

  /**
   * Extended assertion timeout.
   * Assertions get 10 seconds instead of the default 5.
   */
  expect: {
    timeout: 10 * 1000,
  },

  /**
   * Number of retries for failed tests.
   * CI defaults to 3, but you can adjust based on test stability.
   */
  retries: 3,

  /**
   * Number of parallel workers.
   * Adjust based on your CI runner's resources.
   * - 4: Good for standard runners (2-4 vCPU)
   * - 8: Good for larger runners (8+ vCPU)
   * - 1: For serial execution (debugging, resource constraints)
   */
  workers: 4,

  // ============================================================
  // Reporter Configuration
  // ============================================================

  /**
   * CI-specific reporters.
   * - 'github': GitHub Actions annotations for failed tests
   * - 'html': Interactive HTML report (upload as artifact)
   * - 'json': Machine-readable results for downstream processing
   * - 'junit': For CI systems that consume JUnit XML
   */
  reporter: [
    // GitHub Actions annotations
    ["github"],

    // HTML report - upload as CI artifact
    ["html", { outputFolder: "./generated/playwright/reports", open: "never" }],

    // JSON results for custom processing
    ["json", { outputFile: "./generated/playwright/results.json" }],

    // JUnit XML for CI integration
    ["junit", { outputFile: "./generated/playwright/junit.xml" }],
  ],

  // ============================================================
  // Browser Matrix for CI
  // ============================================================

  /**
   * Full browser matrix for comprehensive CI testing.
   * Tests run against all major browsers and device types.
   */
  projects: [
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
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },

    // Tablet
    {
      name: "tablet",
      use: { ...devices["iPad Pro"] },
    },
  ],

  // ============================================================
  // Output Configuration
  // ============================================================

  /**
   * Output directories for test artifacts.
   * Configure these to match your CI artifact collection.
   */
  outputDir: "./generated/playwright/test-results",
});

// ============================================================
// Alternative: Minimal CI Configuration
// ============================================================

/**
 * For a simpler CI setup with just the essential overrides:
 *
 * export default createCIConfig({
 *   use: {
 *     baseURL: process.env.BASE_URL || 'https://staging.example.com',
 *   },
 * });
 */

// ============================================================
// Alternative: Sharded CI Configuration
// ============================================================

/**
 * For very large test suites, use sharding to split tests across
 * multiple CI jobs:
 *
 * export default createCIConfig({
 *   use: {
 *     baseURL: process.env.BASE_URL || 'https://staging.example.com',
 *   },
 *   // Enable sharding - set SHARD via CI matrix
 *   // SHARD format: "1/4" means shard 1 of 4 total shards
 *   shard: process.env.SHARD ? {
 *     current: parseInt(process.env.SHARD.split('/')[0]),
 *     total: parseInt(process.env.SHARD.split('/')[1]),
 *   } : undefined,
 * });
 *
 * GitHub Actions matrix example:
 * ```yaml
 * strategy:
 *   matrix:
 *     shard: [1/4, 2/4, 3/4, 4/4]
 * steps:
 *   - run: npx playwright test
 *     env:
 *       SHARD: ${{ matrix.shard }}
 * ```
 */
