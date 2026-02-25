/**
 * React Module Tests
 */

import { describe, expect, it } from "vitest";
import { createReactConfigs } from "../../src/react/config.js";
import { createReactPluginConfig, createCombinedReactPluginConfig } from "../../src/react/plugins.js";
import { reactRules, reactOnlyRules, allReactRules } from "../../src/react/rules.js";

describe("React Configuration Modules", () => {
  describe("createReactConfigs", () => {
    it("returns configuration array", () => {
      const configs = createReactConfigs();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });
  });

  describe("createReactPluginConfig", () => {
    it("returns configuration array", () => {
      const config = createReactPluginConfig();
      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });
  });

  describe("createCombinedReactPluginConfig", () => {
    it("returns configuration array", () => {
      const config = createCombinedReactPluginConfig();
      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);
    });
  });

  describe("React Rules", () => {
    it("exports reactRules", () => {
      expect(Object.keys(reactRules)).not.toHaveLength(0);
    });

    it("exports reactOnlyRules", () => {
      expect(reactOnlyRules).toEqual({});
    });

    it("exports allReactRules", () => {
      expect(Object.keys(allReactRules)).not.toHaveLength(0);
    });

    it("allReactRules includes reactRules", () => {
      expect(allReactRules).toMatchObject(reactRules);
    });

    it("allReactRules includes reactOnlyRules", () => {
      expect(allReactRules).toMatchObject(reactOnlyRules);
    });
  });
});
