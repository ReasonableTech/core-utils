/**
 * Specialized Playwright Configurations
 *
 * This example demonstrates how to configure Playwright for specialized
 * testing scenarios using @reasonabletech/config-playwright:
 *
 * 1. Accessibility Testing - WCAG compliance with axe-core
 * 2. Performance Testing - Core Web Vitals with Lighthouse
 *
 * These configurations are optimized for their specific testing domains
 * and should be used in dedicated test suites.
 *
 * Usage: Use these configs for specialized test suites
 *
 * @example
 * ```bash
 * # Run accessibility tests
 * npx playwright test --config=playwright.a11y.config.ts
 *
 * # Run performance tests
 * npx playwright test --config=playwright.perf.config.ts
 * ```
 */

import { devices } from "@playwright/test";
import {
  createAccessibilityConfig,
  createPerformanceConfig,
} from "@reasonabletech/config-playwright/cross-app";

// ============================================================
// Accessibility Testing Configuration
// ============================================================

/**
 * Configuration for accessibility testing with axe-core integration.
 *
 * `createAccessibilityConfig` provides:
 * - Dedicated test directory: ./tests/acceptance/accessibility
 * - Extended timeouts for accessibility checks
 * - Single browser (Chromium) for consistent results
 * - Standard viewport for accessibility testing
 *
 * Recommended usage with @axe-core/playwright:
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import AxeBuilder from '@axe-core/playwright';
 *
 * test('homepage accessibility', async ({ page }) => {
 *   await page.goto('/');
 *   const results = await new AxeBuilder({ page })
 *     .withTags(['wcag2a', 'wcag2aa'])
 *     .analyze();
 *   expect(results.violations).toEqual([]);
 * });
 * ```
 */
