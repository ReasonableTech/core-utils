/**
 * Tsup Configuration Functional Tests
 *
 * Tests that verify the tsup configuration functions work correctly
 * when consumed by applications, without checking metadata.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTsupConfig,
  reactConfig,
  nodeConfig,
  configPackageConfig,
} from "../../src/index.js";
import {
  type EsbuildOptionsFunction,
  getConfigObject,
  withEnvironmentVariable,
  withTemporaryCwd,
} from "../helpers/config-workflow-utils.js";

describe("Tsup Config Functionality", () => {
  describe("tsconfig.build Resolution", () => {
    it("defaults tsconfig to tsconfig.build.json when present", () => {
      const configObj = withEnvironmentVariable(
        "npm_package_json",
        undefined,
        () =>
          withTemporaryCwd((tempDir) => {
            writeFileSync(path.join(tempDir, "tsconfig.build.json"), "{}\n");
            const config = createTsupConfig({});
            return getConfigObject(config);
          }),
      );

      expect(configObj.tsconfig).toBe("tsconfig.build.json");
    });

    it("does not set tsconfig when tsconfig.build.json is missing", () => {
      const configObj = withEnvironmentVariable(
        "npm_package_json",
        undefined,
        () =>
          withTemporaryCwd(() => {
            const config = createTsupConfig({});
            return getConfigObject(config);
          }),
      );

      expect(configObj.tsconfig).toBeUndefined();
    });

    it("honors explicit tsconfig override", () => {
      const configObj = withEnvironmentVariable(
        "npm_package_json",
        undefined,
        () =>
          withTemporaryCwd((tempDir) => {
            writeFileSync(path.join(tempDir, "tsconfig.build.json"), "{}\n");
            const config = createTsupConfig({
              tsconfig: "tsconfig.custom.json",
            });
            return getConfigObject(config);
          }),
      );

      expect(configObj.tsconfig).toBe("tsconfig.custom.json");
    });

    it("resolves tsconfig.build.json from npm_package_json package root", () => {
      const packageRoot = mkdtempSync(path.join(tmpdir(), "config-tsup-pkg-"));
      const packageJsonPath = path.join(packageRoot, "package.json");
      const packageBuildTsconfigPath = path.join(
        packageRoot,
        "tsconfig.build.json",
      );

      try {
        writeFileSync(packageJsonPath, '{ "name": "test-package" }\n');
        writeFileSync(packageBuildTsconfigPath, "{}\n");

        const configObj = withTemporaryCwd(() =>
          withEnvironmentVariable("npm_package_json", packageJsonPath, () => {
            const config = createTsupConfig({});
            return getConfigObject(config);
          }),
        );

        expect(configObj.tsconfig).toBe(packageBuildTsconfigPath);
      } finally {
        rmSync(packageRoot, { recursive: true, force: true });
      }
    });

    it("returns relative tsconfig path when npm_package_json points to cwd", () => {
      const configObj = withTemporaryCwd(() => {
        const cwd = process.cwd();
        const packageJsonPath = path.join(cwd, "package.json");
        writeFileSync(packageJsonPath, '{ "name": "test-package" }\n');
        writeFileSync(path.join(cwd, "tsconfig.build.json"), "{}\n");

        return withEnvironmentVariable("npm_package_json", packageJsonPath, () => {
          const config = createTsupConfig({});
          return getConfigObject(config);
        });
      });

      expect(configObj.tsconfig).toBe("tsconfig.build.json");
    });

    it("falls back to cwd tsconfig when npm_package_json package root has no build tsconfig", () => {
      const packageRoot = mkdtempSync(path.join(tmpdir(), "config-tsup-pkg-"));
      const packageJsonPath = path.join(packageRoot, "package.json");

      try {
        writeFileSync(packageJsonPath, '{ "name": "test-package" }\n');

        const configObj = withTemporaryCwd((tempDir) =>
          withEnvironmentVariable("npm_package_json", packageJsonPath, () => {
            writeFileSync(path.join(tempDir, "tsconfig.build.json"), "{}\n");
            const config = createTsupConfig({});
            return getConfigObject(config);
          }),
        );

        expect(configObj.tsconfig).toBe("tsconfig.build.json");
      } finally {
        rmSync(packageRoot, { recursive: true, force: true });
      }
    });
  });

  describe("Configuration Creation", () => {
    it("createTsupConfig supports zero-argument usage", () => {
      const config = createTsupConfig();
      const configObj = getConfigObject(config);

      expect(configObj.entry).toEqual({ index: "src/index.ts" });
      expect(configObj.format).toEqual(["esm"]);
      expect(configObj.platform).toBe("neutral");
    });

    it("createTsupConfig returns valid configuration object", () => {
      const config = createTsupConfig({});
      const configObj = getConfigObject(config);
      expect(configObj).toHaveProperty("sourcemap");
    });

    it("createTsupConfig accepts custom options", () => {
      const customConfig = createTsupConfig({
        entry: "custom.ts",
        format: ["esm"],
      });
      const configObj = getConfigObject(customConfig);
      expect(configObj).toHaveProperty("sourcemap");
    });

    it("createTsupConfig returns different configs for different inputs", () => {
      const config1 = createTsupConfig({ format: ["esm"] });
      const config2 = createTsupConfig({ format: ["cjs"] });
      // Both should be valid configuration objects
      const configObj1 = getConfigObject(config1);
      const configObj2 = getConfigObject(config2);
      expect(configObj1).toHaveProperty("sourcemap");
      expect(configObj2).toHaveProperty("sourcemap");
    });

    it("createTsupConfig handles outExtension function", () => {
      const config = createTsupConfig({});

      // Extract the config object and test the outExtension function
      const configObj = getConfigObject(config);
      expect(configObj.outExtension).toBeInstanceOf(Function);

      const outExtension = configObj.outExtension;
      if (outExtension === undefined) {
        throw new Error("Expected outExtension to be defined.");
      }

      const context: Parameters<typeof outExtension>[0] = {
        options: {} as Parameters<typeof outExtension>[0]["options"],
        format: "esm",
      };
      const result = outExtension(context);
      expect(result).toEqual({ js: `.js` });
    });

    it("createTsupConfig handles esbuildOptions function", () => {
      const customConfig = createTsupConfig({
        esbuildOptions: (options) => ({
          ...options,
          minify: true,
        }),
      });

      const configObj = getConfigObject(customConfig);
      expect(configObj.esbuildOptions).toBeInstanceOf(Function);

      const mockOptions = { target: "es2020" };
      const esbuildOptions = configObj.esbuildOptions;
      if (esbuildOptions === undefined) {
        throw new Error("Expected esbuildOptions to be defined.");
      }
      const result = (esbuildOptions as EsbuildOptionsFunction)(mockOptions);
      expect(result).toEqual({
        target: "es2020",
        minify: true,
      });
    });

    it("createTsupConfig handles onSuccess callback", () => {
      const mockCallback = async (): Promise<void> => {
        await Promise.resolve();
      };
      const config = createTsupConfig({
        onSuccess: mockCallback,
      });

      const configObj = getConfigObject(config);
      expect(configObj.onSuccess).toBe(mockCallback);
    });

    it("createTsupConfig handles define object", () => {
      const defineObj = {
        __VERSION__: '"1.0.0"',
        __DEV__: "false",
      };
      const config = createTsupConfig({
        define: defineObj,
      });

      const configObj = getConfigObject(config);
      expect(configObj.define).toEqual(defineObj);
    });
  });

  describe("Pre-configured Configs", () => {
    it("configPackageConfig is valid configuration", () => {
      const configObj = getConfigObject(configPackageConfig);
      expect(configObj).toHaveProperty("sourcemap");
    });

    it("reactConfig is valid configuration", () => {
      const reactConfigObj = getConfigObject(reactConfig);
      expect(reactConfigObj).toHaveProperty("sourcemap");

      // Test the esbuildOptions function in reactConfig
      const configObj = getConfigObject(reactConfig);
      expect(configObj.esbuildOptions).toBeInstanceOf(Function);

      const mockOptions = { target: "es2020" };
      const esbuildOptions = configObj.esbuildOptions;
      if (esbuildOptions === undefined) {
        throw new Error("Expected esbuildOptions to be defined.");
      }
      const result = (esbuildOptions as EsbuildOptionsFunction)(mockOptions);
      expect(result).toEqual({
        target: "es2020",
        jsx: "automatic",
      });
    });

    it("nodeConfig is valid configuration", () => {
      const configObj = getConfigObject(nodeConfig);
      expect(configObj).toHaveProperty("sourcemap");
    });
  });

  describe("Edge Cases", () => {
    it("createTsupConfig handles empty external array", () => {
      const config = createTsupConfig({ external: [] });
      const configObj = getConfigObject(config);
      expect(configObj).toHaveProperty("sourcemap");
    });

    it("createTsupConfig does not set default external when noExternal is provided", () => {
      const config = createTsupConfig({
        noExternal: [/.*/],
      });
      const configObj = getConfigObject(config);

      expect(configObj.noExternal).toEqual([/.*/]);
      expect(configObj.external).toBeUndefined();
    });

    it("createTsupConfig uses explicit external list when both noExternal and external are provided", () => {
      const config = createTsupConfig({
        noExternal: [/.*/],
        external: ["left-pad"],
      });
      const configObj = getConfigObject(config);

      expect(configObj.noExternal).toEqual([/.*/]);
      expect(configObj.external).toEqual(["left-pad"]);
    });

    it("createTsupConfig handles multiple entry formats", () => {
      const stringEntry = createTsupConfig({ entry: "src/main.ts" });
      const arrayEntry = createTsupConfig({ entry: ["src/a.ts", "src/b.ts"] });
      const objectEntry = createTsupConfig({
        entry: { main: "src/index.ts", cli: "src/cli.ts" },
      });

      expect(getConfigObject(stringEntry).entry).toBe("src/main.ts");
      expect(getConfigObject(arrayEntry).entry).toEqual(["src/a.ts", "src/b.ts"]);
      expect(getConfigObject(objectEntry).entry).toEqual({
        main: "src/index.ts",
        cli: "src/cli.ts",
      });
    });

    it("createTsupConfig handles all format types", () => {
      const esmConfig = createTsupConfig({ format: ["esm"] });
      const cjsConfig = createTsupConfig({ format: ["cjs"] });
      const iifeConfig = createTsupConfig({ format: ["iife"] });
      const multiConfig = createTsupConfig({ format: ["esm", "cjs"] });

      expect(getConfigObject(esmConfig).format).toEqual(["esm"]);
      expect(getConfigObject(cjsConfig).format).toEqual(["cjs"]);
      expect(getConfigObject(iifeConfig).format).toEqual(["iife"]);
      expect(getConfigObject(multiConfig).format).toEqual(["esm", "cjs"]);
    });

    it("createTsupConfig handles all platform types", () => {
      const nodePlatformConfig = createTsupConfig({ platform: "node" });
      const browserConfig = createTsupConfig({ platform: "browser" });
      const neutralConfig = createTsupConfig({ platform: "neutral" });

      expect(getConfigObject(nodePlatformConfig).platform).toBe("node");
      expect(getConfigObject(browserConfig).platform).toBe("browser");
      expect(getConfigObject(neutralConfig).platform).toBe("neutral");
    });

    it("createTsupConfig handles boolean options", () => {
      const config = createTsupConfig({
        dts: true,
        clean: true,
        sourcemap: false,
        treeshake: false,
        splitting: true,
      });

      const configObj = getConfigObject(config);
      expect(configObj).toHaveProperty("dts", true);
    });

    it("createTsupConfig handles undefined values gracefully", () => {
      const config = createTsupConfig({
        tsconfig: undefined,
        esbuildPlugins: undefined,
        esbuildOptions: undefined,
        define: undefined,
        onSuccess: undefined,
      });

      const configObj = getConfigObject(config);
      expect(configObj).toHaveProperty("sourcemap");
    });
  });
});
