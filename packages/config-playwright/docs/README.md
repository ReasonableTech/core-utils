# @reasonabletech/config-playwright Documentation

Reference documentation for shared Playwright configuration in the core-utils monorepo.

## Start Here

- [Usage Guide](./guides/usage-guide.md)

## API Reference

- [API Reference](./api/api-reference.md) — Factory functions, options, and preset configs

## Quick Example

```ts
// playwright.config.ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig({
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

## Monorepo Context

- [Package README](../README.md)
- [Architecture](../../../docs/architecture.md) — How packages relate
- [Tooling](../../../docs/tooling.md) — Turbo, Changesets, Playwright details
- [Contributing](../../../CONTRIBUTING.md)
