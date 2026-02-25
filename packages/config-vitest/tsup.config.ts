import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/node.ts", "src/react.ts", "src/workspace.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  target: "node18",
  sourcemap: true,
  dts: false, // TypeScript handles declarations
  outDir: "dist/src",
  splitting: false,
});
