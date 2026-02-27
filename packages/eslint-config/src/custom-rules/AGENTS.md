# Custom ESLint Rules Guidelines

> **Guidelines for contributing to custom ESLint rules in this package**

**Also see:**

- [docs/standards/eslint-rule-antipatterns.md](../../../../../docs/standards/eslint-rule-antipatterns.md) - Antipattern catalog

## 🚀 Quick Navigation

Start here:

- [Adding New Rules](#-adding-new-rules) - Step-by-step workflow
- [Forbidden Patterns](#-forbidden-patterns) - What NOT to do
- [Testing Requirements](#-testing-requirements) - Mandatory test patterns

---

## 📋 Overview

Custom ESLint rules enforce platform architectural standards and prevent code antipatterns. Current rule categories:

- **Error Handling** (4 rules) - Prevent error message parsing, enforce documented error types
- **Type Safety** (1 rule) - Detect null/undefined type mismatches
- **Architecture** (2 rules) - Prevent dependency bundling god objects

All rules are:

- Configurable via factory functions
- Documented with JSDoc
- Tested comprehensively
- Integrated into presets (Platform, Generic)

---

## ⚡ Adding New Rules

### Quick Start Template

1. Create rule file: `src/custom-rules/my-new-rule.ts`
2. Export factory functions with TypeScript interfaces for options
3. Add to `index.ts` exports
4. Update preset in `createPlatformRulePreset()` or `createReasonableTechRules()`
5. Write comprehensive tests in `tests/unit/`
6. Update antipattern documentation in `docs/standards/eslint-rule-antipatterns.md`

### Step-by-Step Process

#### Step 1: Create Rule File

Create a new TypeScript file in `src/custom-rules/` with factory functions:

```typescript
// src/custom-rules/my-new-rule.ts
import type { Linter } from "eslint";
import type { BaseRuleOptions } from "./utils.js";

interface MyNewRuleOptions extends BaseRuleOptions {
  /** Enable strict mode for this rule */
  strictMode?: boolean;
}

const DEFAULT_OPTIONS: Required<MyNewRuleOptions> = {
  strictMode: false,
  docBaseUrl: "docs/standards/my-new-rule.md",
};

/**
 * Prevents [specific antipattern description]
 *
 * @param options Configuration options
 * @returns ESLint rule configuration
 */
export function createMyNewRules(
  options: MyNewRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: "YourASTSelector",
        message: `Error message with ${config.docBaseUrl} reference`,
      },
    ],
  };
}

/**
 * platform-specific preset for my new rules
 */
export function createPlatformMyNewRules(): Linter.RulesRecord {
  return createMyNewRules({
    docBaseUrl: "docs/standards/eslint-rule-antipatterns.md#antipattern-X",
    strictMode: true,
  });
}
```

#### Step 2: Update Index Exports

Add your new rule to `src/custom-rules/index.ts`:

```typescript
// Add to exports
export {
  createMyNewRules,
  createPlatformMyNewRules,
  type MyNewRuleOptions,
} from "./my-new-rule.js";

// Update ReasonableTechRuleOptions interface
export interface ReasonableTechRuleOptions {
  errorHandling?: ErrorHandlingRuleOptions;
  architecturePatterns?: ArchitecturePatternRuleOptions;
  myNewRule?: MyNewRuleOptions; // ← Add this
  docBaseUrl?: string;
}

// Update createReasonableTechRules() function
export function createReasonableTechRules(
  options: ReasonableTechRuleOptions = {},
): Linter.RulesRecord {
  const myNewRules = createMyNewRules({
    docBaseUrl: options.docBaseUrl,
    ...options.myNewRule,
  });

  return mergeRuleConfigurations(
    errorHandlingRules,
    architecturePatternRules,
    myNewRules, // ← Add this
  );
}
```

#### Step 3: Add to Presets

Update the appropriate preset (`createPlatformRulePreset()` or `createGenericRulePreset()`):

```typescript
export function createPlatformRulePreset(): Linter.RulesRecord {
  return createReasonableTechRules({
    docBaseUrl: "docs/standards/error-handling.md",
    errorHandling: {
      errorTypePattern: ".*Error$",
      resultTypeName: "Result",
      requireErrorTypeJSDoc: true,
    },
    architecturePatterns: {
      enforceIndividualDependencies: true,
    },
    myNewRule: {
      // ← Add this
      strictMode: true,
    },
  });
}
```

#### Step 4: Write Tests

Create comprehensive test file in `tests/unit/`:

```typescript
// tests/unit/my-new-rule.test.ts
import { describe, it, expect } from "vitest";
import {
  createMyNewRules,
  createPlatformMyNewRules,
} from "../../src/custom-rules/my-new-rule.js";

describe("createMyNewRules", () => {
  it("should create rules when strictMode is true", () => {
    const rules = createMyNewRules({ strictMode: true });

    expect(rules).toHaveProperty("no-restricted-syntax");
    expect(rules["no-restricted-syntax"]).toBeInstanceOf(Array);
  });

  it("should return empty object when strictMode is false", () => {
    const rules = createMyNewRules({ strictMode: false });

    expect(rules).toEqual({});
  });

  it("should include documentation reference in error message", () => {
    const customDocUrl = "custom/docs/antipattern.md";
    const rules = createMyNewRules({ docBaseUrl: customDocUrl });

    const restrictedSyntaxRules = rules["no-restricted-syntax"] as unknown[];
    const myRule = restrictedSyntaxRules.find((rule) => {
      if (typeof rule === "object" && rule !== null && "message" in rule) {
        return (rule.message as string).includes(customDocUrl);
      }
      return false;
    });

    expect(myRule).toBeDefined();
  });
});

describe("createPlatformMyNewRules", () => {
  it("should create platform-specific preset", () => {
    const rules = createPlatformMyNewRules();

    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("should enable strict mode by default", () => {
    const rules = createPlatformMyNewRules();

    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });
});

describe("Rule selector patterns", () => {
  it("should match specific AST patterns", () => {
    const rules = createMyNewRules({ strictMode: true });
    const restrictedSyntaxRules = rules["no-restricted-syntax"] as unknown[];

    const myRule = restrictedSyntaxRules.find((rule) => {
      if (typeof rule === "object" && rule !== null && "selector" in rule) {
        return (rule.selector as string).includes("YourASTPattern");
      }
      return false;
    }) as { selector: string };

    expect(myRule.selector).toContain("YourASTPattern");
  });
});
```

#### Step 5: Update Antipattern Documentation

Add your antipattern to `docs/standards/eslint-rule-antipatterns.md`:

- Add to Table of Contents
- Add to Quick Reference Table
- Create detailed antipattern section with:
  - Why it's dangerous
  - Forbidden patterns with code examples
  - Required patterns with alternatives
  - Real-world violations (if any)
  - Migration guide

---

## 🚨 Forbidden Patterns

### ❌ FORBIDDEN: Direct Rule Exports

Never export raw ESLint rule objects directly. Always use factory functions.

```typescript
// ❌ WRONG: Direct exports
export const myRule = {
  "no-restricted-syntax": ["error", { selector: "...", message: "..." }],
};

// ✅ CORRECT: Factory function
export function createMyRules(options: MyRuleOptions = {}): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };
  return {
    "no-restricted-syntax": [
      "error",
      { selector: "...", message: `... ${config.docBaseUrl}` },
    ],
  };
}
```

**Why**: Factory functions enable:

- Configuration flexibility
- Platform vs Generic presets
- Documentation URL customization
- Feature toggles (e.g., `enforceIndividualDependencies: false`)

### ❌ FORBIDDEN: Hardcoded Documentation URLs

Never hardcode documentation URLs in error messages. Use configurable options.

```typescript
// ❌ WRONG: Hardcoded URLs
message: "Error. See docs/standards/error-handling.md",

// ✅ CORRECT: Configurable URLs
message: `Error. See ${config.docBaseUrl}`,
```

**Why**: Different projects may have different documentation structures. The `docBaseUrl` option allows customization.

### ❌ FORBIDDEN: Missing JSDoc

All exported functions and interfaces MUST have comprehensive JSDoc.

````typescript
// ❌ WRONG: No documentation
export function createMyRules(options = {}) {}

// ✅ CORRECT: Comprehensive JSDoc
/**
 * Prevents [specific antipattern description]
 *
 * This rule enforces [architectural principle] by detecting [pattern].
 *
 * @param options Configuration options
 * @returns ESLint rule configuration
 * @example
 * ```typescript
 * const rules = createMyRules({ strictMode: true });
 * ```
 */
export function createMyRules(
  options: MyRuleOptions = {},
): Linter.RulesRecord {}
````

### ❌ FORBIDDEN: `any` Types in Configurations

All configuration interfaces must use proper TypeScript types.

```typescript
// ❌ WRONG: any types
interface MyRuleOptions {
  config: any;
  options: any;
}

// ✅ CORRECT: Strict types
interface MyRuleOptions extends BaseRuleOptions {
  /** Enable strict mode for this rule */
  strictMode?: boolean;
  /** Documentation base URL */
  docBaseUrl?: string;
}
```

---

## ✅ Required Patterns

### ✅ REQUIRED: Factory Functions

All rules MUST be created via factory functions that accept configuration options.

```typescript
export function createMyRules(options: MyRuleOptions = {}): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!config.enableRule) {
    return {}; // Allow disabling the rule
  }

  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: "...",
        message: `Error message. See ${config.docBaseUrl}`,
      },
    ],
  };
}
```

### ✅ REQUIRED: Configurable Documentation URLs

All error messages with documentation references MUST use `${config.docBaseUrl}`.

```typescript
const DEFAULT_OPTIONS: Required<MyRuleOptions> = {
  enableRule: true,
  docBaseUrl: "docs/standards/my-rule.md",
};

// In error message
message: `❌ FORBIDDEN: [Description]. See ${config.docBaseUrl}#section`,
```

### ✅ REQUIRED: Comprehensive JSDoc

All exported functions, interfaces, and types MUST have JSDoc with:

- Description of what the rule does
- `@param` tags for parameters
- `@returns` tag for return types
- `@example` tag with usage example

````typescript
/**
 * Prevents dependency bundling into god objects
 *
 * This rule enforces individual dependency injection by detecting
 * interfaces or type aliases ending with "Dependencies" suffix.
 *
 * @param options Configuration options for dependency bundling rules
 * @returns ESLint rule configuration
 * @example
 * ```typescript
 * const rules = createDependencyBundlingRules({
 *   enforceIndividualDependencies: true,
 *   docBaseUrl: "docs/standards/architecture-principles.md"
 * });
 * ```
 */
export function createDependencyBundlingRules(
  options: ArchitecturePatternRuleOptions = {},
): Linter.RulesRecord {}
````

### ✅ REQUIRED: Type-Safe Options

All configuration interfaces MUST:

- Extend `BaseRuleOptions`
- Use optional properties with defaults
- Document each property with JSDoc

```typescript
/**
 * Configuration options for architecture pattern rules
 */
export interface ArchitecturePatternRuleOptions extends BaseRuleOptions {
  /** Enforce individual dependency injection (default: true) */
  enforceIndividualDependencies?: boolean;
}
```

---

## 🧪 Testing Requirements

### Mandatory Test Coverage

Every custom rule MUST have tests covering:

1. **Factory function behavior** - Rules created/not created based on options
2. **Configuration options** - Custom doc URLs, feature toggles
3. **AST selector patterns** - Correct syntax matching
4. **Error message validation** - Messages include doc references

### Test Template

```typescript
import { describe, it, expect } from "vitest";
import { createMyRules } from "../../src/custom-rules/my-rule.js";

describe("createMyRules", () => {
  it("should create rules when enabled", () => {
    const rules = createMyRules({ enableRule: true });
    expect(rules).toHaveProperty("no-restricted-syntax");
  });

  it("should return empty object when disabled", () => {
    const rules = createMyRules({ enableRule: false });
    expect(rules).toEqual({});
  });

  it("should include documentation reference", () => {
    const customDocUrl = "custom/docs/my-rule.md";
    const rules = createMyRules({ docBaseUrl: customDocUrl });

    const restrictedSyntaxRules = rules["no-restricted-syntax"] as unknown[];
    const myRule = restrictedSyntaxRules.find((rule) => {
      if (typeof rule === "object" && rule !== null && "message" in rule) {
        return (rule.message as string).includes(customDocUrl);
      }
      return false;
    });

    expect(myRule).toBeDefined();
    expect((myRule as { message: string }).message).toContain(customDocUrl);
  });
});

describe("Rule selector patterns", () => {
  it("should match correct AST patterns", () => {
    const rules = createMyRules();
    const restrictedSyntaxRules = rules["no-restricted-syntax"] as unknown[];

    const myRule = restrictedSyntaxRules.find((rule) => {
      if (typeof rule === "object" && rule !== null && "selector" in rule) {
        return (rule.selector as string).includes("ExpectedPattern");
      }
      return false;
    }) as { selector: string };

    expect(myRule.selector).toContain("ExpectedPattern");
  });
});
```

### Running Tests

```bash
# Run all custom rule tests
pnpm --filter=@reasonabletech/eslint-config test tests/unit/

# Run specific rule tests
pnpm --filter=@reasonabletech/eslint-config test tests/unit/my-rule.test.ts

# Run with coverage
pnpm --filter=@reasonabletech/eslint-config test:coverage
```

---

## 📖 Documentation Requirements

### JSDoc Standards

All exported symbols require JSDoc with:

````typescript
/**
 * Brief one-line description
 *
 * Optional multi-line explanation of what this does,
 * why it exists, and how it should be used.
 *
 * @param paramName Parameter description
 * @returns Return value description
 * @example
 * ```typescript
 * const result = myFunction({ option: true });
 * ```
 */
````

### Antipattern Documentation

When adding a new rule, you MUST update `docs/standards/eslint-rule-antipatterns.md` with:

1. **Add to Table of Contents**:

   ```markdown
   ## Table of Contents

   ### Category Antipatterns

   X. [Antipattern Name](#antipattern-x-antipattern-name) - Brief description
   ```

2. **Add to Quick Reference Table**:

   ```markdown
   | #   | Antipattern | Severity | ESLint Rule | Auto-Fix | Migration Effort |
   | --- | ----------- | -------- | ----------- | -------- | ---------------- |
   | X   | Name        | 🔴/🟠/🟡 | `rule-name` | Yes/No   | Low/Medium/High  |
   ```

3. **Create Detailed Section**:

   ````markdown
   ### Antipattern X: Name

   **Rule:** `eslint-rule-name`

   **Why Dangerous:**

   - Bullet point explaining risk
   - Another risk factor

   **❌ FORBIDDEN PATTERNS:**

   ```typescript
   // Bad code example
   ```
   ````

   **✅ REQUIRED PATTERNS:**

   ```typescript
   // Good code example
   ```

   **Real-World Violations:**
   - `path/to/file.ts` - Description

   **Migration Guide:**
   1. Step one
   2. Step two
   3. Verification

   **Referenced By:**
   - [Other Standard](./other-standard.md#section)

   ```

   ```

4. **Update Cross-References**:
   Ensure the antipattern is referenced from:
   - Error Handling Standards (if applicable)
   - Architecture Principles (if applicable)
   - TypeScript Standards (if applicable)

---

## 🏗️ Architecture Patterns

### Factory Pattern

All rules use the factory pattern for configuration:

```typescript
// 1. Define options interface
interface MyRuleOptions extends BaseRuleOptions {
  strictMode?: boolean;
}

// 2. Define defaults
const DEFAULT_OPTIONS: Required<MyRuleOptions> = {
  strictMode: false,
  docBaseUrl: "docs/standards/my-rule.md",
};

// 3. Create factory function
export function createMyRules(options: MyRuleOptions = {}): Linter.RulesRecord {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Feature toggle
  if (!config.strictMode) {
    return {};
  }

  // Return configured rules
  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: "...",
        message: `Error. See ${config.docBaseUrl}`,
      },
    ],
  };
}
```

### Preset Pattern

Two preset types exist:

1. **Platform Preset** - Strict enforcement for projects
2. **Generic Preset** - Flexible for non-projects

```typescript
// Platform preset (strict)
export function createPlatformMyRules(): Linter.RulesRecord {
  return createMyRules({
    strictMode: true,
    docBaseUrl: "docs/standards/eslint-rule-antipatterns.md#antipattern-x",
  });
}

// Generic preset (flexible)
export function createGenericRulePreset(
  docBaseUrl: string = "docs/",
): Linter.RulesRecord {
  return createReasonableTechRules({
    docBaseUrl: `${docBaseUrl}antipatterns.md`,
    myRule: {
      strictMode: false, // More relaxed for generic projects
    },
  });
}
```

### Modular Composition

Rules are composed using `mergeRuleConfigurations()`:

```typescript
export function createReasonableTechRules(
  options: ReasonableTechRuleOptions = {},
): Linter.RulesRecord {
  const errorHandlingRules = createErrorHandlingRules(options.errorHandling);
  const architectureRules = createArchitecturePatternRules(
    options.architecturePatterns,
  );
  const myNewRules = createMyNewRules(options.myNewRule);

  return mergeRuleConfigurations(
    errorHandlingRules,
    architectureRules,
    myNewRules,
  );
}
```

**Why this pattern**:

- Independent rule sets can be enabled/disabled
- Clear separation of concerns
- Easy to add new rule categories
- Flexible composition for different presets

---

## 🔗 Related Documentation

### Implementation Files

- `./error-handling.ts` - Error handling rules (4 rules)
- `./null-undefined-checks.ts` - Type checking rules (1 rule)
- `./architecture-patterns.ts` - Dependency injection rules (2 rules)
- `./utils.ts` - Shared utilities and AST selectors

### Standards Documentation

- [Error Handling Standards](../../../../../docs/standards/error-handling.md)
- [Architecture Principles](../../../../../docs/standards/architecture-principles.md)
- [TypeScript Design Patterns](../../../../../docs/standards/typescript-design-patterns.md)
- [ESLint Rule Antipatterns](../../../../../docs/standards/eslint-rule-antipatterns.md)

### Testing Documentation

- [Testing Organization Standards](../../../../../docs/standards/testing-organization-standards.md)
- `../../tests/unit/` - Test suite examples

### AST Explorer

For developing AST selectors: https://astexplorer.net/

Select:

- Language: JavaScript
- Parser: `@typescript-eslint/parser`

---

**This file provides complete guidelines for contributing custom ESLint rules. For the authoritative antipattern catalog, see [eslint-rule-antipatterns.md](../../../../../docs/standards/eslint-rule-antipatterns.md).**

## Related Documentation

- [Custom Rules README](./README.md) — Rule catalog, presets, and usage
- [API Reference](../../docs/reference/api-reference.md) — Public exports and plugin rule documentation
- [Package README](../../README.md) — Quick start and overview
