import type { TsupConfigOptions } from "../../src/index.js";

export const consumerLibraryBuildOptions: TsupConfigOptions = {
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["esm", "cjs"],
  define: {
    __FEATURE_FLAG__: "true",
  },
  external: ["zod"],
};

export const bundledWorkspaceBuildOptions: TsupConfigOptions = {
  noExternal: [/^@reasonabletech\//],
  external: ["@reasonabletech/runtime"],
};
