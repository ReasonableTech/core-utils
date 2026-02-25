# @reasonabletech/core-utils

[![CI](https://github.com/ReasonableTech/core-utils/actions/workflows/release.yml/badge.svg)](https://github.com/ReasonableTech/core-utils/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-green.svg)](https://nodejs.org/)

Shared engineering configuration and utility packages published by ReasonableTech. Each package is independently installable and covers one concern — TypeScript config, build tooling, test runner setup, linting, browser testing, or runtime utilities.

## Packages

| Package | Description | Links |
| ------- | ----------- | ----- |
| `@reasonabletech/config-typescript` | `tsconfig` presets for apps, libraries, and tooling | [README](./packages/config-typescript/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/config-typescript) |
| `@reasonabletech/config-tsup` | `tsup` build configuration factories | [README](./packages/config-tsup/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/config-tsup) |
| `@reasonabletech/config-vitest` | Vitest configuration factories with coverage defaults | [README](./packages/config-vitest/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/config-vitest) |
| `@reasonabletech/config-eslint` | ESLint flat-config factories and custom rules for TypeScript, React, and Next.js | [README](./packages/config-eslint/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/config-eslint) |
| `@reasonabletech/config-playwright` | Playwright configuration factories for single-app and cross-app test suites | [README](./packages/config-playwright/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/config-playwright) |
| `@reasonabletech/utils` | Runtime utilities: Result types, datetime, object helpers, retry, async pipelines | [README](./packages/utils/README.md) · [npm](https://www.npmjs.com/package/@reasonabletech/utils) |

> [!NOTE]
> **ReasonableTech developers:** These packages are part of our shared engineering standards. See [docs/standards/README.md](./docs/standards/README.md) for TypeScript, error handling, testing, and architecture guidelines that apply when working with this toolchain.

## Quickstart

Install the packages your project needs:

```bash
pnpm add -D \
  @reasonabletech/config-typescript \
  @reasonabletech/config-tsup \
  @reasonabletech/config-vitest \
  @reasonabletech/config-eslint \
  @reasonabletech/config-playwright
pnpm add @reasonabletech/utils
```

Wire them into your config files:

### `tsconfig.json`

```json
{
  "extends": "@reasonabletech/config-typescript/base.json"
}
```

### `tsup.config.ts`

```ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
```

### `vitest.config.mts`

```ts
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

### `eslint.config.mjs`

```js
import { createTypeAwareConfig } from "@reasonabletech/config-eslint";

export default createTypeAwareConfig(import.meta.dirname);
```

### `playwright.config.ts`

```ts
import { createPlaywrightConfig } from "@reasonabletech/config-playwright";

export default createPlaywrightConfig();
```

Each package README linked in the table above covers all available exports, preset options, and peer dependency requirements.

## Development

> This section is for contributors working in this repository.

Requires Node.js `>= 22` and pnpm `10.8.1` (see `packageManager` in `package.json`).

```bash
git clone git@github.com:ReasonableTech/core-utils.git
cd core-utils
pnpm bootstrap
```

`pnpm bootstrap` performs first-run environment checks and installs workspace dependencies. Common commands after that:

- `pnpm build` — Build all packages
- `pnpm test` — Run all test suites
- `pnpm quality` — Lint, typecheck, and build together
- `pnpm format` — Format with Prettier

See [docs/scripts.md](./docs/scripts.md) for the full script reference.

## Documentation

- **[Developer Docs](./docs/README.md)** — Architecture, tooling, scripts, CI/CD
- **[Contributing Guide](./CONTRIBUTING.md)** — How to contribute
- **Package Docs** — See individual package READMEs linked above

## License

MIT
