# API Reference

## Package Exports

The package exposes three entry points. All internal modules (`base-configs`, `shared-rules`, `shared-ignores`, etc.) are **not** part of the public API.

### `@reasonabletech/eslint-config`

```typescript
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";
```

#### `createTypeAwareConfig(projectDir: string): Linter.Config[]`

Creates a comprehensive type-aware ESLint configuration for TypeScript projects.

**Parameters:**

- `projectDir` — Absolute path to the project root (use `import.meta.dirname`)

**Returns:** Array of ESLint flat config objects

**Includes:**

- ESLint recommended rules
- TypeScript-ESLint recommended + type-checked rules
- Prettier compatibility
- JSDoc enforcement
- Turbo monorepo rules
- `@reasonabletech` custom plugin rules (see below)
- Comprehensive ignore patterns
- Test file relaxation (`tests/**`, `examples/**`)

**Also exports:** `sharedReactComponentRules` (shared React rules for use in custom configurations)

---

### `@reasonabletech/eslint-config/react`

```typescript
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";
```

#### `createTypeAwareReactConfig(projectDir: string): Linter.Config[]`

Creates a type-aware ESLint configuration for React projects.

**Parameters:**

- `projectDir` — Absolute path to the project root

**Includes everything in the base config plus:**

- React Hooks plugin (`rules-of-hooks`, `exhaustive-deps`)
- React Refresh plugin for HMR
- JSX transform compatibility (no React import required)
- Browser and service worker globals
- Relaxed parameter typing for component props

---

### `@reasonabletech/eslint-config/next`

```typescript
import { createTypeAwareNextConfig } from "@reasonabletech/eslint-config/next";
```

#### `createTypeAwareNextConfig(projectDir: string): Linter.Config[]`

Creates a type-aware ESLint configuration for Next.js applications.

**Parameters:**

- `projectDir` — Absolute path to the project root

**Includes everything in the React config plus:**

- Next.js Core Web Vitals rules
- Server action support (async functions without explicit `await`)
- Next.js-specific ignore patterns (`.next/`, `out/`)

---

## `@reasonabletech` ESLint Plugin

All configurations automatically register the `@reasonabletech` ESLint plugin, which provides 4 custom rules implemented with `ESLintUtils.RuleCreator`:

### `@reasonabletech/no-dependency-bundling`

Prevents dependency "god object" patterns where multiple services are bundled into a single `Dependencies` object.

```typescript
// Triggers lint error
class UserService {
  constructor(private deps: Dependencies) {} // "Dependencies" suffix detected
}

// Correct: inject dependencies individually
class UserService {
  constructor(
    private db: DatabaseClient,
    private logger: Logger,
  ) {}
}
```

### `@reasonabletech/no-linter-disabling`

Requires justification comments when disabling ESLint rules. Bare `eslint-disable` comments without explanation are flagged.

```typescript
// Triggers lint error
// eslint-disable-next-line @typescript-eslint/no-unused-vars

// Correct: provide justification
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by framework callback signature
```

### `@reasonabletech/no-null-undefined-checks`

Catches null/undefined checks that don't match the variable's declared type union. For example, checking `=== null` when the type is `T | undefined` (not `T | null`).

```typescript
function process(value: string | undefined) {
  // Triggers lint error: null is not in the type union
  if (value === null) {
    return;
  }

  // Correct: check for what's actually in the type
  if (value === undefined) {
    return;
  }
}
```

### `@reasonabletech/use-result-helpers`

Enforces use of `ok()` and `err()` helper functions from `@reasonabletech/utils` instead of manually constructing Result objects.

```typescript
// Triggers lint error
return { success: true, data: user };

// Correct: use helpers
return ok(user);
```

---

## Additional Rule Enforcement

Beyond the 4 plugin rules, configurations also enforce patterns via `no-restricted-syntax` AST selectors. These are organized as factory functions in `src/custom-rules/`:

| Factory Function                   | What It Enforces                                                     |
| ---------------------------------- | -------------------------------------------------------------------- |
| `createErrorHandlingRules()`       | No error message parsing, documented error types, naming conventions |
| `createTypeSafetyRules()`          | No `as any` casts, no double casts through `any`                     |
| `createArchitecturePatternRules()` | Service architecture patterns, DI enforcement                        |
| `createCodeQualityRules()`         | No `export *` (barrel exports), no mixed async patterns              |
| `createPlatformConventionRules()`  | UI barrel import restrictions                                        |
| `createNullUndefinedChecksRules()` | Additional null/undefined pattern enforcement                        |

### Preset Functions

Two preset functions combine these rule sets:

#### `createPlatformRulePreset(): Linter.RulesRecord`

All rules with platform-specific defaults (strict settings, platform documentation URLs).

#### `createGenericRulePreset(docBaseUrl?: string): Linter.RulesRecord`

Subset of rules suitable for non-projects. Accepts a custom documentation base URL.

---

## Usage Patterns

### Standard project

```typescript
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

### With custom overrides

```typescript
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

### File-specific overrides

```typescript
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default [
  ...createTypeAwareReactConfig(import.meta.dirname),
  {
    files: ["**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
```

## TypeScript Integration

All configurations use `projectService: true` for automatic `tsconfig.json` discovery. Your project must have a valid `tsconfig.json` in the project root.

## Related Documentation

- [Usage Guide](../guides/usage-guide.md) — Setup and troubleshooting
- [Architecture](../concepts/architecture.md) — Design decisions
- [Custom Rules README](../../src/custom-rules/README.md) — Rule implementation details and contributing guide
