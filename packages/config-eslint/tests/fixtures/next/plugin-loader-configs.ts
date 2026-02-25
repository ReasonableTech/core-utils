import type { Linter } from "eslint";

export const validCoreWebVitalsConfig: Linter.Config[] = [
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
    },
  },
];

export const validTypescriptConfig: Linter.Config[] = [
  {
    rules: {
      "no-console": "error",
    },
  },
];

export const invalidTypescriptConfig: unknown[] = [null];
