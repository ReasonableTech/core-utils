/**
 * Unit tests for shared configuration modules
 *
 * These tests verify that shared config factories produce valid objects
 * without throwing. They exercise option wiring and structural contracts.
 */

import { describe, expect, it } from "vitest";
import type { ESLint } from "eslint";
import { stripPluginConfigs } from "../../src/shared/plugin-utils.js";
import { createSharedReactComponentFileConfig } from "../../src/shared/react-rules.js";
import {
  createStrictBooleanExpressionsConfig,
  createStrictTypeScriptRulesConfig,
} from "../../src/shared/strict-rules.js";

describe("Shared Configuration Modules", () => {
  describe("createSharedReactComponentFileConfig", () => {
    it("returns configuration object with files and rules", () => {
      const config = createSharedReactComponentFileConfig();

      expect(config.files).toBeInstanceOf(Array);
      expect(config.rules).toEqual(expect.any(Object));
    });
  });

  describe("createStrictBooleanExpressionsConfig", () => {
    it("returns configuration object with rules", () => {
      const config = createStrictBooleanExpressionsConfig("./");

      expect(config.rules).toEqual(expect.any(Object));
    });

    it("includes strict-boolean-expressions rule", () => {
      const config = createStrictBooleanExpressionsConfig("./");
      const strictBooleanRule =
        config.rules?.["@typescript-eslint/strict-boolean-expressions"];
      const strictBooleanSeverity = Array.isArray(strictBooleanRule)
        ? strictBooleanRule[0]
        : strictBooleanRule;
      expect(strictBooleanSeverity).toBe("error");
    });
  });

  describe("createStrictTypeScriptRulesConfig", () => {
    it("returns configuration object with rules", () => {
      const config = createStrictTypeScriptRulesConfig();

      expect(config.rules).toEqual(expect.any(Object));
    });

    it("includes TypeScript-aware rules", () => {
      const config = createStrictTypeScriptRulesConfig();
      expect(config.rules?.["@typescript-eslint/no-explicit-any"]).toBe(
        "error",
      );

      const noUnusedVars = config.rules?.["@typescript-eslint/no-unused-vars"];
      const severity = Array.isArray(noUnusedVars)
        ? noUnusedVars[0]
        : noUnusedVars;
      expect(severity).toBe("error");
    });
  });

  describe("stripPluginConfigs", () => {
    it("returns only rules when plugin has only rules", () => {
      const plugin: ESLint.Plugin = {
        rules: { "my-rule": { create: () => ({}) } },
      };

      const result = stripPluginConfigs(plugin);

      expect(result.rules).toBe(plugin.rules);
      expect(result.processors).toBeUndefined();
      expect(result.environments).toBeUndefined();
      expect(result.meta).toBeUndefined();
    });

    it("includes processors when plugin has processors", () => {
      const plugin: ESLint.Plugin = {
        rules: { "my-rule": { create: () => ({}) } },
        processors: {
          ".md": {
            preprocess: (text: string) => [text],
            postprocess: (messages: unknown[][]) => messages[0] as never[],
          },
        },
      };

      const result = stripPluginConfigs(plugin);

      expect(result.rules).toBe(plugin.rules);
      expect(result.processors).toBe(plugin.processors);
    });

    it("includes environments when plugin has environments", () => {
      const plugin: ESLint.Plugin = {
        rules: { "my-rule": { create: () => ({}) } },
        environments: {
          custom: { globals: { myGlobal: true } },
        },
      };

      const result = stripPluginConfigs(plugin);

      expect(result.rules).toBe(plugin.rules);
      expect(result.environments).toBe(plugin.environments);
    });

    it("includes all properties when plugin has rules, processors, environments, and meta", () => {
      const plugin: ESLint.Plugin = {
        rules: { "my-rule": { create: () => ({}) } },
        processors: {
          ".md": {
            preprocess: (text: string) => [text],
            postprocess: (messages: unknown[][]) => messages[0] as never[],
          },
        },
        environments: {
          custom: { globals: { myGlobal: true } },
        },
        meta: { name: "test-plugin", version: "1.0.0" },
      };

      const result = stripPluginConfigs(plugin);

      expect(result.rules).toBe(plugin.rules);
      expect(result.processors).toBe(plugin.processors);
      expect(result.environments).toBe(plugin.environments);
      expect(result.meta).toBe(plugin.meta);
    });

    it("returns empty object when plugin has no recognized properties", () => {
      const plugin: ESLint.Plugin = {};

      const result = stripPluginConfigs(plugin);

      expect(result).toEqual({});
      expect(result.rules).toBeUndefined();
      expect(result.processors).toBeUndefined();
      expect(result.environments).toBeUndefined();
      expect(result.meta).toBeUndefined();
    });

    it("strips configs property from plugin", () => {
      const plugin = {
        rules: { "my-rule": { create: () => ({}) } },
        configs: { recommended: { rules: { "my-rule": "error" } } },
      } as unknown as ESLint.Plugin;

      const result = stripPluginConfigs(plugin);

      expect(result.rules).toBe(plugin.rules);
      expect((result as Record<string, unknown>).configs).toBeUndefined();
    });
  });
});
