# config-tsup API Reference

## Package Exports

```typescript
import {
  createTsupConfig,
  reactConfig,
  nodeConfig,
  configPackageConfig,
} from "@reasonabletech/config-tsup";

import type {
  TsupConfigOptions,
  EsbuildOptionsFunction,
} from "@reasonabletech/config-tsup";
```

---

## Factory Function

### `createTsupConfig(options?)`

Creates a customized tsup build configuration with sensible defaults for TypeScript libraries.

**Signature:**

```typescript
function createTsupConfig(options?: TsupConfigOptions): Options;
```

**Parameters:**

| Parameter | Type               | Default | Description                   |
| --------- | ------------------ | ------- | ----------------------------- |
| `options` | `TsupConfigOptions` | `{}`    | Configuration options object  |

**Returns:** `Options` — A tsup configuration object

---

## Configuration Options

### `TsupConfigOptions`

```typescript
interface TsupConfigOptions {
  entry?: Record<string, string> | string | string[];
  format?: Array<"esm" | "cjs" | "iife">;
  external?: string[];
  noExternal?: Array<string | RegExp>;
  dts?: boolean;
  sourcemap?: boolean;
  bundle?: boolean;
  clean?: boolean;
  treeshake?: boolean;
  splitting?: boolean;
  platform?: "node" | "browser" | "neutral";
  target?: string;
  tsconfig?: string;
  esbuildPlugins?: unknown[];
  esbuildOptions?: EsbuildOptionsFunction;
  define?: Record<string, string>;
  onSuccess?: () => void | Promise<void>;
  minify?: boolean | "terser";
  terserOptions?: {
    compress?: Record<string, unknown>;
    mangle?: Record<string, unknown>;
  };
  metafile?: boolean;
}
```

### Option Details

| Option            | Type                                   | Default                   | Description                                                                                                |
| ----------------- | -------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `entry`           | `Record<string, string> \| string \| string[]` | `{ index: "src/index.ts" }` | Entry points for the build                                                                                 |
| `format`          | `Array<"esm" \| "cjs" \| "iife">`      | `["esm"]`                 | Output formats. ESM is standard; other formats are discouraged except with compelling justification        |
| `external`        | `string[]`                             | See below                 | Dependencies that should not be bundled                                                                    |
| `noExternal`      | `Array<string \| RegExp>`              | `undefined`               | Dependencies that should always be bundled. Use `[/.*/]` to bundle everything except explicit externals    |
| `dts`             | `boolean`                              | `false`                   | Generate TypeScript declaration files                                                                      |
| `sourcemap`       | `boolean`                              | `true`                    | Generate source maps                                                                                       |
| `bundle`          | `boolean`                              | `undefined` (tsup default) | Bundle dependencies                                                                                        |
| `clean`           | `boolean`                              | `false`                   | Clean output directory before building. Non-clean default avoids deleting artifacts in multi-step builds   |
| `treeshake`       | `boolean`                              | `true`                    | Enable tree shaking                                                                                        |
| `splitting`       | `boolean`                              | `false`                   | Enable code splitting. Disabled by default for better compatibility                                        |
| `platform`        | `"node" \| "browser" \| "neutral"`     | `"neutral"`               | Target platform. "neutral" is best for libraries                                                           |
| `target`          | `string`                               | `"ES2023"`                | Target environment (Node.js 22 compatible)                                                                 |
| `tsconfig`        | `string`                               | Auto-detected             | Path to TypeScript config file. Auto-resolves `tsconfig.build.json` if present                             |
| `esbuildPlugins`  | `unknown[]`                            | `[]`                      | Additional esbuild plugins                                                                                 |
| `esbuildOptions`  | `EsbuildOptionsFunction`               | `undefined`               | Custom esbuild options transformer                                                                         |
| `define`          | `Record<string, string>`               | `undefined`               | Build-time environment variable definitions                                                                |
| `onSuccess`       | `() => void \| Promise<void>`          | `undefined`               | Callback executed after successful build                                                                   |
| `minify`          | `boolean \| "terser"`                  | `undefined`               | Minification options                                                                                       |
| `terserOptions`   | `object`                               | `undefined`               | Terser-specific options (when `minify: "terser"`)                                                          |
| `metafile`        | `boolean`                              | `undefined`               | Generate metafile for bundle analysis                                                                      |

