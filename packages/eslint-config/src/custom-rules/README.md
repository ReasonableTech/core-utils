# Custom ESLint Rules

Reusable ESLint rule configurations enforcing type safety, error handling, architecture patterns, and platform conventions across the monorepo.

## `@reasonabletech` ESLint Plugin

Four rules are registered as a proper ESLint plugin via `src/plugin.ts`. They appear in lint output as `@reasonabletech/rule-name` and are implemented with `ESLintUtils.RuleCreator` from `@typescript-eslint/utils`:

| Plugin Rule                                | What It Catches                                             |
| ------------------------------------------ | ----------------------------------------------------------- |
| `@reasonabletech/no-dependency-bundling`   | God-object dependency patterns (`Dependencies` suffix)      |
| `@reasonabletech/no-linter-disabling`      | Unjustified `eslint-disable` comments                       |
| `@reasonabletech/no-null-undefined-checks` | Null/undefined checks that don't match declared types       |
| `@reasonabletech/use-result-helpers`       | Manual Result object construction instead of `ok()`/`err()` |

## `no-restricted-syntax` Rules

Additional patterns are enforced via `no-restricted-syntax` AST selectors. These don't require plugin registration since they use ESLint's built-in rule with custom selectors:

| Module                       | Factory Function                   | What It Enforces                                                                       |
| ---------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| **error-handling.ts**        | `createErrorHandlingRules()`       | No error message parsing, documented error types, correct naming, no inline unions     |
| **null-undefined-checks.ts** | `createNullUndefinedChecksRules()` | Match null/undefined checks to declared types (AST selector complement to plugin rule) |
| **architecture-patterns.ts** | `createArchitecturePatternRules()` | No dependency god objects, no singletons, proper DI                                    |
| **type-safety.ts**           | `createTypeSafetyRules()`          | No `as any` casts, no double casts through any                                         |
| **code-quality.ts**          | `createCodeQualityRules()`         | No unjustified linter disabling, no `export *`, no mixed async patterns                |
| **platform-conventions.ts**  | `createPlatformConventionRules()`  | Use `ok()`/`err()` helpers with shared platform conventions                            |
| **ui-library-imports.ts**    | `createUILibraryImportRules()`     | No `@lovelace-ai/ui` barrel imports; require subpath imports                           |
| **test-quality.ts**          | `createNoTypeofInExpectRules()`    | No `typeof` in Vitest `expect()` assertions                                            |

Supporting utilities live in **utils.ts** (AST selectors, rule merging, doc reference helpers).

## Presets

### Platform Preset (all rules, strict defaults)

```typescript
import { createPlatformRulePreset } from "./custom-rules/index.js";

const rules = createPlatformRulePreset();
```

### Generic Preset (subset, configurable doc URLs)

```typescript
import { createGenericRulePreset } from "./custom-rules/index.js";

const rules = createGenericRulePreset("docs/standards/");
```

### Individual Rule Sets

```typescript
import {
  createErrorHandlingRules,
  createTypeSafetyRules,
  createPlatformConventionRules,
} from "./custom-rules/index.js";

const errorRules = createErrorHandlingRules({ docBaseUrl: "docs/" });
const typeRules = createTypeSafetyRules();
const platformRules = createPlatformConventionRules({
  enforceResultHelpers: true,
  discourageUIBarrelImports: true,
  uiImportBoundaries: {},
});
```

### Custom Combination

```typescript
import { createReasonableTechRules } from "./custom-rules/index.js";

const rules = createReasonableTechRules({
  docBaseUrl: "https://company.com/docs/",
  errorHandling: { requireErrorTypeJSDoc: true },
  typeSafety: { allowInTests: false },
  codeQuality: {
    linterDisabling: { requireJustification: true },
    barrelExports: {},
  },
});
```

## Architecture

All rule modules follow the same pattern:

1. **Factory functions** (`create*Rules()`) return `Linter.RulesRecord`
2. **Platform presets** (`createPlatform*Rules()`) apply platform-specific defaults
3. **Custom ESLint rules** use `ESLintUtils.RuleCreator` and are aggregated into the `@reasonabletech` plugin in `src/plugin.ts`
4. **`mergeRuleConfigurations()`** safely combines `no-restricted-syntax` arrays from multiple rule sets

The plugin is registered in the base config (`base-configs.ts`) so all 4 plugin rules are available in every configuration.

## Testing

```bash
# Unit tests (rule configuration, options, merging)
pnpm test tests/unit/

# Integration tests (ESLint Linter.verify() against code samples)
pnpm test tests/integration/

# All tests
pnpm test
```

Integration tests use fixture code samples in `tests/fixtures/code-samples/` organized by rule category.

## Contributing

See [AGENTS.md](./AGENTS.md) for step-by-step instructions on adding new custom rules, required patterns, testing requirements, and architecture guidelines.

## Antipattern Reference

For detailed documentation of each prohibited pattern with examples and real-world violations, see [ESLint Rule Antipatterns](../../../../../docs/standards/eslint-rule-antipatterns.md).

## Related Documentation

- [API Reference](../../docs/reference/api-reference.md) — Public exports and plugin rule documentation
- [Architecture](../../docs/concepts/architecture.md) — Package design principles
- [Package README](../../README.md) — Quick start and overview
