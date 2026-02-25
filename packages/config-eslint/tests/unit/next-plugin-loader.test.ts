import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  invalidTypescriptConfig,
  validCoreWebVitalsConfig,
  validTypescriptConfig,
} from "../fixtures/next/plugin-loader-configs.js";
import { createRequireFromBaseMock } from "../helpers/next/require-from-base.js";
import { createNodeModuleMock } from "../mocks/node-module.js";

describe("Next.js plugin loader", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("loads valid Next.js flat config arrays and normalizes parser options", async () => {
    const requireFromBase = createRequireFromBaseMock({
      "eslint-config-next/core-web-vitals": validCoreWebVitalsConfig,
      "eslint-config-next/typescript": validTypescriptConfig,
    });

    vi.doMock("node:module", () => createNodeModuleMock(requireFromBase));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { loadNextjsConfigs } = await import("../../src/next/plugins.js");
    const configs = loadNextjsConfigs(".");

    expect(configs).toHaveLength(2);
    expect(configs[0].languageOptions?.parserOptions).toEqual({
      tsconfigRootDir: ".",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("builds plugin config without fallback when Next.js configs are available", async () => {
    const requireFromBase = createRequireFromBaseMock({
      "eslint-config-next/core-web-vitals": validCoreWebVitalsConfig,
      "eslint-config-next/typescript": validTypescriptConfig,
    });

    vi.doMock("node:module", () => createNodeModuleMock(requireFromBase));

    const { createNextjsPluginConfig } = await import("../../src/next/plugins.js");
    const pluginConfig = createNextjsPluginConfig(".");

    expect(pluginConfig.usesFallback).toBe(false);
    expect(pluginConfig.nextConfigs).toHaveLength(2);
    expect(pluginConfig.fallbackConfigs).toEqual([]);
  });

  it("falls back when a Next.js config export is not a valid object array", async () => {
    const requireFromBase = createRequireFromBaseMock({
      "eslint-config-next/core-web-vitals": [{}],
      "eslint-config-next/typescript": invalidTypescriptConfig,
    });

    vi.doMock("node:module", () => createNodeModuleMock(requireFromBase));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { loadNextjsConfigs } = await import("../../src/next/plugins.js");
    const configs = loadNextjsConfigs(".");

    expect(configs).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });
});
