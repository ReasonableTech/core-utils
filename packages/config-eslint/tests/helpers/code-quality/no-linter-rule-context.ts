import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

interface RuleContextOptions {
  comments?: TSESTree.Comment[];
  filename?: string | null;
  options?: Record<string, unknown>;
  report: (descriptor: unknown) => void;
  includeSourceCode?: boolean;
  includeGetFilename?: boolean;
}

export const createNoLinterRuleContext = ({
  comments = [],
  filename = "/src/file.ts",
  options = {},
  report,
  includeSourceCode = true,
  includeGetFilename = true,
}: RuleContextOptions): unknown => {
  const sourceCode = {
    getAllComments: () => comments,
  } as unknown as TSESLint.SourceCode;

  if (includeSourceCode) {
    return includeGetFilename
      ? {
          options: [options],
          getFilename: () => filename,
          getSourceCode: () => sourceCode,
          report,
        }
      : {
          options: [options],
          filename: filename ?? undefined,
          getSourceCode: () => sourceCode,
          report,
        };
  }

  return includeGetFilename
    ? {
        options: [options],
        getFilename: () => filename,
        report,
      }
    : {
        options: [options],
        filename: filename ?? undefined,
        report,
      };
};
