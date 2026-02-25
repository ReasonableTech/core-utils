# @reasonabletech/config-eslint

[![npm version](https://img.shields.io/npm/v/@reasonabletech/config-eslint.svg)](https://www.npmjs.com/package/@reasonabletech/config-eslint)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/config-eslint.svg)](https://www.npmjs.com/package/@reasonabletech/config-eslint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/config-eslint` provides opinionated, type-aware ESLint flat configs for TypeScript, React, and Next.js projects. Type-aware linting runs ESLint rules that require a TypeScript project reference — these rules catch issues like unsafe `any` assignments and incorrect promise handling that non-type-aware rules miss.

## Installation

```bash
pnpm add -D @reasonabletech/config-eslint eslint typescript
```

## Peer Dependencies

| Dependency | Version   | Required |
| ---------- | --------- | -------- |
| eslint     | >= 9.0    | Yes      |
| typescript | >= 5.0    | Yes      |

This package uses ESLint flat config format (introduced in ESLint 9.0) and requires TypeScript 5.0+ for type-aware linting. Legacy `.eslintrc` configuration is not supported.

## Exported Entry Points

| Import Path                           | Purpose                    | Main Exports                                         |
| ------------------------------------- | -------------------------- | ---------------------------------------------------- |
| `@reasonabletech/config-eslint`       | TypeScript baseline config | `createTypeAwareConfig`, `sharedReactComponentRules` |
| `@reasonabletech/config-eslint/react` | React project config       | `createTypeAwareReactConfig`                         |
| `@reasonabletech/config-eslint/next`  | Next.js project config     | `createTypeAwareNextConfig`                          |

## Usage

### TypeScript Project

```ts
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/config-eslint";

export default createTypeAwareConfig(import.meta.dirname);
```

### React Project

```ts
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/config-eslint/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

### Next.js Project

```ts
// eslint.config.mjs
import { createTypeAwareNextConfig } from "@reasonabletech/config-eslint/next";

export default createTypeAwareNextConfig(import.meta.dirname);
```

### Customize Rules for Your Project

```ts
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/config-eslint";

export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/index.md)
- [API Reference](./docs/reference/api-reference.md)
- [Architecture](./docs/concepts/architecture.md)
