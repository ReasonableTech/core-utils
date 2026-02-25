/**
 * Unit tests for custom-rules utility functions and constants
 *
 * These tests verify the helper functions used by custom rule factory
 * functions, including rule merging, conditional rule creation, AST selector
 * builders, and rule-enabled detection.
 */

import { describe, it, expect, vi } from "vitest";
import type { Linter } from "eslint";
import {
  mergeRuleConfigurations,
  createConditionalRules,
  AST_SELECTORS,
  createExportedTypeSelector,
  createTypeReferenceSelector,
  createResultInlineUnionSelector,
  createPromiseResultInlineUnionSelector,
  ERROR_MESSAGES,
  createDocReference,
  isRuleEnabled,
} from "../../src/custom-rules/utils.js";

describe("mergeRuleConfigurations", () => {
  it("should return empty object when called with no arguments", () => {
    const result = mergeRuleConfigurations();
    expect(result).toEqual({});
  });

  it("should merge non-restricted-syntax rules from multiple configs", () => {
    const configA: Linter.RulesRecord = { "no-console": "error" };
    const configB: Linter.RulesRecord = { "no-debugger": "warn" };

    const result = mergeRuleConfigurations(configA, configB);

    expect(result["no-console"]).toBe("error");
    expect(result["no-debugger"]).toBe("warn");
  });

  it("should later configs override earlier configs for the same rule", () => {
    const configA: Linter.RulesRecord = { "no-console": "error" };
    const configB: Linter.RulesRecord = { "no-console": "off" };

    const result = mergeRuleConfigurations(configA, configB);

    expect(result["no-console"]).toBe("off");
  });

  it("should merge no-restricted-syntax patterns at error level", () => {
    const config: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "error",
        { selector: "WithStatement", message: "No with statements" },
      ],
    };

    const result = mergeRuleConfigurations(config);

    expect(result["no-restricted-syntax"]).toEqual([
      "error",
      { selector: "WithStatement", message: "No with statements" },
    ]);
  });

  it("should merge no-restricted-syntax patterns at warn level", () => {
    const config: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "warn",
        { selector: "DebuggerStatement", message: "No debugger" },
      ],
    };

    const result = mergeRuleConfigurations(config);

    expect(result["no-restricted-syntax"]).toEqual([
      "error",
      { selector: "DebuggerStatement", message: "No debugger" },
    ]);
  });

  it("should ignore no-restricted-syntax with non-error/non-warn level", () => {
    const config: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "off",
        { selector: "WithStatement", message: "No with" },
      ],
    };

    const result = mergeRuleConfigurations(config);

    expect(result["no-restricted-syntax"]).toBeUndefined();
  });

  it("should treat non-array no-restricted-syntax as a regular rule", () => {
    const config: Linter.RulesRecord = {
      "no-restricted-syntax": "error",
    };

    const result = mergeRuleConfigurations(config);

    expect(result["no-restricted-syntax"]).toBe("error");
  });

  it("should deduplicate patterns by selector, keeping the last occurrence", () => {
    const configA: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "error",
        { selector: "WithStatement", message: "Original message" },
      ],
    };
    const configB: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "error",
        { selector: "WithStatement", message: "Updated message" },
      ],
    };

    const result = mergeRuleConfigurations(configA, configB);

    expect(result["no-restricted-syntax"]).toEqual([
      "error",
      { selector: "WithStatement", message: "Updated message" },
    ]);
  });

  it("should combine patterns from multiple configs with different selectors", () => {
    const configA: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "error",
        { selector: "WithStatement", message: "No with" },
      ],
    };
    const configB: Linter.RulesRecord = {
      "no-restricted-syntax": [
        "error",
        { selector: "DebuggerStatement", message: "No debugger" },
      ],
    };

    const result = mergeRuleConfigurations(configA, configB);
    const patterns = result["no-restricted-syntax"];

    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns).toHaveLength(3);
    expect(patterns).toContainEqual({
      selector: "WithStatement",
      message: "No with",
    });
    expect(patterns).toContainEqual({
      selector: "DebuggerStatement",
      message: "No debugger",
    });
  });
});

