import { defineConfig } from "eslint/config";
import { createTypeAwareConfig } from "./dist/src/index.js";

export default defineConfig(...createTypeAwareConfig(import.meta.dirname), {
  files: ["tests/**"],
  rules: {
    "@reasonabletech/no-error-message-parsing": "off",
  },
});
