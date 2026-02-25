import { describe, expect, it } from "vitest";

import {
  configPackageConfig,
  createTsupConfig,
  nodeConfig,
  reactConfig,
} from "../../src/index.js";
import {
  bundledWorkspaceBuildOptions,
  consumerLibraryBuildOptions,
} from "../fixtures/consumer-build-options.js";
import { getConfigObject } from "../helpers/config-workflow-utils.js";

describe("tsup preset composition", () => {
  describe("Core use cases", () => {
    it("merges consumer externals with platform defaults for library workflows", () => {
      const config = getConfigObject(
        createTsupConfig(consumerLibraryBuildOptions),
      );

      expect(config.entry).toEqual({
        index: "src/index.ts",
        cli: "src/cli.ts",
      });
      expect(config.format).toEqual(["esm", "cjs"]);
      expect(config.external).toContain("react");
      expect(config.external).toContain("zod");
      expect(config.define).toEqual({
        __FEATURE_FLAG__: "true",
      });
    });

    it("respects explicit external boundaries when noExternal is provided", () => {
      const config = getConfigObject(
        createTsupConfig(bundledWorkspaceBuildOptions),
      );

      expect(config.noExternal).toEqual([/^@reasonabletech\//]);
      expect(config.external).toEqual(["@reasonabletech/runtime"]);
    });

    it("keeps profile-specific behavior across shipped presets", () => {
      const reactPreset = getConfigObject(reactConfig);
      const nodePreset = getConfigObject(nodeConfig);
      const configPackagePreset = getConfigObject(configPackageConfig);

      expect(nodePreset.platform).toBe("node");
      expect(reactPreset.external).toContain("@mui/icons-material");
      expect(configPackagePreset.external).toContain("tsup");
      expect(configPackagePreset.external).toContain("esbuild");
    });
  });
});
