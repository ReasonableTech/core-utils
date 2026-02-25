import { describe, expect, it } from "vitest";
import type { Linter } from "eslint";
import { createTypeAwareConfig } from "../../src/index.js";

type ParserOptions = Record<string, unknown> & {
  projectService?: boolean;
  project?: unknown;
};

const isParserOptions = (value: unknown): value is ParserOptions =>
  typeof value === "object" && value !== null;

const collectParserOptions = (configs: Linter.Config[]): ParserOptions[] =>
  configs.flatMap((config): ParserOptions[] => {
    const options = config.languageOptions?.parserOptions;
    if (!isParserOptions(options)) {
      return [];
    }
    return [options];
  });

describe("Type-aware ESLint parser options", () => {
  it("enables projectService without configuring project", () => {
    const configs = createTypeAwareConfig(process.cwd());
    const parserOptions = collectParserOptions(configs);

    const hasProjectService = parserOptions.some(
      (options) => options.projectService === true,
    );
    expect(hasProjectService).toBe(true);

    const hasProject = parserOptions.some((options) =>
      Object.prototype.hasOwnProperty.call(options, "project"),
    );
    expect(hasProject).toBe(false);
  });
});
