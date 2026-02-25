/**
 * Integration tests for custom ESLint rules that require plugin registration
 *
 * These rules are defined as ESLintUtils.RuleCreator classes and cannot be tested
 * via no-restricted-syntax fallbacks. Instead, they are registered as plugins in
 * the test linter config using the `@reasonabletech` plugin namespace.
 *
 * Note: This file tests ESLint rule behaviour against code strings, so checking
 * ESLint's own message text here is legitimate (we authored the messages).
 */
import { describe, it, expect } from "vitest";
import { type Linter, Linter as LinterClass } from "eslint";
import tseslint from "typescript-eslint";
import { noDependencyBundlingRule } from "../../src/custom-rules/architecture-patterns.js";
import { noLinterDisablingRule } from "../../src/custom-rules/code-quality.js";
import {
  noNullUndefinedChecksRule,
  createNullUndefinedChecksRules,
} from "../../src/custom-rules/null-undefined-checks.js";
import { useResultHelpersRule } from "../../src/custom-rules/platform-conventions.js";

// tseslint.parser uses deliberately loose types; assert to the ESLint interface once here.
const typescriptParser = tseslint.parser as unknown as Linter.Parser;

/**
 * Wraps a record of `@typescript-eslint/utils` RuleModule objects into an ESLint Plugin.
 *
 * RuleModule (from `@typescript-eslint/utils`) and Plugin (from `eslint`) are structurally
 * compatible at runtime but have incompatible TypeScript types because RuleContext
 * in `@typescript-eslint/utils` carries deprecated method signatures that ESLint v9's
 * RuleContext dropped. This helper centralises the cast.
 * @param rules Record of rule name to RuleModule
 * @returns Plugin-typed object for use in Linter.Config.plugins
 */
function asPlugin(
  rules: Record<string, unknown>,
): NonNullable<Linter.Config["plugins"]>[string] {
  return { rules } as unknown as NonNullable<Linter.Config["plugins"]>[string];
}

/**
 * Runs ESLint on a code string with the given config
 * @param code Source code to lint
 * @param config ESLint flat config object
 * @returns Array of lint messages
 */
function lint(code: string, config: Linter.Config): Linter.LintMessage[] {
  return new LinterClass().verify(code, config);
}

/**
 * Filters lint messages to only errors (severity 2)
 * @param messages All lint messages
 * @returns Only error-severity messages
 */
function errors(messages: Linter.LintMessage[]): Linter.LintMessage[] {
  return messages.filter((m) => m.severity === 2);
}

// ---------------------------------------------------------------------------
// Shared language options for TypeScript rules
// ---------------------------------------------------------------------------
const tsLanguageOptions: Linter.Config["languageOptions"] = {
  parser: typescriptParser,
  ecmaVersion: 2022,
  sourceType: "module",
};

