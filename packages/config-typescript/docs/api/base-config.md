# TypeScript Presets API Reference

This package publishes TypeScript presets as JSON config files.

## How To Use

Use one preset in your `tsconfig.json` `extends`:

```json
{
  "extends": "@reasonabletech/config-typescript/base.json"
}
```

All presets are exported with a `.json` suffix.

## Preset Catalog

| Preset | Extends | Highlights |
| --- | --- | --- |
| `base.json` | — | ES2022 target, `module: NodeNext`, strict mode, declaration/source maps, incremental builds |
| `app.json` | `base.json` | App-friendly path alias default: `@/* -> src/*` |
| `library.json` | `base.json` | Library default `emitDeclarationOnly: true` |
| `react-app.json` | `base.json` | React app defaults (`jsx: react-jsx`, DOM libs, `noEmit: true`) |
| `react-library.json` | `base.json` | React library defaults (DOM libs, JSX transform/import source) |
| `nextjs.json` | `base.json` | Next.js defaults (`module: ESNext`, `moduleResolution: bundler`, Next plugin, `noEmit: true`) |
| `server.json` | `base.json` | Node service defaults with decorator metadata and app-style path alias |
| `browser-library.json` | `base.json` | Browser lib target (`ES2023`, DOM libs) |
| `platform-library.json` | `base.json` | Platform package baseline with React/Next/Node type sets |
| `chrome-extension.json` | `base.json` | Chrome extension type surface (`chrome`, `node`) |
| `vscode-extension.json` | `base.json` | VS Code extension type surface (`vscode`, `node`) |
| `eslint.json` | `base.json` | ESLint authoring preset (`emitDeclarationOnly`, include/exclude defaults) |
| `docs.json` | `base.json` | Documentation-focused preset (`skipLibCheck: false`) |
| `tooling.json` | `base.json` | Tooling/script projects with base strict defaults |
| `strict.json` | `base.json` | Extra strictness (`exactOptionalPropertyTypes`, indexed-access checks, override guards) |

## Common Usage Patterns

### Application

```json
{
  "extends": "@reasonabletech/config-typescript/app.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### Library

```json
{
  "extends": "@reasonabletech/config-typescript/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Strict Variant

```json
{
  "extends": "@reasonabletech/config-typescript/strict.json"
}
```

## Source of Truth

Preset implementations live under:

- `packages/config-typescript/lib/base.json`
- `packages/config-typescript/lib/*.json`

Review those files for exact compiler option values.
