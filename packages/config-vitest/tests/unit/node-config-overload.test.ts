import { describe, expect, it } from "vitest";

import { createNodeConfig } from "../../src/node.js";
import { expectNoAtAlias } from "../helpers/assertions/alias-assertions.js";
import { resolveConfigExport } from "../helpers/config-export.js";

describe("createNodeConfig overloads", () => {
  describe("Core Functionality", () => {
    it("uses the project directory to set the @ alias", async () => {
      const configExport = createNodeConfig("/repo/apps/example-service", {
        test: {
          setupFiles: ["./custom-setup.ts"],
        },
      });
      const config = await resolveConfigExport(configExport);

      expect(config.resolve?.alias).toMatchObject({
        "@": "/repo/apps/example-service/src",
      });
      expect(config.test?.setupFiles).toEqual(["./custom-setup.ts"]);
    });

    it("does not set the @ alias when no project directory is provided", async () => {
      const configExport = createNodeConfig({
        test: {
          setupFiles: ["./custom-setup.ts"],
        },
      });
      const config = await resolveConfigExport(configExport);

      // Vite aliases can be an array or a map; assert against both shapes.
      expectNoAtAlias(config.resolve?.alias);
      expect(config.test?.setupFiles).toEqual(["./custom-setup.ts"]);
    });

    it("uses default node config when only project directory is provided", async () => {
      const configExport = createNodeConfig("/repo/apps/example-service");
      const config = await resolveConfigExport(configExport);

      expect(config.resolve?.alias).toMatchObject({
        "@": "/repo/apps/example-service/src",
      });
      expect(config.test?.environment).toBe("node");
      expect(config.test?.include).toEqual(["tests/**/*.test.ts"]);
    });
  });
});
