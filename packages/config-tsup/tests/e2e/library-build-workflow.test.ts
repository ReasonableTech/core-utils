import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { createTsupConfig } from "../../src/index.js";
import { consumerLibraryBuildOptions } from "../fixtures/consumer-build-options.js";
import {
  type EsbuildOptionsFunction,
  getConfigObject,
  withEnvironmentVariable,
  withTemporaryCwd,
} from "../helpers/config-workflow-utils.js";

describe("library build workflow", () => {
  describe("Core use cases", () => {
    it("resolves tsconfig from npm_package_json package root and keeps consumer settings", async () => {
      const packageRoot = mkdtempSync(path.join(tmpdir(), "config-tsup-pkg-"));
      const packageJsonPath = path.join(packageRoot, "package.json");
      const packageBuildTsconfigPath = path.join(
        packageRoot,
        "tsconfig.build.json",
      );

      try {
        writeFileSync(packageJsonPath, '{ "name": "consumer-package" }\n');
        writeFileSync(packageBuildTsconfigPath, "{}\n");

        const onSuccess = vi.fn(async () => {
          await Promise.resolve();
        });

        const config = withTemporaryCwd(() =>
          withEnvironmentVariable("npm_package_json", packageJsonPath, () =>
            getConfigObject(
              createTsupConfig({
                ...consumerLibraryBuildOptions,
                onSuccess,
                esbuildOptions: (options) => ({
                  ...options,
                  minify: true,
                }),
              }),
            ),
          ),
        );

        expect(config.tsconfig).toBe(packageBuildTsconfigPath);
        expect(config.entry).toEqual({
          index: "src/index.ts",
          cli: "src/cli.ts",
        });
        expect(config.format).toEqual(["esm", "cjs"]);

        const esbuildOptions = config.esbuildOptions;
        if (esbuildOptions === undefined) {
          throw new Error("Expected esbuildOptions to be defined.");
        }

        const result = (esbuildOptions as EsbuildOptionsFunction)({
          target: "es2022",
        });
        expect(result).toEqual({
          target: "es2022",
          minify: true,
        });

        const onSuccessHandler = config.onSuccess;
        if (typeof onSuccessHandler === "function") {
          await onSuccessHandler();
        }
        expect(onSuccess).toHaveBeenCalledTimes(1);
      } finally {
        rmSync(packageRoot, { recursive: true, force: true });
      }
    });

    it("uses cwd tsconfig when npm_package_json is not provided", () => {
      const config = withEnvironmentVariable("npm_package_json", undefined, () =>
        withTemporaryCwd((tempDir) => {
          writeFileSync(path.join(tempDir, "tsconfig.build.json"), "{}\n");
          return getConfigObject(createTsupConfig());
        }),
      );

      expect(config.tsconfig).toBe("tsconfig.build.json");
    });
  });
});
