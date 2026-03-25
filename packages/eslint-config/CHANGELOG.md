# @reasonabletech/eslint-config

## 0.2.1

### Patch Changes

- - Automated release.

## 0.2.0

### Minor Changes

- [`f862453`](https://github.com/ReasonableTech/core-utils/commit/f86245352ba4ef8df56a124c8f17bf8605ac9085) Thanks [@WillieCubed](https://github.com/WillieCubed)! - Audit and fix custom ESLint rules for correctness, false-positive reduction, and API consistency.

  #### Breaking changes — action required
  - `no-linter-disabling` is deprecated and no longer enabled by default. If you relied on it, use ESLint's built-in `reportUnusedDisableDirectives` option and the native `-- reason` inline syntax instead. The rule remains in the plugin if you need to opt in explicitly.
  - `no-dependency-bundling` no longer flags interfaces based on property types. Only interfaces and type aliases named `*Dependencies` or `*Deps` are flagged. If you had false-positive suppressions for domain models, you can remove them.
  - `createTerminologyRules()` no longer includes default forbidden terms. Pass `forbiddenTerms` explicitly: `createTerminologyRules({ forbiddenTerms: { toolCall: "action" } })`.
  - `createBarrelExportRules()` and `createCodeQualityRules()` no longer accept options (the parameters were no-ops). Remove any arguments at the call site.
  - `createResultTypeRules()` has been removed (it returned an empty object). Remove any imports.

  #### New rule
  - `no-constructor-instantiation` replaces the previous `no-restricted-syntax` selector that flagged all `new PascalCase()` calls in constructors. The new rule allows built-in constructors (`Map`, `Date`, `Set`, etc.) and default parameter values (`db: Database = new Database()`). No config changes needed — `createDependencyInjectionRules()` uses it automatically.

  #### Bug fixes
  - `no-error-message-parsing` now correctly detects `/regex/.test(error.message)` patterns (previously only caught `error.message.test()`, which nobody writes).
  - `mergeRuleConfigurations` no longer silently escalates `"warn"` severity to `"error"` when merging `no-restricted-syntax` patterns.
  - `no-null-undefined-checks` error message now provides actionable guidance on simplifying `T | null | undefined` types.

## [Unreleased]

Initial release preparation. See [README.md](./README.md) for usage.

---

_Changelog entries are automatically generated from [changesets](https://github.com/changesets/changesets) on release._