// ---------------------------------------------------------------------------
// noDependencyBundlingRule
// ---------------------------------------------------------------------------
describe("noDependencyBundlingRule (plugin)", () => {
  const config: Linter.Config = {
    plugins: {
      "@reasonabletech": asPlugin({
        "no-dependency-bundling": noDependencyBundlingRule,
      }),
    },
    rules: {
      "@reasonabletech/no-dependency-bundling": "error",
    },
    languageOptions: tsLanguageOptions,
  };

  describe("violations", () => {
    it("catches interface ending with Dependencies", () => {
      const code = `interface ServiceDependencies { db: Database; }`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("dependencyBundle");
    });

    it("catches interface ending with Deps", () => {
      const code = `interface ServiceDeps { db: Database; }`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("dependencyBundle");
    });

    it("catches type alias ending with Dependencies", () => {
      const code = `type AuthDependencies = { token: TokenService; };`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("dependencyBundle");
    });

    it("catches structural bundling with 3+ service-like properties", () => {
      const code = `
interface ServiceBundle {
  userService: UserService;
  authService: AuthService;
  cacheService: CacheService;
}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("dependencyBundle");
    });
  });

  describe("valid patterns", () => {
    it("allows Config interface with primitives", () => {
      const code = `interface UserConfig { host: string; port: number; }`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows Options interface", () => {
      const code = `interface UserServiceOptions { timeout: number; }`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows interface with utility types only", () => {
      const code = `
interface SmallBundle {
  users: Array<string>;
  data: Map<string, number>;
}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// noLinterDisablingRule
// ---------------------------------------------------------------------------
describe("noLinterDisablingRule (plugin)", () => {
  /**
   * Lints code with noLinterDisablingRule using the given options and filename.
   *
   * When a filename is provided, it is set via the config `files` array so that
   * ESLint's flat config matches the virtual file and applies the rule. The
   * `linterOptions.noInlineConfig` setting prevents ESLint from processing
   * `eslint-disable` directives itself, allowing our custom rule to detect them.
   * @param code Source code to lint
   * @param ruleOptions Options for the rule
   * @param filename Virtual filename (used for allowInTests detection)
   * @returns Error-severity messages
   */
  function lintDisabling(
    code: string,
    ruleOptions: Record<string, unknown> = {},
    filename?: string,
  ): Linter.LintMessage[] {
    const config: Linter.Config = {
      plugins: {
        "@reasonabletech": asPlugin({
          "no-linter-disabling": noLinterDisablingRule,
        }),
      },
      rules: {
        "@reasonabletech/no-linter-disabling": ["error", ruleOptions],
      },
      languageOptions: tsLanguageOptions,
      // Prevent ESLint from processing eslint-disable directives itself,
      // so our custom rule can detect and report on them.
      linterOptions: { noInlineConfig: true },
    };

    if (filename !== undefined) {
      // Provide the filename so the rule's isTestFile() check can inspect it.
      // Pass as the third argument AND add a files glob so ESLint's flat config matches.
      const configWithFiles: Linter.Config = { ...config, files: ["**"] };
      return errors(new LinterClass().verify(code, configWithFiles, filename));
    }

    return errors(new LinterClass().verify(code, config));
  }

  describe("violations", () => {
    it("reports eslint-disable without justification", () => {
      const msgs = lintDisabling(`/* eslint-disable */\nconst x = 1;`);
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("noJustification");
    });

    it("reports eslint-disable with specific rule without justification", () => {
      const msgs = lintDisabling(
        `/* eslint-disable no-console */\nconst x = 1;`,
      );
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("noJustification");
    });

    it("reports @ts-ignore without justification", () => {
      const msgs = lintDisabling(`// @ts-ignore\nconst x: any = 1;`);
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("noJustification");
    });

    it("reports @ts-nocheck without justification", () => {
      const msgs = lintDisabling(`// @ts-nocheck\nconst x = 1;`);
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("noJustification");
    });

    it("reports specificRule when justification is present but rule is forbidden", () => {
      const code = `// Reason: legacy code\n/* eslint-disable no-console */\nconst x = 1;`;
      const msgs = lintDisabling(code, { requireJustification: true });
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("specificRule");
    });

    it("reports noDisable for blanket disable with requireJustification false", () => {
      const code = `/* eslint-disable */\nconst x = 1;`;
      const msgs = lintDisabling(code, { requireJustification: false });
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("noDisable");
    });
  });

  describe("valid patterns", () => {
    it("skips test files when allowInTests is true", () => {
      const code = `/* eslint-disable */\nconst x = 1;`;
      const msgs = lintDisabling(
        code,
        { allowInTests: true },
        "src/services.test.ts",
      );
      expect(msgs).toHaveLength(0);
    });

    it("skips allowed rules", () => {
      const code = `/* eslint-disable no-console */\nconst x = 1;`;
      const msgs = lintDisabling(code, {
        requireJustification: false,
        allowedRules: ["no-console"],
      });
      expect(msgs).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// noNullUndefinedChecksRule
// ---------------------------------------------------------------------------
describe("noNullUndefinedChecksRule (plugin)", () => {
  const config: Linter.Config = {
    plugins: {
      "@reasonabletech": asPlugin({
        "no-null-undefined-checks": noNullUndefinedChecksRule,
      }),
    },
    rules: {
      "@reasonabletech/no-null-undefined-checks": "error",
    },
    languageOptions: tsLanguageOptions,
  };

  describe("violations", () => {
    it("catches x === null || x === undefined", () => {
      const code = `if (x === null || x === undefined) {}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("checksBoth");
    });

    it("catches x !== null || x !== undefined", () => {
      const code = `if (x !== null || x !== undefined) {}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("checksBoth");
    });

    it("catches loose equality x == null || x == undefined", () => {
      const code = `if (x == null || x == undefined) {}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("checksBoth");
    });

    it("catches reversed operand order: null === x || undefined === x", () => {
      const code = `if (null === x || undefined === x) {}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("checksBoth");
    });

    it("catches mixed order: x === undefined || null === x", () => {
      const code = `if (x === undefined || null === x) {}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("checksBoth");
    });
  });

  describe("valid patterns", () => {
    it("allows different variables (x null, y undefined)", () => {
      const code = `if (x === null || y === undefined) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows null-only check", () => {
      const code = `if (x === null) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows undefined-only check", () => {
      const code = `if (x === undefined) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows AND operator (not OR)", () => {
      const code = `if (x === null && x === undefined) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows non-null/undefined comparisons", () => {
      const code = `if (x > 5 || x < 0) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("does not crash on non-binary expression operands", () => {
      const code = `if (x || y) {}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// useResultHelpersRule
// ---------------------------------------------------------------------------
describe("useResultHelpersRule (plugin)", () => {
  const config: Linter.Config = {
    plugins: {
      "@reasonabletech": asPlugin({
        "use-result-helpers": useResultHelpersRule,
      }),
    },
    rules: {
      "@reasonabletech/use-result-helpers": "error",
    },
    languageOptions: tsLanguageOptions,
  };

  describe("violations", () => {
    it("catches manual success result { success: true, data: ... }", () => {
      const code = `const r = { success: true, data: user };`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("useOkHelper");
    });

    it("catches manual error result { success: false, error: ... }", () => {
      const code = `const r = { success: false, error: "not_found" };`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("useErrHelper");
    });

    it("catches non-literal success with data property (useOkHelper)", () => {
      const code = `const r = { success: someVar, data: user };`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("useOkHelper");
    });

    it("catches non-literal success with error property (useErrHelper)", () => {
      const code = `const r = { success: someVar, error: "fail" };`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("useErrHelper");
    });
  });

  describe("valid patterns", () => {
    it("allows ok() helper calls", () => {
      const code = `const r = ok(user);`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows objects without success property", () => {
      const code = `const r = { name: "test", value: 42 };`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows success-only objects without data or error", () => {
      const code = `const r = { success: true };`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows result-like objects with spread elements", () => {
      // Covers the false branch on prop.type === AST_NODE_TYPES.Property (line 133)
      // SpreadElement is not a Property, so isResultLikeObject skips it
      const code = `const base = { data: 1 }; const r = { success: true, ...base };`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows result-like objects with computed property keys", () => {
      // Covers the false branch on prop.key.type === AST_NODE_TYPES.Identifier (line 133)
      const code = `const key = "data"; const r = { success: true, [key]: user };`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// createNullUndefinedChecksRules (factory function coverage)
// ---------------------------------------------------------------------------
describe("createNullUndefinedChecksRules", () => {
  it("returns rule config referencing the custom rule", () => {
    const rules = createNullUndefinedChecksRules();
    expect(rules).toEqual({
      "@reasonabletech/no-null-undefined-checks": "error",
    });
  });
});

// ---------------------------------------------------------------------------
// noDependencyBundlingRule — edge cases for isServiceLikeProperty
// ---------------------------------------------------------------------------
describe("noDependencyBundlingRule edge cases", () => {
  const config: Linter.Config = {
    plugins: {
      "@reasonabletech": asPlugin({
        "no-dependency-bundling": noDependencyBundlingRule,
      }),
    },
    rules: {
      "@reasonabletech/no-dependency-bundling": "error",
    },
    languageOptions: tsLanguageOptions,
  };

  it("allows interface with method signatures (non-TSPropertySignature)", () => {
    // Method signatures return false from isServiceLikeProperty (line 136)
    const code = `
interface MyService {
  start(): void;
  stop(): void;
  restart(): void;
}`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });

  it("allows interface with properties lacking type annotations", () => {
    // Properties without typeAnnotation return false from isServiceLikeProperty
    const code = `
interface MyConfig {
  host;
  port;
  database;
}`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });

  it("allows interface with primitive-typed properties (non-TSTypeReference)", () => {
    const code = `
interface MyConfig {
  host: string;
  port: number;
  enabled: boolean;
}`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });

  it("allows interface with qualified name types (Namespace.Type)", () => {
    // Covers the false branch of typeName.type === AST_NODE_TYPES.Identifier (line 145)
    // TSQualifiedName is used for dot-separated type references like Namespace.Type
    const code = `
interface MyBundle {
  serviceA: Namespace.ServiceA;
  serviceB: Namespace.ServiceB;
  serviceC: Namespace.ServiceC;
}`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });

  it("catches type alias ending with Deps", () => {
    // Covers the name.endsWith("Deps") branch on type aliases (line 220)
    const code = `type AuthDeps = { token: TokenService; };`;
    const msgs = errors(lint(code, config));
    expect(msgs).toHaveLength(1);
    expect(msgs[0]?.messageId).toBe("dependencyBundle");
  });

  it("allows type alias not ending with Dependencies or Deps", () => {
    // Covers the false branch of both endsWith checks on line 220
    const code = `type AuthConfig = { token: string; };`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// noLinterDisablingRule — additional branch coverage
// ---------------------------------------------------------------------------
describe("noLinterDisablingRule edge cases", () => {
  /**
   * Lints code with noLinterDisablingRule
   * @param code Source code to lint
   * @param ruleOptions Options for the rule
   * @param filename Virtual filename (used for allowInTests detection)
   * @returns Error-severity messages
   */
  function lintDisabling(
    code: string,
    ruleOptions: Record<string, unknown> = {},
    filename?: string,
  ): Linter.LintMessage[] {
    const cfg: Linter.Config = {
      plugins: {
        "@reasonabletech": asPlugin({
          "no-linter-disabling": noLinterDisablingRule,
        }),
      },
      rules: {
        "@reasonabletech/no-linter-disabling": ["error", ruleOptions],
      },
      languageOptions: tsLanguageOptions,
      linterOptions: { noInlineConfig: true },
    };

    if (filename !== undefined) {
      const cfgWithFiles: Linter.Config = { ...cfg, files: ["**"] };
      return errors(new LinterClass().verify(code, cfgWithFiles, filename));
    }

    return errors(new LinterClass().verify(code, cfg));
  }

  it("reports on test file when allowInTests is false", () => {
    const code = `/* eslint-disable */\nconst x = 1;`;
    const msgs = lintDisabling(
      code,
      { allowInTests: false },
      "src/services.test.ts",
    );
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("detects __tests__ directory as test file", () => {
    const code = `/* eslint-disable */\nconst x = 1;`;
    const msgs = lintDisabling(
      code,
      { allowInTests: true },
      "src/__tests__/util.ts",
    );
    expect(msgs).toHaveLength(0);
  });

  it("detects .spec. files as test files", () => {
    const code = `/* eslint-disable */\nconst x = 1;`;
    const msgs = lintDisabling(
      code,
      { allowInTests: true },
      "src/util.spec.ts",
    );
    expect(msgs).toHaveLength(0);
  });

  it("still reports on non-test file when allowInTests is true", () => {
    // Covers false branch of isTestFile (line 106) — allowInTests is true but file is not a test
    const code = `/* eslint-disable */\nconst x = 1;`;
    const msgs = lintDisabling(
      code,
      { allowInTests: true },
      "src/services/auth.ts",
    );
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("skips test files when allowedPatterns is explicitly undefined", () => {
    // Covers the ?? [] fallback branch on line 106 where allowedPatterns is nullish
    const code = `/* eslint-disable */\nconst x = 1;`;
    const msgs = lintDisabling(
      code,
      { allowInTests: true, allowedPatterns: undefined },
      "src/services.test.ts",
    );
    // With empty allowedPatterns (from ??), isTestFile falls back to built-in patterns
    // The .test.ts suffix is detected by the built-in check in isTestFile
    expect(msgs).toHaveLength(0);
  });
});
