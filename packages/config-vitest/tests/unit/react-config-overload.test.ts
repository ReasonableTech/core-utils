import { afterEach, describe, expect, it } from "vitest";
import type { PluginOption } from "vite";

import {
  createReactConfig,
  createReactConfigWithPlugins,
  reactConfig,
} from "../../src/react.js";
import {
  expectNoAtAlias,
  getAliasMap,
} from "../helpers/assertions/alias-assertions.js";
import { resolveConfigExport } from "../helpers/config-export.js";
import {
  cleanupTempProjects,
  createTempProject,
} from "../fixtures/temp-project.js";

afterEach(() => {
  cleanupTempProjects();
});

describe("createReactConfig overloads", () => {
  describe("Core use cases", () => {
    it("builds aliases and auto-detects vitest setup file from project directory", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-react",
        withVitestSetup: true,
      });

      const configExport = createReactConfig(projectDir);
      const config = await resolveConfigExport(configExport);
      const aliases = getAliasMap(config.resolve?.alias);

      expect(aliases["@"]).toBe(`${projectDir}/src`);
      expect(aliases["@reasonabletech/example-react"]).toBe(`${projectDir}/src`);
      expect(config.test?.setupFiles).toEqual(["./vitest.setup.ts"]);
      expect(config.test?.include).toEqual(["tests/**/*.test.{ts,tsx,js,jsx}"]);
      expect(reactConfig.test.onConsoleLog()).toBeUndefined();
    });

    it("falls back to tests/setup.ts when vitest.setup.ts is not present", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-react-tests-setup",
        withTestsSetup: true,
      });

      const configExport = createReactConfig(projectDir);
      const config = await resolveConfigExport(configExport);

      expect(config.test?.setupFiles).toEqual(["./tests/setup.ts"]);
    });

    it("leaves setup files undefined when no recognized setup file exists", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-react-no-setup",
      });

      const configExport = createReactConfig(projectDir);
      const config = await resolveConfigExport(configExport);

      expect(config.test?.setupFiles).toBeUndefined();
    });

    it("respects explicit setup and include configuration from consumers", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-react-custom",
        withVitestSetup: true,
        withTestsSetup: true,
      });

      const configExport = createReactConfig(projectDir, {
        test: {
          setupFiles: ["./custom-setup.ts"],
          include: ["custom/**/*.test.ts"],
        },
      });
      const config = await resolveConfigExport(configExport);

      expect(config.test?.setupFiles).toEqual(["./custom-setup.ts"]);
      expect(config.test?.include).toEqual(["custom/**/*.test.ts"]);
    });
  });

  describe("Edge cases", () => {
    it("supports config-only overload without project directory aliases", async () => {
      const configExport = createReactConfig({
        test: {
          setupFiles: ["./inline-setup.ts"],
          include: ["tests/unit/*.test.ts"],
        },
      });
      const config = await resolveConfigExport(configExport);

      expectNoAtAlias(config.resolve?.alias);
      expect(config.test?.setupFiles).toEqual(["./inline-setup.ts"]);
      expect(config.test?.include).toEqual(["tests/unit/*.test.ts"]);
    });

    it("does not create self-package alias when package name cannot be read", async () => {
      const projectDir = createTempProject({ withVitestSetup: true });

      const configExport = createReactConfig(projectDir);
      const config = await resolveConfigExport(configExport);
      const aliases = getAliasMap(config.resolve?.alias);

      expect(aliases["@"]).toBe(`${projectDir}/src`);
      expect(aliases[""]).toBeUndefined();
    });

    it("supports plugin overload with empty project directory", async () => {
      const customPlugin: PluginOption = { name: "custom-plugin" };
      const configExport = createReactConfigWithPlugins([customPlugin], "");
      const config = await resolveConfigExport(configExport);

      expectNoAtAlias(config.resolve?.alias);
      expect(config.test?.setupFiles).toBeUndefined();
      expect(config.test?.include).toEqual(["tests/**/*.test.{ts,tsx,js,jsx}"]);
    });

    it("supports calling createReactConfigWithPlugins without arguments", async () => {
      const configExport = createReactConfigWithPlugins();
      const config = await resolveConfigExport(configExport);

      expectNoAtAlias(config.resolve?.alias);
      expect(config.test?.include).toEqual(["tests/**/*.test.{ts,tsx,js,jsx}"]);
    });
  });
});
