/**
 * Base browser configuration for Playwright testing
 * @module @reasonabletech/config-playwright/base
 */

import { type PlaywrightTestConfig, devices } from "@playwright/test";
import { baseConfig, type PlaywrightConfig } from "./index.js";

// Empty readonly config for default parameters
const EMPTY_CONFIG = {} as const satisfies PlaywrightConfig;

/**
 * Desktop-only browser configuration
 */
export const desktopConfig: PlaywrightTestConfig = {
  projects: [
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
  ],
};

/**
 * Mobile-only browser configuration
 */
export const mobileConfig: PlaywrightTestConfig = {
  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
};

/**
 * Chromium-only configuration for faster development testing
 */
export const chromiumOnlyConfig: PlaywrightTestConfig = {
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
};

/**
 * Creates a base Playwright configuration for single-app testing
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration for standard single-app testing
 */
export function createBaseConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return {
    ...baseConfig,
    ...customConfig,
    use: {
      ...baseConfig.use,
      ...customConfig.use,
      // Single-app specific settings
      storageState: undefined, // No cross-app auth state by default
    },
    projects: customConfig.projects ?? baseConfig.projects,
  };
}

/**
 * Creates a desktop-only configuration for faster testing cycles
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration for desktop browsers only
 */
export function createDesktopConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return createBaseConfig({
    ...customConfig,
    projects: desktopConfig.projects,
  });
}

/**
 * Creates a mobile-only configuration for mobile-specific testing
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration for mobile browsers only
 */
export function createMobileConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return createBaseConfig({
    ...customConfig,
    projects: mobileConfig.projects,
  });
}

/**
 * Creates a Chromium-only configuration for development
 * @param customConfig - Additional configuration options
 * @returns A Playwright configuration for Chromium browser only
 */
export function createChromiumConfig(
  customConfig: PlaywrightConfig = EMPTY_CONFIG,
): PlaywrightTestConfig {
  return createBaseConfig({
    ...customConfig,
    projects: chromiumOnlyConfig.projects,
    workers: 1, // Single worker for development
  });
}

export default createBaseConfig;
