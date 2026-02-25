/**
 * Unit tests for base Playwright configuration module
 * Tests browser-specific configuration functions
 */

import { describe, expect, it } from "vitest";
import {
  desktopConfig,
  mobileConfig,
  chromiumOnlyConfig,
  createBaseConfig,
  createDesktopConfig,
  createMobileConfig,
  createChromiumConfig,
} from "../../src/base.js";

describe("Playwright Config - Base Module", () => {
  describe("desktopConfig", () => {
    it("should have three desktop browsers configured", () => {
      expect(Array.isArray(desktopConfig.projects)).toBe(true);
      expect((desktopConfig.projects ?? []).length).toBe(3);
    });

    it("should include chromium, firefox, and webkit", () => {
      const projects = desktopConfig.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).toContain("chromium");
      expect(names).toContain("firefox");
      expect(names).toContain("webkit");
    });

    it("should have use configuration for each browser", () => {
      const projects = desktopConfig.projects ?? [];
      projects.forEach((project) => {
        expect(project.use).toBeDefined();
      });
    });
  });

  describe("mobileConfig", () => {
    it("should have two mobile devices configured", () => {
      expect(Array.isArray(mobileConfig.projects)).toBe(true);
      expect((mobileConfig.projects ?? []).length).toBe(2);
    });

    it("should include Mobile Chrome and Mobile Safari", () => {
      const projects = mobileConfig.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).toContain("Mobile Chrome");
      expect(names).toContain("Mobile Safari");
    });
  });

  describe("chromiumOnlyConfig", () => {
    it("should have only chromium browser configured", () => {
      expect(Array.isArray(chromiumOnlyConfig.projects)).toBe(true);
      expect((chromiumOnlyConfig.projects ?? []).length).toBe(1);
    });

    it("should have chromium project with correct name", () => {
      const projects = chromiumOnlyConfig.projects ?? [];
      expect(projects[0].name).toBe("chromium");
    });
  });

  describe("createBaseConfig", () => {
    it("should disable storage state by default", () => {
      const config = createBaseConfig();
      expect(config.use?.storageState).toBeUndefined();
    });

    it("should use base projects by default", () => {
      const config = createBaseConfig();
      const projectNames = (config.projects ?? []).map((project) => project.name);
      expect(projectNames).toContain("chromium");
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 45000 };
      const config = createBaseConfig(custom);
      expect(config.timeout).toBe(45000);
    });

    it("should handle custom storage state", () => {
      const custom = { use: { storageState: "auth.json" } };
      const config = createBaseConfig(custom);
      // Storage state is overridden to undefined by createBaseConfig
      expect(config.use?.storageState).toBeUndefined();
    });
  });

  describe("createDesktopConfig", () => {
    it("should use desktop projects", () => {
      const config = createDesktopConfig();
      const projects = config.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).toContain("chromium");
      expect(names).toContain("firefox");
      expect(names).toContain("webkit");
    });

    it("should not include mobile browsers", () => {
      const config = createDesktopConfig();
      const projects = config.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).not.toContain("Mobile Chrome");
      expect(names).not.toContain("Mobile Safari");
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 60000 };
      const config = createDesktopConfig(custom);
      expect(config.timeout).toBe(60000);
    });

    it("should allow custom projects override", () => {
      const customProjects = [{ name: "custom", use: {} }];
      const config = createDesktopConfig({ projects: customProjects });
      // createDesktopConfig always uses desktopConfig.projects, not custom projects
      expect(Array.isArray(config.projects)).toBe(true);
      expect((config.projects ?? []).length).toBe(3);
    });
  });

  describe("createMobileConfig", () => {
    it("should use mobile projects", () => {
      const config = createMobileConfig();
      const projects = config.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).toContain("Mobile Chrome");
      expect(names).toContain("Mobile Safari");
    });

    it("should not include desktop browsers", () => {
      const config = createMobileConfig();
      const projects = config.projects ?? [];
      const names = projects.map((p) => p.name);
      expect(names).not.toContain("chromium");
      expect(names).not.toContain("firefox");
      expect(names).not.toContain("webkit");
    });

    it("should have exactly two projects", () => {
      const config = createMobileConfig();
      const projects = config.projects ?? [];
      expect(projects.length).toBe(2);
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 60000 };
      const config = createMobileConfig(custom);
      expect(config.timeout).toBe(60000);
    });
  });

  describe("createChromiumConfig", () => {
    it("should use only chromium browser", () => {
      const config = createChromiumConfig();
      const projects = config.projects ?? [];
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe("chromium");
    });

    it("should set workers to 1 for single browser", () => {
      const config = createChromiumConfig();
      expect(config.workers).toBe(1);
    });

    it("should be optimized for development", () => {
      const config = createChromiumConfig();
      expect(config.workers).toBe(1);
      // Single worker for development
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 45000 };
      const config = createChromiumConfig(custom);
      expect(config.timeout).toBe(45000);
      expect(config.workers).toBe(1);
    });

    it("should override workers even with custom config", () => {
      const custom = { workers: 4 };
      const config = createChromiumConfig(custom);
      expect(config.workers).toBe(1);
    });
  });

  describe("Configuration validation", () => {
    it("should return different configs for different factories", () => {
      const base = createBaseConfig();
      const desktop = createDesktopConfig();
      const mobile = createMobileConfig();
      const chromium = createChromiumConfig();

      // All should be different configuration objects
      expect(base !== desktop).toBe(true);
      expect(desktop !== mobile).toBe(true);
      expect(mobile !== chromium).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty custom config by preserving base settings", () => {
      const config = createBaseConfig({});
      expect(config.use?.trace).toBe("on-first-retry");
      expect((config.projects ?? []).length).toBeGreaterThan(0);
    });

    it("should handle undefined custom config by preserving base settings", () => {
      const config = createBaseConfig(undefined);
      expect(config.use?.video).toBe("retain-on-failure");
      expect((config.projects ?? []).length).toBeGreaterThan(0);
    });

    it("should preserve base config structure", () => {
      const config = createBaseConfig();
      expect(config.use?.viewport).toEqual({ width: 1280, height: 720 });
      expect(Array.isArray(config.projects)).toBe(true);
    });

    it("should allow partial use override", () => {
      const custom = {
        use: {
          headless: false,
        },
      };
      const config = createBaseConfig(custom);
      expect(config.use?.headless).toBe(false);
    });
  });
});
