# @reasonabletech/config-vitest

[![npm version](https://img.shields.io/npm/v/@reasonabletech/config-vitest.svg)](https://www.npmjs.com/package/@reasonabletech/config-vitest)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/config-vitest.svg)](https://www.npmjs.com/package/@reasonabletech/config-vitest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/config-vitest` provides shared Vitest configuration factories with standardized coverage and workspace-aware module resolution. All configs enforce 100% coverage thresholds by default — disable this for a specific package by setting the `VITEST_COVERAGE_THRESHOLDS_DISABLED` environment variable.

## Installation

```bash
pnpm add -D @reasonabletech/config-vitest vitest vite @vitest/coverage-v8
```

## Peer Dependencies

| Dependency          | Version   | Required |
| ------------------- | --------- | -------- |
| vitest              | >= 2.0    | Yes      |
| vite                | >= 5.0    | Yes      |
| @vitest/coverage-v8 | >= 2.0    | Optional |

This package provides Vitest configuration factories and requires vitest 2.0+ and vite 5.0+ for modern test runner features. Install `@vitest/coverage-v8` to enable coverage reporting (enabled by default in configs).

## Exported Entry Points

| Import Path                               | Purpose                       | Main Exports                                                                                             |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@reasonabletech/config-vitest`           | Base Vitest config factory    | `createVitestConfig`, `createLongRunningTestConfig`, `createReactConfig`, `createReactConfigWithPlugins` |
| `@reasonabletech/config-vitest/react`     | React-specific config factory | `createReactConfig`, `createReactConfigWithPlugins`                                                      |
| `@reasonabletech/config-vitest/node`      | Node-specific config factory  | `createNodeConfig`, `nodeConfig`                                                                         |
| `@reasonabletech/config-vitest/workspace` | Workspace utilities           | `findRepoRoot`, `readPackageName`                                                                        |

## Usage

### Base Configuration

```ts
// vitest.config.mts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

### React Configuration

```ts
// vitest.config.mts
import { createReactConfig } from "@reasonabletech/config-vitest/react";

export default createReactConfig(import.meta.dirname);
```

### Node Configuration

```ts
// vitest.config.mts
import { createNodeConfig } from "@reasonabletech/config-vitest/node";

export default createNodeConfig(import.meta.dirname);
```

### Long-Running Suites

```ts
// vitest.config.mts
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

Set `VITEST_COVERAGE_THRESHOLDS_DISABLED=true` for temporary local diagnostics.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/README.md)
- [Base Config Details](./docs/api/base-config.md)