export const accessibilityConfig = createAccessibilityConfig({
  // ============================================================
  // Application Settings
  // ============================================================

  use: {
    /**
     * Base URL for the application under test.
     */
    baseURL: "http://localhost:3000",

    /**
     * Extended action timeout for accessibility scanning.
     * axe-core analysis can take longer on complex pages.
     */
    actionTimeout: 20 * 1000,

    /**
     * Extended navigation timeout for initial page load.
     * Ensures page is fully rendered before accessibility scan.
     */
    navigationTimeout: 30 * 1000,
  },

  // ============================================================
  // Accessibility Test Settings
  // ============================================================

  /**
   * Extended test timeout for comprehensive accessibility scans.
   * Full-page scans with detailed reporting need more time.
   */
  timeout: 120 * 1000, // 2 minutes per test

  /**
   * Run accessibility tests sequentially.
   * Parallel execution can cause resource contention during scans.
   */
  fullyParallel: false,
  workers: 2,

  /**
   * Custom test directory for accessibility tests.
   */
  testDir: "./tests/acceptance/accessibility",

  /**
   * Test pattern for accessibility-specific tests.
   */
  testMatch: "**/*.a11y.{test,spec}.ts",

  // ============================================================
  // Reporter Configuration
  // ============================================================

  /**
   * Accessibility-specific reporters.
   * Include detailed HTML report for reviewing violations.
   */
  reporter: [
    ["html", { outputFolder: "./generated/playwright/accessibility-report" }],
    ["json", { outputFile: "./generated/playwright/accessibility-results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],
});

// ============================================================
// Performance Testing Configuration
// ============================================================

/**
 * Configuration for performance testing with Lighthouse integration.
 *
 * `createPerformanceConfig` provides:
 * - Dedicated test directory: ./tests/acceptance/performance
 * - Sequential execution for accurate measurements
 * - Single worker to prevent resource contention
 * - Extended timeouts for performance analysis
 * - Disabled artifacts (video, trace) to avoid measurement interference
 *
 * Recommended usage with playwright-lighthouse:
 * ```typescript
 * import { test } from '@playwright/test';
 * import { playAudit } from 'playwright-lighthouse';
 *
 * test('homepage performance', async ({ page }) => {
 *   await page.goto('/');
 *   await playAudit({
 *     page,
 *     thresholds: {
 *       performance: 90,
 *       accessibility: 90,
 *       'best-practices': 90,
 *       seo: 90,
 *     },
 *     port: 9222,
 *   });
 * });
 * ```
 */
export const performanceConfig = createPerformanceConfig({
  // ============================================================
  // Application Settings
  // ============================================================

  use: {
    /**
     * Base URL for the application under test.
     */
    baseURL: "http://localhost:3000",

    /**
     * Extended action timeout for performance measurements.
     * Lighthouse audits require additional time.
     */
    actionTimeout: 45 * 1000,

    /**
     * Extended navigation timeout for full page load measurement.
     */
    navigationTimeout: 60 * 1000,

    /**
     * Use incognito context for clean performance measurements.
     * This prevents cached data from affecting results.
     */
    contextOptions: {
      // Use a fresh context for each test
      storageState: undefined,
    },
  },

  // ============================================================
  // Performance Test Settings
  // ============================================================

  /**
   * Extended test timeout for performance audits.
   * Lighthouse full audit can take 30-60 seconds per page.
   */
  timeout: 180 * 1000, // 3 minutes per test

  /**
   * Run performance tests sequentially.
   * CRITICAL: Parallel execution invalidates performance measurements.
   */
  fullyParallel: false,

  /**
   * Single worker for accurate performance measurements.
   * Multiple workers cause resource contention.
   */
  workers: 1,

  /**
   * No retries for performance tests.
   * Flaky performance results indicate a real problem.
   */
  retries: 0,

  /**
   * Custom test directory for performance tests.
   */
  testDir: "./tests/acceptance/performance",

  /**
   * Test pattern for performance-specific tests.
   */
  testMatch: "**/*.perf.{test,spec}.ts",

  // ============================================================
  // Reporter Configuration
  // ============================================================

  /**
   * Performance-specific reporters.
   * Include JSON for trend analysis and CI integration.
   */
  reporter: [
    ["html", { outputFolder: "./generated/playwright/performance-report" }],
    ["json", { outputFile: "./generated/playwright/performance-results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],
});

// ============================================================
// Combined Specialized Configuration
// ============================================================

/**
 * If you want to run both accessibility and performance tests
 * with a single command, you can create a combined config.
 *
 * Note: This is generally not recommended as these test types
 * have conflicting requirements (parallel vs sequential).
 * It's better to run them as separate test suites.
 *
 * @example
 * ```bash
 * # Run with specific projects
 * npx playwright test --project=accessibility
 * npx playwright test --project=performance
 * ```
 */
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export const combinedSpecializedConfig = createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },

  projects: [
    // Accessibility project - can run in parallel
    {
      name: "accessibility",
      testDir: "./tests/acceptance/accessibility",
      testMatch: "**/*.a11y.{test,spec}.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Performance project - must run sequentially
    {
      name: "performance",
      testDir: "./tests/acceptance/performance",
      testMatch: "**/*.perf.{test,spec}.ts",
      fullyParallel: false,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        // Disable artifacts for accurate measurements
        video: "off",
        screenshot: "off",
        trace: "off",
      },
    },
  ],
});

// ============================================================
// Export for direct file usage
// ============================================================

/**
 * Default export for this file.
 * Choose which config to export based on your needs.
 *
 * For dedicated test suites, create separate config files:
 * - playwright.a11y.config.ts -> export accessibilityConfig
 * - playwright.perf.config.ts -> export performanceConfig
 */
export default accessibilityConfig;

// ============================================================
// Example Test Patterns
// ============================================================

/**
 * Example accessibility test (tests/acceptance/accessibility/homepage.a11y.spec.ts):
 *
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import AxeBuilder from '@axe-core/playwright';
 *
 * test.describe('Homepage Accessibility', () => {
 *   test('should have no WCAG 2.1 AA violations', async ({ page }) => {
 *     await page.goto('/');
 *
 *     const results = await new AxeBuilder({ page })
 *       .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
 *       .analyze();
 *
 *     // Log violations for debugging
 *     if (results.violations.length > 0) {
 *       console.log('Accessibility violations:', results.violations);
 *     }
 *
 *     expect(results.violations).toHaveLength(0);
 *   });
 *
 *   test('should have proper heading hierarchy', async ({ page }) => {
 *     await page.goto('/');
 *
 *     const results = await new AxeBuilder({ page })
 *       .withRules(['heading-order'])
 *       .analyze();
 *
 *     expect(results.violations).toHaveLength(0);
 *   });
 * });
 * ```
 *
 * Example performance test (tests/acceptance/performance/homepage.perf.spec.ts):
 *
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { playAudit } from 'playwright-lighthouse';
 *
 * test.describe('Homepage Performance', () => {
 *   test('should meet Core Web Vitals thresholds', async ({ page }) => {
 *     await page.goto('/');
 *
 *     await playAudit({
 *       page,
 *       thresholds: {
 *         performance: 85,
 *         accessibility: 90,
 *         'best-practices': 85,
 *         seo: 85,
 *       },
 *       port: 9222,
 *       reports: {
 *         formats: {
 *           html: true,
 *           json: true,
 *         },
 *         directory: './generated/playwright/lighthouse',
 *       },
 *     });
 *   });
 *
 *   test('should load within 3 seconds', async ({ page }) => {
 *     const startTime = Date.now();
 *     await page.goto('/', { waitUntil: 'networkidle' });
 *     const loadTime = Date.now() - startTime;
 *
 *     expect(loadTime).toBeLessThan(3000);
 *   });
 * });
 * ```
 */
