import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false, // Use tsc for declarations
  sourcemap: true,
  clean: false,
  treeshake: true,
  splitting: false,
  platform: "neutral",
  target: "ES2023",
  external: ["tsup", "esbuild"],
  outExtension() {
    return {
      js: `.js`,
    };
  },
});
