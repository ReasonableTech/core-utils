import { describe, expect, it } from "vitest";
import { createUILibraryImportRules } from "../../src/custom-rules/ui-library-imports.js";

describe("createUILibraryImportRules", () => {
  it("creates a no-restricted-syntax rule for @lovelace-ai/ui by default", () => {
    const rules = createUILibraryImportRules();
    const syntaxRule = rules["no-restricted-syntax"] as unknown[];
    const restriction = syntaxRule[1] as { selector: string; message: string };

    expect(syntaxRule[0]).toBe("error");
    expect(restriction.selector).toContain("source.value='@lovelace-ai/ui'");
    expect(restriction.message).toContain("@lovelace-ai/ui");
    expect(restriction.message).toContain("@lovelace-ai/ui/button");
  });

  it("returns no rules when barrel-import enforcement is disabled", () => {
    const rules = createUILibraryImportRules({
      discourageUILibraryBarrelImports: false,
    });

    expect(rules).toEqual({});
  });
});
