import type { TSESTree } from "@typescript-eslint/utils";

export const createLineComment = (
  value: string,
  line: number,
): TSESTree.Comment =>
  ({
    type: "Line",
    value,
    range: [0, 0],
    loc: {
      start: { line, column: 0 },
      end: { line, column: value.length },
    },
  }) as TSESTree.Comment;

export const commentsWithReasonAndTsIgnore = [
  createLineComment(" Reason: compatibility shim", 1),
  createLineComment(" @ts-ignore temporary escape hatch", 2),
];

export const commentsWithEslintDisableRule = [
  createLineComment(" eslint-disable no-console", 10),
];

export const commentsWithTsNoCheck = [
  createLineComment(" @ts-nocheck temporary escape hatch", 5),
];
