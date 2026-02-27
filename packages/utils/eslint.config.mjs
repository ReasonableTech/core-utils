import { defineConfig } from "eslint/config";
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default defineConfig(
  ...createTypeAwareConfig(import.meta.dirname),
  {
    // retry.ts intentionally uses sequential awaits inside loops for
    // retry-with-backoff logic; parallel execution would defeat the purpose.
    files: ["src/retry.ts"],
    rules: {
      "no-await-in-loop": "off",
    },
  },
);
