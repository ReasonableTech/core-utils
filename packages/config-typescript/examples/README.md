# @reasonabletech/config-typescript Examples

These examples show practical `tsconfig` setups using exported `.json` presets.

## Files In This Directory

- [base-config.ts](./base-config.ts): baseline TypeScript project examples
- [react-app-config.ts](./react-app-config.ts): React and Next.js app-oriented examples

## Installation

```bash
pnpm add -D typescript @reasonabletech/config-typescript
```

## Quick Start

```json
{
  "extends": "@reasonabletech/config-typescript/base.json",
  "include": ["src/**/*"]
}
```

## Preset Path Format

Use package subpaths with `.json`:

- `@reasonabletech/config-typescript/base.json`
- `@reasonabletech/config-typescript/react-app.json`
- `@reasonabletech/config-typescript/react-library.json`
- `@reasonabletech/config-typescript/nextjs.json`
- `@reasonabletech/config-typescript/server.json`
- `@reasonabletech/config-typescript/strict.json`

## Example: App + Test Config Split

`tsconfig.json`:

```json
{
  "extends": "@reasonabletech/config-typescript/app.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

`tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```
