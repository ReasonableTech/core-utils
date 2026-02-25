# @reasonabletech/config-vitest Usage Guide

This guide covers canonical usage patterns for Vitest configuration in greenfield packages.

## Installation

```bash
pnpm add -D @reasonabletech/config-vitest vitest vite @vitest/coverage-v8
```

## Quick Start

```ts
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

## Factory Selection

### Base Projects

```ts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

### React Projects

```ts
import { createReactConfig } from "@reasonabletech/config-vitest/react";

export default createReactConfig(import.meta.dirname);
```

### Node Projects

```ts
import { createNodeConfig } from "@reasonabletech/config-vitest/node";

export default createNodeConfig(import.meta.dirname);
```

### Long-Running Integration Suites

```ts
import { createLongRunningTestConfig } from "@reasonabletech/config-vitest";

export default createLongRunningTestConfig(import.meta.dirname, {
  test: {
    include: ["tests/integration/**/*.test.ts"],
  },
});
```

## Coverage Defaults

- Provider: `v8`
- Report directory: `generated/test-coverage`
- Reporters: `text`, `html`, `lcov`, `json`
- Thresholds: `100` for lines/functions/branches/statements

Set `VITEST_COVERAGE_THRESHOLDS_DISABLED=true` when temporary local diagnostics are needed.

## Troubleshooting

### Self-imports fail in tests

Pass `import.meta.dirname` to the factory. This enables auto aliasing from package name to local `src/`.

### Missing setup files

The config auto-detects `vitest.setup.ts` and `tests/setup.ts` only when they exist. Create one of these files if you need framework setup hooks.

## Related Documentation

- [Package Docs Index](../README.md)
- [Base Config Details](../api/base-config.md)
- [Package README](../../README.md)
