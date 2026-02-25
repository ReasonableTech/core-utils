# @reasonabletech/config-tsup Documentation

Reference documentation for shared `tsup` configuration in the core-utils monorepo.

## Start Here

- [Usage Guide](./guides/usage-guide.md)

## API Reference

- [API Reference](./api/api-reference.md) — Factory functions, options, and preset configs

## Quick Example

```ts
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  dts: true,
  clean: true,
});
```

## Monorepo Context

- [Package README](../README.md)
- [Architecture](../../../docs/architecture.md) — How packages relate
- [Tooling](../../../docs/tooling.md) — Turbo, Changesets, tsup details
- [Contributing](../../../CONTRIBUTING.md)
