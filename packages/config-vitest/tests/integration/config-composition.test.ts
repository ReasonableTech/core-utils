import { afterEach, describe, expect, it } from "vitest";

import {
  createLongRunningTestConfig,
  createVitestConfig,
} from "../../src/index.js";
import { createNodeConfig } from "../../src/node.js";
import { createReactConfig } from "../../src/react.js";
import { getAliasMap } from "../helpers/assertions/alias-assertions.js";
import { resolveConfigExport } from "../helpers/config-export.js";
import {
  cleanupTempProjects,
  createTempProject,
} from "../fixtures/temp-project.js";

afterEach(() => {
  cleanupTempProjects();
});

describe("vitest config composition", () => {
  describe("Core use cases", () => {
    it("composes node config aliases and explicit setup overrides", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-node",
        withTestsSetup: true,
      });

      const config = await resolveConfigExport(
        createNodeConfig(projectDir, {
          test: {
            setupFiles: ["./custom-node-setup.ts"],
          },
        }),
      );

      const aliases = getAliasMap(config.resolve?.alias);
      expect(aliases["@"]).toBe(`${projectDir}/src`);
      expect(aliases["@reasonabletech/example-node"]).toBe(`${projectDir}/src`);
      expect(config.test?.environment).toBe("node");
      expect(config.test?.setupFiles).toEqual(["./custom-node-setup.ts"]);
    });

    it("composes react config with auto-detected setup files and base coverage settings", async () => {
      const projectDir = createTempProject({
        packageName: "@reasonabletech/example-react-integration",
        withVitestSetup: true,
      });

      const config = await resolveConfigExport(createReactConfig(projectDir));
      const aliases = getAliasMap(config.resolve?.alias);

      expect(aliases["@"]).toBe(`${projectDir}/src`);
      expect(config.test?.setupFiles).toEqual(["./vitest.setup.ts"]);
      expect(config.test?.coverage?.reportsDirectory).toBe(
        "./generated/test-coverage",
      );
    });
  });

  describe("Edge cases", () => {
    it("supports config-only usage without project aliases", async () => {
      const config = await resolveConfigExport(
        createVitestConfig({
          test: {
            include: ["tests/e2e/**/*.test.ts"],
          },
        }),
      );

      const aliases = getAliasMap(config.resolve?.alias);
      expect(aliases["@"]).toBeUndefined();
      expect(config.test?.include).toEqual(["tests/e2e/**/*.test.ts"]);
    });

    it("extends base config for long-running workflows without dropping coverage config", async () => {
      const config = await resolveConfigExport(
        createLongRunningTestConfig({
          test: {
            include: ["tests/integration/**/*.test.ts"],
          },
        }),
      );

      expect(config.test?.testTimeout).toBe(30000);
      expect(config.test?.hookTimeout).toBe(30000);
      expect(config.test?.coverage?.provider).toBe("v8");
      expect(config.test?.coverage?.reportsDirectory).toBe(
        "./generated/test-coverage",
      );
    });
  });
});