describe("createConditionalRules", () => {
  it("should return empty object when enabled is false", () => {
    const factory = vi.fn(() => ({ "no-console": "error" as const }));

    const result = createConditionalRules(factory, { enabled: false });

    expect(result).toEqual({});
    expect(factory).not.toHaveBeenCalled();
  });

  it("should call factory and return rules when enabled is true", () => {
    const rules: Linter.RulesRecord = { "no-console": "error" };
    const factory = vi.fn(() => rules);

    const result = createConditionalRules(factory, { enabled: true });

    expect(result).toBe(rules);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("should call factory when enabled is undefined (default behavior)", () => {
    const rules: Linter.RulesRecord = { "no-debugger": "warn" };
    const factory = vi.fn(() => rules);

    const result = createConditionalRules(factory, {});

    expect(result).toBe(rules);
    expect(factory).toHaveBeenCalledOnce();
  });
});

describe("AST_SELECTORS", () => {
  it("should export all expected selector keys", () => {
    const expectedKeys = [
      "ERROR_MESSAGE_ACCESS",
      "EXPORTED_TYPE_ALIAS",
      "TYPE_REFERENCE",
      "UNION_TYPE_WITH_LITERALS",
      "STRING_INCLUDES",
      "STRING_STARTS_WITH",
      "STRING_ENDS_WITH",
      "REGEX_MATCH",
      "REGEX_TEST",
      "STRICT_EQUALITY",
      "LOOSE_EQUALITY",
    ];

    for (const key of expectedKeys) {
      expect(AST_SELECTORS).toHaveProperty(key);
      expect(AST_SELECTORS[key as keyof typeof AST_SELECTORS]).toEqual(
        expect.any(String),
      );
    }
  });
});

describe("createExportedTypeSelector", () => {
  it("should build a selector matching exported type aliases by name pattern", () => {
    const selector = createExportedTypeSelector(".*Error$");

    expect(selector).toBe(
      "ExportNamedDeclaration > TSTypeAliasDeclaration[id.name=/.*Error$/]",
    );
  });
});

describe("createTypeReferenceSelector", () => {
  it("should build a selector matching a type reference by name", () => {
    const selector = createTypeReferenceSelector("Result");

    expect(selector).toBe("TSTypeReference[typeName.name='Result']");
  });
});

describe("createResultInlineUnionSelector", () => {
  it("should use 'Result' as the default type name", () => {
    const selector = createResultInlineUnionSelector();

    expect(selector).toContain("TSTypeReference[typeName.name='Result']");
    expect(selector).toContain("TSUnionType:has(TSLiteralType)");
  });

  it("should accept a custom result type name", () => {
    const selector = createResultInlineUnionSelector("CustomResult");

    expect(selector).toContain("TSTypeReference[typeName.name='CustomResult']");
    expect(selector).toContain("TSUnionType:has(TSLiteralType)");
  });
});

describe("createPromiseResultInlineUnionSelector", () => {
  it("should build a selector for Promise<Result<T, inline union>> with default type", () => {
    const selector = createPromiseResultInlineUnionSelector();

    expect(selector).toContain("TSTypeReference[typeName.name='Promise']");
    expect(selector).toContain("TSTypeParameterInstantiation");
    expect(selector).toContain("TSTypeReference[typeName.name='Result']");
    expect(selector).toContain("TSUnionType:has(TSLiteralType)");
  });

  it("should accept a custom result type name", () => {
    const selector = createPromiseResultInlineUnionSelector("AsyncResult");

    expect(selector).toContain("TSTypeReference[typeName.name='AsyncResult']");
    expect(selector).not.toContain("TSTypeReference[typeName.name='Result'] ");
  });
});

describe("ERROR_MESSAGES", () => {
  it("should export all expected message keys", () => {
    const expectedKeys = [
      "NO_ERROR_MESSAGE_PARSING",
      "NO_INLINE_ERROR_UNIONS",
      "REQUIRE_ERROR_TYPE_DOCS",
      "FOLLOW_NAMING_CONVENTION",
    ] as const;

    for (const key of expectedKeys) {
      expect(ERROR_MESSAGES).toHaveProperty(key);
      expect(ERROR_MESSAGES[key]).toEqual(expect.any(String));
    }
  });
});

describe("createDocReference", () => {
  it("should append section as a hash fragment when provided", () => {
    const result = createDocReference(
      "https://docs.example.com/errors",
      "parsing",
    );

    expect(result).toBe("https://docs.example.com/errors#parsing");
  });

  it("should return base URL when section is undefined", () => {
    const result = createDocReference("https://docs.example.com/errors");

    expect(result).toBe("https://docs.example.com/errors");
  });

  it("should return base URL when section is an empty string", () => {
    const result = createDocReference("https://docs.example.com/errors", "");

    expect(result).toBe("https://docs.example.com/errors");
  });
});

describe("isRuleEnabled", () => {
  it("should return false for undefined", () => {
    expect(isRuleEnabled(undefined)).toBe(false);
  });

  it("should return true for string 'error'", () => {
    expect(isRuleEnabled("error")).toBe(true);
  });

  it("should return true for string 'warn'", () => {
    expect(isRuleEnabled("warn")).toBe(true);
  });

  it("should return false for string 'off'", () => {
    expect(isRuleEnabled("off")).toBe(false);
  });

  it("should return true for array with 'error' level", () => {
    expect(isRuleEnabled(["error", { allow: ["warn"] }])).toBe(true);
  });

  it("should return true for array with 'warn' level", () => {
    expect(isRuleEnabled(["warn", { max: 5 }])).toBe(true);
  });

  it("should return false for array with 'off' level", () => {
    expect(isRuleEnabled(["off"])).toBe(false);
  });

  it("should return false for numeric level 0", () => {
    expect(isRuleEnabled(0)).toBe(false);
  });
});
