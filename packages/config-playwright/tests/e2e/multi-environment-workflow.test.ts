import { beforeEach, describe, expect, it } from "vitest";

import { createCrossAppConfig } from "../../src/cross-app.js";
import {
  crossAppTestEnvironments,
  emptyBaseUrlEnvironment,
} from "../fixtures/cross-app-environments.js";
import { getProjectNames } from "../helpers/project-utils.js";

describe("multi-environment cross-app workflow", () => {
  beforeEach(() => {
    delete process.env.TEST_ENV;
  });

  describe("Core use cases", () => {
    it("uses development defaults when TEST_ENV is not set", () => {
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
      });

      expect(config.use?.baseURL).toBe("http://localhost:3000");
      expect(config.testDir).toBe("./tests/acceptance/cross-app");
      expect(getProjectNames(config)).toEqual([
        "cross-app-chromium",
        "cross-app-firefox",
        "cross-app-webkit",
      ]);
    });

    it("switches to staging workflow when TEST_ENV=staging", () => {
      process.env.TEST_ENV = "staging";

      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
      });

      expect(config.use?.baseURL).toBe("https://staging.reasonabletech.io");
      expect(config.use?.trace).toBe("retain-on-failure");
    });
  });

  describe("Error handling", () => {
    it("throws a descriptive error for unknown environments", () => {
      process.env.TEST_ENV = "production";

      expect(() => {
        createCrossAppConfig({
          environments: crossAppTestEnvironments,
        });
      }).toThrow('Unknown test environment "production"');
    });

    it("throws when selected environment has no base URLs", () => {
      expect(() => {
        createCrossAppConfig({
          environments: emptyBaseUrlEnvironment,
        });
      }).toThrow('must define at least one base URL');
    });
  });
});
