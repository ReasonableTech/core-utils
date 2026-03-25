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
import {
  noDependencyBundlingRule,
  noConstructorInstantiationRule,
} from "../../src/custom-rules/architecture-patterns.js";
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

    it("allows domain models with 3+ typed properties", () => {
      const code = `
interface UserProfile {
  address: Address;
  company: Company;
  subscription: Subscription;
}`;
      expect(errors(lint(code, config))).toHaveLength(0);
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
// noDependencyBundlingRule — type alias edge cases
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

  it("catches type alias ending with Deps", () => {
    const code = `type AuthDeps = { token: TokenService; };`;
    const msgs = errors(lint(code, config));
    expect(msgs).toHaveLength(1);
    expect(msgs[0]?.messageId).toBe("dependencyBundle");
  });

  it("allows type alias not ending with Dependencies or Deps", () => {
    const code = `type AuthConfig = { token: string; };`;
    expect(errors(lint(code, config))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// noConstructorInstantiationRule
// ---------------------------------------------------------------------------
describe("noConstructorInstantiationRule (plugin)", () => {
  const config: Linter.Config = {
    plugins: {
      "@reasonabletech": asPlugin({
        "no-constructor-instantiation": noConstructorInstantiationRule,
      }),
    },
    rules: {
      "@reasonabletech/no-constructor-instantiation": "error",
    },
    languageOptions: tsLanguageOptions,
  };

  describe("violations", () => {
    it("catches new PascalCase() inside constructor body", () => {
      const code = `
class UserService {
  constructor(config) {
    this.db = new Database(config);
  }
}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("constructorInstantiation");
    });

    it("catches new MemberExpression inside constructor body", () => {
      const code = `
class UserService {
  constructor() {
    this.client = new ns.HttpClient();
  }
}`;
      const msgs = errors(lint(code, config));
      expect(msgs).toHaveLength(1);
      expect(msgs[0]?.messageId).toBe("constructorInstantiation");
    });
  });

  describe("valid patterns", () => {
    it("allows built-in constructors inside constructor", () => {
      const code = `
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Set();
    this.createdAt = new Date();
  }
}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows new expression in default parameter value", () => {
      const code = `
class UserService {
  constructor(db = new Database()) {}
}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows new expression outside constructor", () => {
      const code = `
class Factory {
  create() {
    return new Database();
  }
}`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });

    it("allows new expression at top level", () => {
      const code = `const db = new Database();`;
      expect(errors(lint(code, config))).toHaveLength(0);
    });
  });
});
