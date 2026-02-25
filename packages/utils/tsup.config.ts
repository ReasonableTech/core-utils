import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  entry: {
    index: "src/index.ts",
    result: "src/result.ts",
    datetime: "src/datetime.ts",
    object: "src/object.ts",
    string: "src/string.ts",
    retry: "src/retry.ts",
  },
  platform: "neutral",
});
