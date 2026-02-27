# @reasonabletech/eslint-config

[![npm version](https://img.shields.io/npm/v/@reasonabletech/eslint-config.svg)](https://www.npmjs.com/package/@reasonabletech/eslint-config)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/eslint-config.svg)](https://www.npmjs.com/package/@reasonabletech/eslint-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/eslint-config` provides opinionated, type-aware ESLint flat configs for TypeScript, React, and Next.js projects. Type-aware linting runs ESLint rules that require a TypeScript project reference — these rules catch issues like unsafe `any` assignments and incorrect promise handling that non-type-aware rules miss.

## Installation

```bash
pnpm add -D @reasonabletech/eslint-config eslint typescript
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
| `@reasonabletech/eslint-config`       | TypeScript baseline config | `createTypeAwareConfig`, `sharedReactComponentRules` |
| `@reasonabletech/eslint-config/react` | React project config       | `createTypeAwareReactConfig`                         |
| `@reasonabletech/eslint-config/next`  | Next.js project config     | `createTypeAwareNextConfig`                          |

## Usage

### TypeScript Project

```ts
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

### React Project

```ts
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

### Next.js Project

```ts
// eslint.config.mjs
import { createTypeAwareNextConfig } from "@reasonabletech/eslint-config/next";

export default createTypeAwareNextConfig(import.meta.dirname);
```

### Customize Rules for Your Project

```ts
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

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
