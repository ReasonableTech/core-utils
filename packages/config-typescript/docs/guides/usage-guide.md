# @reasonabletech/config-typescript Usage Guide

This guide covers canonical setup for TypeScript presets in greenfield packages and apps.

## Installation

```bash
pnpm add -D @reasonabletech/config-typescript typescript
```

## Quick Start

```json
{
  "extends": "@reasonabletech/config-typescript/base.json"
}
```

## Choose the Right Preset

### Application Presets

- `@reasonabletech/config-typescript/app.json`
- `@reasonabletech/config-typescript/react-app.json`
- `@reasonabletech/config-typescript/nextjs.json`
- `@reasonabletech/config-typescript/server.json`

### Library Presets

- `@reasonabletech/config-typescript/library.json`
- `@reasonabletech/config-typescript/react-library.json`
- `@reasonabletech/config-typescript/browser-library.json`
- `@reasonabletech/config-typescript/platform-library.json`

### Specialized Presets

- `@reasonabletech/config-typescript/chrome-extension.json`
- `@reasonabletech/config-typescript/vscode-extension.json`
- `@reasonabletech/config-typescript/tooling.json`
- `@reasonabletech/config-typescript/eslint.json`
- `@reasonabletech/config-typescript/strict.json`
- `@reasonabletech/config-typescript/docs.json`

## Configuration Examples

### React App

```json
{
  "extends": "@reasonabletech/config-typescript/react-app.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src"]
}
```

### Library

```json
{
  "extends": "@reasonabletech/config-typescript/library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Troubleshooting

### `extends` cannot be resolved

Ensure the package is installed in the same workspace/project where `tsconfig.json` is evaluated.

### Incompatible runtime module resolution

Use the preset aligned with your runtime:

- Node/Bun style runtimes: `base.json`, `app.json`, `server.json`
- Next.js app router projects: `nextjs.json`

## Related Documentation

- [Package Docs Index](../README.md)
- [Base Config Details](../api/base-config.md)
- [Package README](../../README.md)
