import { describe, expect, it, vi } from "vitest";

import {
  baseConfig,
  createCIConfig,
  createPlaywrightConfig,
} from "../../src/index.js";

describe("Playwright Config - Index Module", () => {
  describe("Core use cases", () => {
    it("creates base playwright config with merged use overrides", () => {
      const config = createPlaywrightConfig({
        timeout: 45000,
        use: {
          headless: false,
        },
      });

      expect(config.timeout).toBe(45000);
      expect(config.use?.headless).toBe(false);
      expect(config.use?.trace).toBe(baseConfig.use?.trace);
      expect(config.projects).toEqual(baseConfig.projects);
    });

    it("prefers custom projects when provided", () => {
      const customProjects = [{ name: "custom-browser", use: {} }];
      const config = createPlaywrightConfig({
        projects: customProjects,
      });

      expect(config.projects).toEqual(customProjects);
    });

    it("creates CI config with hardened retry and artifact settings", () => {
      const config = createCIConfig();

      expect(config.fullyParallel).toBe(true);
      expect(config.retries).toBe(3);
      expect(config.workers).toBe(4);
      expect(config.use?.trace).toBe("retain-on-failure");
      expect(config.use?.video).toBe("retain-on-failure");
      expect(config.use?.screenshot).toBe("only-on-failure");
    });
  });

  describe("Edge cases", () => {
    it("builds CI-specific base settings when CI is defined", async () => {
      const previousCI = process.env.CI;

      process.env.CI = "true";
      vi.resetModules();

      try {
        const ciModule = await import("../../src/index.js");
        const ciBaseConfig = ciModule.baseConfig;

        expect(ciBaseConfig.retries).toBe(2);
        expect(ciBaseConfig.workers).toBe(4);
        expect(ciBaseConfig.reporter?.[2]).toEqual(["github"]);
        expect((ciBaseConfig.projects ?? []).length).toBe(6);
        expect(ciBaseConfig.webServer).toBeUndefined();
      } finally {
        if (previousCI === undefined) {
          delete process.env.CI;
        } else {
          process.env.CI = previousCI;
        }
        vi.resetModules();
      }
    });

    it("merges custom CI options while preserving CI defaults", () => {
      const customProjects = [{ name: "ci-custom", use: {} }];
      const config = createCIConfig({
        timeout: 60000,
        projects: customProjects,
        use: {
          headless: false,
        },
      });

      expect(config.timeout).toBe(60000);
      expect(config.projects).toEqual(customProjects);
      expect(config.use?.headless).toBe(false);
      expect(config.retries).toBe(3);
      expect(config.workers).toBe(4);
    });
  });
});
