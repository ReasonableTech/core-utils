import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  entry: ["src/index.ts", "src/base.ts", "src/cross-app.ts"],
  external: ["@playwright/test"],
});
