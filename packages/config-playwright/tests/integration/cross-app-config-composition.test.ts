import { beforeEach, describe, expect, it } from "vitest";

import {
  createAuthTestConfig,
  createCrossAppConfig,
} from "../../src/cross-app.js";
import { createCIConfig } from "../../src/index.js";
import { crossAppTestEnvironments } from "../fixtures/cross-app-environments.js";
import { getProjectNames } from "../helpers/project-utils.js";

describe("cross-app config composition", () => {
  beforeEach(() => {
    delete process.env.TEST_ENV;
  });

  describe("Core use cases", () => {
    it("merges base, cross-app, and custom overrides for a development workflow", () => {
      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: {
          timeout: 60000,
          use: {
            headless: false,
          },
        },
      });

      expect(config.timeout).toBe(60000);
      expect(config.use?.headless).toBe(false);
      expect(config.use?.baseURL).toBe("http://localhost:3000");
      expect(config.use?.storageState).toBe(
        "tests/fixtures/auth/cross-app-authenticated.json",
      );
      expect(getProjectNames(config)).toEqual([
        "cross-app-chromium",
        "cross-app-firefox",
        "cross-app-webkit",
      ]);
    });

    it("applies auth workflow overrides on top of cross-app defaults", () => {
      const config = createAuthTestConfig({
        environments: crossAppTestEnvironments,
      });

      expect(config.testDir).toBe("./tests/acceptance/auth");
      expect(config.use?.storageState).toBeUndefined();
      expect(config.use?.baseURL).toBe("http://localhost:3000");
      expect((config.projects ?? []).length).toBe(3);
    });
  });

  describe("Edge cases", () => {
    it("keeps cross-app project matrix even when CI config is provided as custom overrides", () => {
      const ciOverrides = createCIConfig({
        use: {
          headless: false,
        },
      });

      const config = createCrossAppConfig({
        environments: crossAppTestEnvironments,
        customConfig: ciOverrides,
      });

      expect(config.retries).toBe(3);
      expect(config.workers).toBe(4);
      expect(config.use?.headless).toBe(false);
      expect(getProjectNames(config)).toEqual([
        "cross-app-chromium",
        "cross-app-firefox",
        "cross-app-webkit",
      ]);
    });
  });
});
