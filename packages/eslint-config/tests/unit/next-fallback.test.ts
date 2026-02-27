/**
 * Tests for Next.js configuration fallback scenarios.
 *
 * These tests verify behavior when eslint-config-next is not available,
 * covering the catch block in loadNextjsConfigs (lines 53-57),
 * the assertConfigArray throw (line 67), the usesFallback branch
 * in createTypeAwareNextConfig (line 39), and the fallback path in
 * createNextjsPluginConfig.
 *
 * Separated from next-modules.test.ts because these tests require
 * mocking node:module which affects the entire test file.
 */

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const previousNodeEnv = process.env.NODE_ENV;

/**
 * Capture the real createRequire before vi.mock replaces the module.
 * vi.hoisted runs before vi.mock, so the import is available.
 */
const { realCreateRequire, mockCreateRequire } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- vi.hoisted runs before ESM imports
  const mod = require("node:module") as {
    createRequire: (specifier: string | URL) => NodeRequire;
  };
  const real = mod.createRequire;
  const mock = vi.fn(real);
  return { realCreateRequire: real, mockCreateRequire: mock };
});

vi.mock("node:module", () => ({
  createRequire: mockCreateRequire,
}));

beforeEach(() => {
  process.env.NODE_ENV = "development";
});

afterEach(() => {
  vi.restoreAllMocks();
  if (previousNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = previousNodeEnv;
  }
  mockCreateRequire.mockImplementation(realCreateRequire);
});

afterAll(() => {
  if (previousNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

describe("loadNextjsConfigs fallback scenarios", () => {
  it("returns empty array and warns when createRequire throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Make createRequire throw to simulate Next.js not being installed
    mockCreateRequire.mockImplementation(() => {
      const error = new Error(
        "Cannot find module 'eslint-config-next/core-web-vitals'",
      );
      (error as NodeJS.ErrnoException).code = "MODULE_NOT_FOUND";
      throw error;
    });

    const { loadNextjsConfigs } = await import("../../src/next/plugins.js");
    const configs = loadNextjsConfigs(".");

    expect(configs).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Next.js ESLint config not available"),
      expect.anything(),
    );
  });

  it("returns empty array when loaded config is not a flat config array", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Make createRequire return a function that provides non-array configs,
    // simulating an older eslint-config-next that doesn't export flat configs.
    // This triggers the assertConfigArray throw branch (line 67).
    mockCreateRequire.mockImplementation((specifier) => {
      const realRequire = realCreateRequire(specifier);
      const mockRequire = ((id: string): unknown => {
        if (id.includes("eslint-config-next")) {
          return { rules: { "some-rule": "error" } };
        }
        return realRequire(id) as unknown;
      }) as NodeRequire;
      mockRequire.resolve = realRequire.resolve;
      mockRequire.cache = realRequire.cache;
      mockRequire.extensions = realRequire.extensions;
      mockRequire.main = realRequire.main;
      return mockRequire;
    });

    const { loadNextjsConfigs } = await import("../../src/next/plugins.js");
    const configs = loadNextjsConfigs(".");

    expect(configs).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Next.js ESLint config not available"),
      expect.stringContaining("flat config arrays"),
    );
  });

  it("handles non-Error throw in catch block (line 55 false branch)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Throw a non-Error value (string) to cover the false branch of
    // `error instanceof Error ? error.message : error`
    mockCreateRequire.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally throwing non-Error to test error handling branch
      throw "module not available";
    });

    const { loadNextjsConfigs } = await import("../../src/next/plugins.js");
    const configs = loadNextjsConfigs(".");

    expect(configs).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Next.js ESLint config not available"),
      "module not available",
    );
  });

  it("createNextjsPluginConfig falls back to React plugin when Next.js is unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockCreateRequire.mockImplementation(() => {
      const error = new Error(
        "Cannot find module 'eslint-config-next/core-web-vitals'",
      );
      (error as NodeJS.ErrnoException).code = "MODULE_NOT_FOUND";
      throw error;
    });

    const { createNextjsPluginConfig } =
      await import("../../src/next/plugins.js");
    const result = createNextjsPluginConfig(".");

    expect(result.usesFallback).toBe(true);
    expect(result.nextConfigs).toEqual([]);
    expect(result.fallbackConfigs.length).toBeGreaterThan(0);
  });

  it("createTypeAwareNextConfig uses fallback configs when Next.js is not available", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockCreateRequire.mockImplementation(() => {
      const error = new Error(
        "Cannot find module 'eslint-config-next/core-web-vitals'",
      );
      (error as NodeJS.ErrnoException).code = "MODULE_NOT_FOUND";
      throw error;
    });

    const { createTypeAwareNextConfig } = await import("../../src/next.js");
    const config = createTypeAwareNextConfig(".");

    expect(config).toBeDefined();
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);

    // The fallback path should produce a config with the React plugin
    const hasReactPlugin = config.some(
      (c) => c.plugins !== undefined && "react" in c.plugins,
    );
    expect(hasReactPlugin).toBe(true);
  }, 60000);
});
