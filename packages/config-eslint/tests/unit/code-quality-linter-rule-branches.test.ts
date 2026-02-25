import { describe, expect, it, vi } from "vitest";

import {
  commentsWithEslintDisableRule,
  commentsWithReasonAndTsIgnore,
  commentsWithTsNoCheck,
} from "../fixtures/code-quality/linter-disabling-comments.js";
import { createNoLinterRuleContext } from "../helpers/code-quality/no-linter-rule-context.js";
import { noLinterDisablingRule } from "../../src/custom-rules/code-quality.js";

describe("no-linter-disabling rule branch coverage", () => {
  it("returns no listeners when sourceCode is unavailable", () => {
    const report = vi.fn();
    const context = createNoLinterRuleContext({
      report,
      includeSourceCode: false,
    });

    const listeners = noLinterDisablingRule.create(context as never);

    expect(listeners).toEqual({});
    expect(report).not.toHaveBeenCalled();
  });

  it("reports noDisable for ts-ignore with justification comment", () => {
    const report = vi.fn();
    const context = createNoLinterRuleContext({
      report,
      comments: commentsWithReasonAndTsIgnore,
      options: { requireJustification: true, allowInTests: false },
    });

    const listeners = noLinterDisablingRule.create(context as never);
    listeners.Program?.({} as never);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "noDisable" }),
    );
  });

  it("reports specificRule when justification is disabled and a named rule is disabled", () => {
    const report = vi.fn();
    const context = createNoLinterRuleContext({
      report,
      comments: commentsWithEslintDisableRule,
      options: { requireJustification: false, allowInTests: false },
    });

    const listeners = noLinterDisablingRule.create(context as never);
    listeners.Program?.({} as never);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: "specificRule",
        data: { rule: "no-console" },
      }),
    );
  });

  it("uses filename property fallback when getFilename is unavailable", () => {
    const report = vi.fn();
    const context = createNoLinterRuleContext({
      report,
      comments: commentsWithTsNoCheck,
      filename: "/src/non-test-file.ts",
      options: { requireJustification: false, allowInTests: true },
      includeGetFilename: false,
    });

    const listeners = noLinterDisablingRule.create(context as never);
    listeners.Program?.({} as never);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "noDisable" }),
    );
  });

  it("uses <input> fallback when neither getFilename nor filename are available", () => {
    const report = vi.fn();
    const context = createNoLinterRuleContext({
      report,
      comments: commentsWithTsNoCheck,
      options: { requireJustification: false, allowInTests: true },
      includeGetFilename: false,
      filename: null,
    });

    const listeners = noLinterDisablingRule.create(context as never);
    listeners.Program?.({} as never);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "noDisable" }),
    );
  });
});
