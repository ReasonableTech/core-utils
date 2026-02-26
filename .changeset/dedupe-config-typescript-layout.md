---
"@reasonabletech/config-typescript": patch
"@reasonabletech/config-tsup": patch
"@reasonabletech/utils": patch
---

De-duplicate TypeScript preset packaging by making `lib/*.json` the only canonical source and removing redundant top-level wrapper files. Documentation and examples were also updated to use valid `.json` preset paths and the currently supported preset surface.

Standardize release verification scripts across `config-typescript` and `config-tsup` with a shared naming contract (`verify:package`, `verify:consumer`, `verify:release`) and switch root release verification orchestration to Turbo.
