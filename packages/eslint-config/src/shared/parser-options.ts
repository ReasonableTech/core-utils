import type { Linter } from "eslint";

export const removeProjectParserOption = (
  config: Linter.Config,
): Linter.Config => {
  const parserOptions = config.languageOptions?.parserOptions;

  if (
    parserOptions == null ||
    typeof parserOptions !== "object" ||
    Array.isArray(parserOptions) ||
    !("project" in parserOptions)
  ) {
    return config;
  }

  const parserOptionsRecord = parserOptions as Record<string, unknown>;
  const { project: _project, ...rest } = parserOptionsRecord;

  return {
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: rest as Linter.ParserOptions,
    },
  };
};
