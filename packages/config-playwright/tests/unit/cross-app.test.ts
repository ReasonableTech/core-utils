/**
 * Unit tests for cross-app Playwright configuration module
 * Tests multi-app and specialized configuration functions
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  crossAppConfig,
  accessibilityConfig,
  performanceConfig,
  createCrossAppConfig,
  createAccessibilityConfig,
  createPerformanceConfig,
  createAuthWorkflowConfig,
  createAuthTestConfig,
} from "../../src/cross-app.js";
import {
  crossAppTestEnvironments,
  emptyBaseUrlEnvironment,
} from "../fixtures/cross-app-environments.js";
import { getProjectNames } from "../helpers/project-utils.js";

describe("Playwright Config - Cross-App Module", () => {
  beforeEach(() => {
    delete process.env.TEST_ENV;
  });

  describe("crossAppConfig", () => {
    it("should be configured for cross-app testing directory", () => {
      expect(crossAppConfig.testDir).toBe("./tests/acceptance/cross-app");
    });

    it("should have extended action timeout for navigation", () => {
      expect(crossAppConfig.use?.actionTimeout).toBe(10000);
    });

    it("should have extended navigation timeout", () => {
      expect(crossAppConfig.use?.navigationTimeout).toBe(15000);
    });

    it("should include extra HTTP headers for compatibility", () => {
      expect(crossAppConfig.use?.extraHTTPHeaders?.Accept).toContain("text/html");
    });

    it("should reference auth storage state", () => {
      expect(crossAppConfig.use?.storageState).toBe(
        "tests/fixtures/auth/cross-app-authenticated.json",
      );
    });

    it("should enable video and trace for debugging", () => {
      expect(crossAppConfig.use?.video).toBe("retain-on-failure");
      expect(crossAppConfig.use?.trace).toBe("retain-on-failure");
    });
  });

  describe("accessibilityConfig", () => {
    it("should be configured for accessibility tests", () => {
      expect(accessibilityConfig.testDir).toBe("./tests/acceptance/accessibility");
    });

    it("should have slower execution timeouts", () => {
      expect(accessibilityConfig.use?.actionTimeout).toBe(15000);
      expect(accessibilityConfig.use?.navigationTimeout).toBe(20000);
    });

    it("should match the test match pattern", () => {
      expect(accessibilityConfig.testMatch).toBe("**/*.{test,spec}.{ts,js}");
    });
  });

  describe("performanceConfig", () => {
    it("should be configured for performance tests", () => {
      expect(performanceConfig.testDir).toBe("./tests/acceptance/performance");
    });

    it("should disable parallel execution for accurate measurements", () => {
      expect(performanceConfig.fullyParallel).toBe(false);
    });

    it("should use single worker for performance testing", () => {
      expect(performanceConfig.workers).toBe(1);
    });

    it("should have extended timeouts for measurements", () => {
      expect(performanceConfig.use?.actionTimeout).toBe(30000);
      expect(performanceConfig.use?.navigationTimeout).toBe(45000);
    });

    it("should disable video and screenshot for minimal interference", () => {
      expect(performanceConfig.use?.video).toBe("off");
      expect(performanceConfig.use?.screenshot).toBe("off");
      expect(performanceConfig.use?.trace).toBe("off");
    });
  });

  describe("createAuthWorkflowConfig", () => {
    const authWorkflowConfig = createAuthWorkflowConfig({
      domain: ".reasonabletech.io",
      expectedPersistence: [
        "accounts.reasonabletech.io",
        "app.reasonabletech.io",
      ],
    });

    it("should have cookie configuration for cross-domain auth", () => {
      expect(authWorkflowConfig.cookieConfig.domain).toBe(".reasonabletech.io");
    });

    it("should have secure cookie settings", () => {
      expect(authWorkflowConfig.cookieConfig.secure).toBe(true);
      expect(authWorkflowConfig.cookieConfig.httpOnly).toBe(true);
    });

    it("should have lax SameSite policy", () => {
      expect(authWorkflowConfig.cookieConfig.sameSite).toBe("lax");
    });

    it("should list expected auth persistence domains", () => {
      expect(authWorkflowConfig.expectedPersistence).toContain(
        "accounts.reasonabletech.io",
      );
      expect(authWorkflowConfig.expectedPersistence).toContain(
        "app.reasonabletech.io",
      );
    });
  });

  describe("createCrossAppConfig", () => {
    it("should use development environment by default", () => {
      delete process.env.TEST_ENV;
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("http://localhost:3000");
    });

    it("should use staging environment when TEST_ENV is staging", () => {
      process.env.TEST_ENV = "staging";
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("https://staging.reasonabletech.io");
    });

    it("should have three cross-app browser projects", () => {
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(Array.isArray(config.projects)).toBe(true);
      expect((config.projects ?? []).length).toBe(3);
    });

    it("should include chromium, firefox, and webkit projects", () => {
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      const names = getProjectNames(config);
      expect(names).toContain("cross-app-chromium");
      expect(names).toContain("cross-app-firefox");
      expect(names).toContain("cross-app-webkit");
    });

    it("should configure cross-app specific viewport", () => {
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      const projects = config.projects ?? [];
      projects.forEach((project) => {
        expect(project.use?.viewport).toEqual({
          width: 1920,
          height: 1080,
        });
      });
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 60000 };
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: custom,
      });
      expect(config.timeout).toBe(60000);
    });

    it("should preserve merge of use configuration", () => {
      const custom = { use: { headless: true } };
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: custom,
      });
      expect(config.use?.headless).toBe(true);
      expect(config.use?.baseURL).toBe("http://localhost:3000");
    });

    it("should throw when selected environment has no base URLs", () => {
      const emptyBaseUrlEnvironments = emptyBaseUrlEnvironment;

      expect(() => {
        createCrossAppConfig({ environments: emptyBaseUrlEnvironments });
      }).toThrow('must define at least one base URL');
    });
  });

  describe("createAccessibilityConfig", () => {
    it("should have only chromium for accessibility tests", () => {
      const config = createAccessibilityConfig();
      const projects = config.projects ?? [];
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe("accessibility-chromium");
    });

    it("should configure accessibility test directory", () => {
      const config = createAccessibilityConfig();
      const projects = config.projects ?? [];
      expect(projects[0].testDir).toBe("./tests/acceptance/accessibility");
    });

    it("should have standard viewport for accessibility tests", () => {
      const config = createAccessibilityConfig();
      const projects = config.projects ?? [];
      expect(projects[0].use?.viewport).toEqual({
        width: 1280,
        height: 720,
      });
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 45000 };
      const config = createAccessibilityConfig(custom);
      expect(config.timeout).toBe(45000);
    });
  });

  describe("createPerformanceConfig", () => {
    it("should disable parallel execution", () => {
      const config = createPerformanceConfig();
      expect(config.fullyParallel).toBe(false);
    });

    it("should use single worker", () => {
      const config = createPerformanceConfig();
      expect(config.workers).toBe(1);
    });

    it("should have only chromium for performance tests", () => {
      const config = createPerformanceConfig();
      const projects = config.projects ?? [];
      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe("performance-chromium");
    });

    it("should configure performance test directory", () => {
      const config = createPerformanceConfig();
      const projects = config.projects ?? [];
      expect(projects[0].testDir).toBe("./tests/acceptance/performance");
    });

    it("should have extended viewport for performance tests", () => {
      const config = createPerformanceConfig();
      const projects = config.projects ?? [];
      expect(projects[0].use?.viewport).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 60000 };
      const config = createPerformanceConfig(custom);
      expect(config.timeout).toBe(60000);
      expect(config.fullyParallel).toBe(false);
    });
  });

  describe("createAuthTestConfig", () => {
    it("should not have pre-authenticated storage state", () => {
      const config = createAuthTestConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.storageState).toBeUndefined();
    });

    it("should use cross-app as foundation", () => {
      const config = createAuthTestConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("http://localhost:3000");
    });

    it("should override testDir for auth tests", () => {
      const config = createAuthTestConfig({ environments: crossAppTestEnvironments });
      expect(config.testDir).toBe("./tests/acceptance/auth");
    });

    it("should merge custom configuration", () => {
      const custom = { timeout: 45000 };
      const config = createAuthTestConfig({
        environments: crossAppTestEnvironments,
        customConfig: custom,
      });
      expect(config.timeout).toBe(45000);
    });
  });

  describe("Environment handling", () => {
    it("should handle development environment correctly", () => {
      process.env.TEST_ENV = "development";
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("http://localhost:3000");
    });

    it("should handle staging environment correctly", () => {
      process.env.TEST_ENV = "staging";
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("https://staging.reasonabletech.io");
    });

    it("should handle invalid TEST_ENV value", () => {
      process.env.TEST_ENV = "invalid";
      // Invalid TEST_ENV value causes an error since crossAppTestEnvironments['invalid'] is undefined
      expect(() => createCrossAppConfig({ environments: crossAppTestEnvironments })).toThrow();
    });
  });

  describe("Configuration completeness", () => {
    it("should create different configs for different functions", () => {
      const cross = createCrossAppConfig({ environments: crossAppTestEnvironments });
      const accessibility = createAccessibilityConfig();
      const performance = createPerformanceConfig();
      const auth = createAuthTestConfig({ environments: crossAppTestEnvironments });

      expect(cross !== accessibility).toBe(true);
      expect(accessibility !== performance).toBe(true);
      expect(performance !== auth).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty custom config by keeping cross-app defaults", () => {
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: {},
      });
      expect(config.use?.baseURL).toBe("http://localhost:3000");
      expect((config.projects ?? []).length).toBe(3);
    });

    it("should handle undefined custom config by keeping cross-app defaults", () => {
      const config = createCrossAppConfig({ environments: crossAppTestEnvironments });
      expect(config.use?.baseURL).toBe("http://localhost:3000");
      expect((config.projects ?? []).length).toBe(3);
    });

    it("should allow partial use override in cross-app config", () => {
      const custom = {
        use: {
          headless: false,
        },
      };
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: custom,
      });
      expect(config.use?.headless).toBe(false);
      expect(config.use?.baseURL).toBe("http://localhost:3000");
    });

    it("should preserve base configuration for accessibility", () => {
      const config = createAccessibilityConfig();
      expect(config.testDir).toBe("./tests/acceptance/accessibility");
      expect(config.use?.actionTimeout).toBe(15000);
    });

    it("should preserve performance configuration settings", () => {
      const config = createPerformanceConfig();
      expect(config.fullyParallel).toBe(false);
      expect(config.workers).toBe(1);
      expect(config.use?.video).toBe("off");
    });
  });
});