### Default Externals

When `noExternal` is not provided, these dependencies are automatically externalized:

```typescript
const defaultExternal = [
  // Peer dependencies
  "react", "react-dom", "next", "next/headers", "next/navigation",
  "next/server", "express", "electron",
  // Node.js built-ins
  "fs", "path", "os", "crypto", "child_process", "http", "https",
  "url", "events", "util", "stream", "buffer", "querystring",
];
```

---

## Type Exports

### `EsbuildOptionsFunction`

Function signature for customizing tsup's `esbuildOptions`.

```typescript
type EsbuildOptionsFunction = (options: Readonly<BuildOptions>) => BuildOptions;
```

---

## Preset Configurations

### `configPackageConfig`

Pre-configured config for build/config packages (like this one).

```typescript
const configPackageConfig = createTsupConfig({
  external: ["tsup", "esbuild"],
});
```

**Use for:** Packages that provide configuration (eslint configs, tsup configs, etc.)

---

### `reactConfig`

Pre-configured config for React component libraries.

```typescript
const reactConfig = createTsupConfig({
  external: ["@mui/icons-material"],
  esbuildOptions(options) {
    return {
      ...options,
      jsx: "automatic",
    };
  },
});
```

**Includes:**

- Automatic JSX transform (no React import required)
- `@mui/icons-material` externalized

**Use for:** React UI component libraries

---

### `nodeConfig`

Pre-configured config for Node.js applications and CLIs.

```typescript
const nodeConfig = createTsupConfig({
  platform: "node",
  external: ["dotenv"],
});
```

**Includes:**

- Platform set to `"node"`
- `dotenv` externalized

**Use for:** Node.js servers, CLIs, and backend utilities

---

## Usage Examples

### Basic Library

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
```

### Library with Declaration Files

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  dts: true,
  clean: true,
});
```

### Multiple Entry Points

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    utils: "src/utils/index.ts",
  },
});
```

### React Component Library

```typescript
// tsup.config.ts
import { reactConfig } from "@reasonabletech/config-tsup";

export default reactConfig;
```

### Custom React Config with Overrides

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  external: ["@mui/icons-material", "framer-motion"],
  esbuildOptions(options) {
    return {
      ...options,
      jsx: "automatic",
      jsxImportSource: "@emotion/react",
    };
  },
});
```

### Node.js CLI Application

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  entry: { cli: "src/cli.ts" },
  platform: "node",
  external: ["dotenv", "commander"],
  minify: true,
});
```

### Bundle All Dependencies

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  noExternal: [/.*/],
  external: ["react", "react-dom"], // Only externalize peer deps
});
```

### Config Package

```typescript
// tsup.config.ts
import { configPackageConfig } from "@reasonabletech/config-tsup";

export default configPackageConfig;
```

### With Build-Time Definitions

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  define: {
    "process.env.PACKAGE_VERSION": JSON.stringify(process.env.npm_package_version),
  },
});
```

### Production Build with Minification

```typescript
// tsup.config.ts
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig({
  minify: "terser",
  terserOptions: {
    compress: { drop_console: true },
  },
  clean: true,
  metafile: true,
});
```

---

## tsconfig Auto-Resolution

The `tsconfig` option auto-resolves in this order:

1. If `tsconfig` is explicitly provided, use it
2. Look for `tsconfig.build.json` in the package directory (via `npm_package_json`)
3. Look for `tsconfig.build.json` in the current working directory
4. Fall back to tsup's default behavior

This allows packages to use a separate `tsconfig.build.json` for builds while keeping `tsconfig.json` for IDE/editor use.

---

## Related Documentation

- [Usage Guide](../guides/usage-guide.md) — Setup and common patterns
- [Package README](../../README.md) — Quick start
