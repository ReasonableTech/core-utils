/**
 * Next.js ESLint configuration checks
 *
 * Ensures the Next.js config stays compatible with TypeScript's project service
 * by avoiding parserOptions.project, which conflicts with projectService.
 */

import { describe, expect, it } from "vitest";
import { createTypeAwareNextConfig } from "../../src/next.js";

const hasProjectParserOption = (): boolean =>
  createTypeAwareNextConfig(process.cwd()).some((config) =>
    Object.prototype.hasOwnProperty.call(
      config.languageOptions?.parserOptions ?? {},
      "project",
    ),
  );

describe("Next.js ESLint configuration", () => {
  it("does not enable parserOptions.project when projectService is used", () => {
    expect(hasProjectParserOption()).toBe(false);
  });
});
