/**
 * Next.js Module Tests
 */

import { describe, expect, it } from "vitest";

import { createNextjsConfigs } from "../../src/next/config.js";
import { createNextjsIgnoreConfig } from "../../src/next/ignores.js";
import {
  createNextjsPluginConfig,
  createReactPluginForNextjs,
  loadNextjsConfigs,
} from "../../src/next/plugins.js";
import { createNextjsRulesConfig } from "../../src/next/rules.js";
import { createNextjsSettingsConfig } from "../../src/next/settings.js";

describe("Next.js Configuration Modules", () => {
  describe("createNextjsConfigs", () => {
    it("returns configuration array", () => {
      const configs = createNextjsConfigs(".");
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe("createNextjsIgnoreConfig", () => {
    it("returns configuration object with ignores", () => {
      const config = createNextjsIgnoreConfig();
      expect(Array.isArray(config.ignores)).toBe(true);
    });
  });

  describe("createNextjsPluginConfig", () => {
    it("returns configuration object with nextConfigs and fallbackConfigs", () => {
      const result = createNextjsPluginConfig(".");
      expect(Array.isArray(result.nextConfigs)).toBe(true);
      expect(Array.isArray(result.fallbackConfigs)).toBe(true);
    });

    it("falls back when eslint-config-next is not installed", () => {
      const result = createNextjsPluginConfig(".");
      // eslint-config-next is not a dependency of this package,
      // so loadNextjsConfigs returns [] and the fallback path is used
      expect(result.usesFallback).toBe(true);
      expect(result.nextConfigs).toEqual([]);
      expect(result.fallbackConfigs.length).toBeGreaterThan(0);
    });
  });

  describe("loadNextjsConfigs", () => {
    it("returns empty array when eslint-config-next is not installed", () => {
      const configs = loadNextjsConfigs(".");
      expect(Array.isArray(configs)).toBe(true);
      // eslint-config-next is not a dependency, so graceful fallback returns []
      expect(configs.length).toBe(0);
    });

    it("handles relative project directory paths", () => {
      const configs = loadNextjsConfigs(".");
      expect(Array.isArray(configs)).toBe(true);
    });
  });

  describe("createReactPluginForNextjs", () => {
    it("returns configuration array", () => {
      const config = createReactPluginForNextjs();
      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });

    it("provides React plugin configuration for Next.js", () => {
      const config = createReactPluginForNextjs();
      expect(config.length).toBeGreaterThan(0);
      const hasLanguageOptions = config.some((cfg) =>
        Boolean(cfg.languageOptions),
      );
      expect(hasLanguageOptions).toBe(true);
    });

    it("includes settings from React recommended config when present", async () => {
      // The React plugin's flat recommended config may or may not include
      // settings. Temporarily inject settings to exercise the branch in
      // createReactPluginForNextjs that copies them (line 110 in plugins.ts).
      const reactModule = await import("eslint-plugin-react");
      const reactPlugin = reactModule.default;
      const recommended = reactPlugin.configs.flat.recommended as Record<
        string,
        unknown
      >;
      const originalSettings = recommended.settings;

      try {
        // Inject settings to cover the true branch
        recommended.settings = { react: { version: "18.2" } };
        const configs = createReactPluginForNextjs();
        const configEntry = configs[0];
        expect(configEntry.settings).toEqual({ react: { version: "18.2" } });
      } finally {
        // Restore original state
        if (originalSettings === undefined) {
          delete recommended.settings;
        } else {
          recommended.settings = originalSettings;
        }
      }
    });

    it("includes React plugin in plugins", () => {
      const configs = createReactPluginForNextjs();
      const configEntry = configs[0];
      expect(configEntry.plugins).toBeDefined();
      expect(configEntry.plugins?.react).toBeDefined();
    });
  });

  describe("createNextjsRulesConfig", () => {
    it("returns configuration object with rules", () => {
      const config = createNextjsRulesConfig();
      expect(Object.keys(config.rules ?? {})).not.toHaveLength(0);
    });
  });

  describe("createNextjsSettingsConfig", () => {
    it("returns configuration object with settings", () => {
      const config = createNextjsSettingsConfig("./");
      expect(Object.keys(config.settings ?? {})).not.toHaveLength(0);
    });
  });
});
