# @reasonabletech/config-tsup Usage Guide

This guide covers canonical usage of `@reasonabletech/config-tsup` for greenfield package builds.

## Installation

```bash
pnpm add -D @reasonabletech/config-tsup tsup typescript
```

## Quick Start

```ts
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
```

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

## Common Configuration Patterns

### Library Build

```ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  dts: true,
  entry: { index: "src/index.ts" },
  format: ["esm"],
});
```

### React Component Package

```ts
import { reactConfig } from "@reasonabletech/config-tsup";

export default reactConfig;
```

### Node Runtime Package

```ts
import { nodeConfig } from "@reasonabletech/config-tsup";

export default nodeConfig;
```

### Config/Tooling Package

```ts
import { configPackageConfig } from "@reasonabletech/config-tsup";

export default configPackageConfig;
```

## Defaults from `createTsupConfig()`

- `entry: { index: "src/index.ts" }`
- `format: ["esm"]`
- `platform: "neutral"`
- `target: "ES2023"`
- `sourcemap: true`
- `treeshake: true`
- `splitting: false`
- `clean: false`

When `tsconfig` is omitted, the factory uses `tsconfig.build.json` automatically if present.

## Troubleshooting

### Unexpected bundled dependencies

Use `external` and `noExternal` explicitly if your package has strict bundling requirements.

### Wrong TypeScript config used

Pass `tsconfig` directly to `createTsupConfig` if your package does not use `tsconfig.build.json`.

## Related Documentation

- [Package README](../../README.md)
