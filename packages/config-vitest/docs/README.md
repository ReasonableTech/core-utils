# @reasonabletech/config-vitest Documentation

Reference documentation for shared Vitest configuration in the core-utils monorepo.

## Start Here

- [Usage Guide](./guides/usage-guide.md)

## API Reference

- [API Reference](./api/api-reference.md) — Factory functions, options, and preset configs
- [Base Configuration](./api/base-config.md) — Detailed base config reference

## Quick Example

```ts
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

## Monorepo Context

- [Package README](../README.md)
- [Architecture](../../../docs/architecture.md) — How packages relate
- [Tooling](../../../docs/tooling.md) — Turbo, Changesets, Vitest details
- [Contributing](../../../CONTRIBUTING.md)
