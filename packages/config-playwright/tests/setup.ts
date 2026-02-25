/**
 * Test setup file for config-playwright
 * Initializes test environment and shared test utilities
 */

import { afterEach, beforeEach, vi } from "vitest";

// Mock process.env for testing different environments
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
