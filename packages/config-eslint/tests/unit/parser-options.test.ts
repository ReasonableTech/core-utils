import { describe, expect, it } from "vitest";
import type { Linter } from "eslint";
import { removeProjectParserOption } from "../../src/shared/parser-options.js";

describe("removeProjectParserOption", () => {
  it("removes parserOptions.project while preserving other options", () => {
    const config: Linter.Config = {
      languageOptions: {
        parserOptions: {
          project: ["./tsconfig.json"],
          tsconfigRootDir: "/workspace",
        },
      },
    };

    const result = removeProjectParserOption(config);
    const parserOptions = result.languageOptions?.parserOptions as
      | Record<string, unknown>
      | undefined;

    expect(parserOptions).not.toHaveProperty("project");
    expect(parserOptions?.tsconfigRootDir).toBe("/workspace");
  });

  it("returns config unchanged when parserOptions are absent", () => {
    const config: Linter.Config = {
      rules: {
        "no-console": "error",
      },
    };

    expect(removeProjectParserOption(config)).toEqual(config);
  });
});
