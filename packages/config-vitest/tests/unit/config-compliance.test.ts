/**
 * Vitest Configuration Compliance Tests
 *
 * Minimal tests for configuration package - verifies configs can be created without errors.
 * Detailed testing happens through consumption in other packages.
 */

import { describe, expect, it } from "vitest";
import { createNodeConfig } from "../../src/node.js";
import { createReactConfig } from "../../src/react.js";
import { createVitestConfig } from "../../src/index.js";
import { expectIncludesSetupFile } from "../helpers/assertions/config-assertions.js";

describe("Vitest Config Compliance", () => {
  describe("Configuration Functions", () => {
    it("createVitestConfig returns a config with test options", () => {
      const config = createVitestConfig();
      expect(config).toHaveProperty("test");
    });

    it("createNodeConfig returns a config with test options", () => {
      const config = createNodeConfig();
      expect(config).toHaveProperty("test");
    });

    it("createReactConfig returns a config with test options", () => {
      const config = createReactConfig();
      expect(config).toHaveProperty("test");
    });

    it("accepts custom options", () => {
      const customOptions = {
        test: {
          setupFiles: ["./custom-setup.ts"],
        },
      };

      const nodeConfig = createNodeConfig(customOptions);
      const reactConfig = createReactConfig(customOptions);
      const vitestConfig = createVitestConfig(customOptions);

      expectIncludesSetupFile(nodeConfig, "./custom-setup.ts");
      expectIncludesSetupFile(reactConfig, "./custom-setup.ts");
      expectIncludesSetupFile(vitestConfig, "./custom-setup.ts");
    });
  });
});
