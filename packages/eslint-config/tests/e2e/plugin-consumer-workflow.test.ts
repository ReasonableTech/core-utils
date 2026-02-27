import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import {
  createArchitecturePatternRules,
  createPlatformConventionRules,
  createTypeSafetyRules,
} from "../../src/custom-rules/index.js";
import { reasonableTechPlugin } from "../../src/plugin.js";

const reasonableTechEslintPlugin =
  reasonableTechPlugin as unknown as NonNullable<Linter.Config["plugins"]>[string];
const typescriptParser = tseslint.parser as unknown as Linter.Parser;
const typescriptPlugin =
  tseslint.plugin as unknown as NonNullable<Linter.Config["plugins"]>[string];

const lintConfig: Linter.Config = {
  plugins: {
    "@reasonabletech": reasonableTechEslintPlugin,
    "@typescript-eslint": typescriptPlugin,
  },
  languageOptions: {
    parser: typescriptParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    ...createArchitecturePatternRules(),
    ...createTypeSafetyRules(),
    ...createPlatformConventionRules({
      uiImportBoundaries: {
        discourageUILibraryBarrelImports: true,
      },
    }),
  },
};

describe("plugin consumer workflow", () => {
  describe("Core use cases", () => {
    it("flags architecture, type-safety, and platform violations in one lint pass", () => {
      const linter = new Linter();

      const source = `
interface AccountDependencies {
  logger: Logger;
}

type Logger = { log: (message: string) => void };

const value: any = "unsafe";
const result = { success: true, data: value };
import { Button } from "@lovelace-ai/ui";
console.log(Button, result);
`;

      const messages = linter.verify(source, lintConfig);
      const violations = messages.filter((message) => message.severity === 2);
      const ruleIds = new Set(
        violations
          .map((message) => message.ruleId)
          .filter((ruleId): ruleId is string => ruleId !== null),
      );

      expect(violations.length).toBeGreaterThanOrEqual(4);
      expect(ruleIds.has("@reasonabletech/no-dependency-bundling")).toBe(true);
      expect(ruleIds.has("@reasonabletech/use-result-helpers")).toBe(true);
      expect(ruleIds.has("no-restricted-syntax")).toBe(true);
      expect(ruleIds.has("@typescript-eslint/no-explicit-any")).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("allows a compliant implementation path with no errors", () => {
      const linter = new Linter();

      const source = `
type Logger = { log: (message: string) => void };

type AccountConfig = {
  logger: Logger;
};

import { ok } from "@reasonabletech/utils";
import { Button } from "@lovelace-ai/ui/button";

function buildResult(input: string) {
  const safeInput: string = input;
  console.log(Button, safeInput);
  return ok(safeInput);
}

const config: AccountConfig = {
  logger: { log: (message: string) => console.log(message) },
};

buildResult("ok");
console.log(config.logger);
`;

      const messages = linter.verify(source, lintConfig);
      const violations = messages.filter((message) => message.severity === 2);

      expect(violations).toHaveLength(0);
    });
  });
});
