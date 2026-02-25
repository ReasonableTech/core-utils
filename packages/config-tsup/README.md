# @reasonabletech/config-tsup

[![npm version](https://img.shields.io/npm/v/@reasonabletech/config-tsup.svg)](https://www.npmjs.com/package/@reasonabletech/config-tsup)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/config-tsup.svg)](https://www.npmjs.com/package/@reasonabletech/config-tsup)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/config-tsup` provides shared `tsup` configuration factories for library and tooling packages. The defaults produce ESM-only output with declaration files, targeting a neutral platform — override only the options that differ from those defaults.

## Installation

```bash
pnpm add -D @reasonabletech/config-tsup tsup typescript
```

## Peer Dependencies

| Dependency | Version   | Required |
| ---------- | --------- | -------- |
| tsup       | >= 8.0    | Yes      |
| typescript | >= 5.0    | Yes      |

This package generates tsup configuration objects and requires tsup 8.0+ for ESM-first defaults and TypeScript 5.0+ for type checking.

## Exported API

```ts
import {
  createTsupConfig,
  configPackageConfig,
  nodeConfig,
  reactConfig,
  type EsbuildOptionsFunction,
  type TsupConfigOptions,
} from "@reasonabletech/config-tsup";
```

## Usage

### Default Library Configuration

```ts
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
```

### Customized Configuration

```ts
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  dts: true,
  entry: { index: "src/index.ts" },
  external: ["react"],
});
```

### Preset Configurations

```ts
import {
  configPackageConfig,
  nodeConfig,
  reactConfig,
} from "@reasonabletech/config-tsup";

export default reactConfig;
```

## Defaults

`createTsupConfig()` defaults to:

- `entry: { index: "src/index.ts" }`
- `format: ["esm"]`
- `platform: "neutral"`
- `target: "ES2023"`
- `sourcemap: true`
- `treeshake: true`
- `splitting: false`
- `clean: false`

If `tsconfig` is omitted, the factory uses `tsconfig.build.json` automatically when present.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/README.md)
