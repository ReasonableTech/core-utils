import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/next.ts", "src/react.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false, // tsc handles declarations
  sourcemap: true,
  outDir: "dist/src",
  splitting: false,
  clean: true,
  target: "node18",
});
