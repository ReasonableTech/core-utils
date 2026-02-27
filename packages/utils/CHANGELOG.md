# @reasonabletech/utils

## 0.1.1

### Patch Changes

- [`cedb66e`](https://github.com/ReasonableTech/core-utils/commit/cedb66e321e1f3cf695822467560c6f6b9f5d84c) Thanks [@WillieCubed](https://github.com/WillieCubed)! - De-duplicate TypeScript preset packaging by making `lib/*.json` the only canonical source and removing redundant top-level wrapper files. Documentation and examples were also updated to use valid `.json` preset paths and the currently supported preset surface.

  Standardize release verification scripts across `config-typescript` and `config-tsup` with a shared naming contract (`verify:package`, `verify:consumer`, `verify:release`) and switch root release verification orchestration to Turbo.

## [Unreleased]

Initial release preparation. See [README.md](./README.md) for usage.

---

_Changelog entries are automatically generated from [changesets](https://github.com/changesets/changesets) on release._
