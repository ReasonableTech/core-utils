# @reasonabletech/config-typescript

[![npm version](https://img.shields.io/npm/v/@reasonabletech/config-typescript.svg)](https://www.npmjs.com/package/@reasonabletech/config-typescript)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/config-typescript.svg)](https://www.npmjs.com/package/@reasonabletech/config-typescript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/config-typescript` provides shared `tsconfig` presets for applications, libraries, tooling, and extension packages. All presets build on a strict base that enables `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and modern `Bundler` module resolution — options that catch more bugs at compile time than TypeScript's default settings.

## Installation

```bash
pnpm add -D @reasonabletech/config-typescript typescript
```

## Requirements

| Dependency | Version   | Required |
| ---------- | --------- | -------- |
| typescript | >= 5.0    | Yes      |

This package provides TypeScript configuration presets and requires TypeScript 5.0+ for full compatibility with modern `compilerOptions` and module resolution settings.

## Exported Entry Points

This package exports JSON presets via subpath imports:

- `@reasonabletech/config-typescript/<preset>.json`

## Usage

### Application Example

```json
{
  "extends": "@reasonabletech/config-typescript/app.json"
}
```

### Library Example

```json
{
  "extends": "@reasonabletech/config-typescript/library.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

## Available Presets

| Preset                                                    | Intended Use                                             |
| --------------------------------------------------------- | -------------------------------------------------------- |
| `@reasonabletech/config-typescript/base.json`             | Base strict TypeScript defaults for NodeNext projects    |
| `@reasonabletech/config-typescript/app.json`              | General application projects with `@/*` path alias       |
| `@reasonabletech/config-typescript/library.json`          | Libraries that emit declarations only                    |
| `@reasonabletech/config-typescript/browser-library.json`  | Browser-targeted libraries with DOM libs                 |
| `@reasonabletech/config-typescript/platform-library.json` | Platform libraries with React/Next-related ambient types |
| `@reasonabletech/config-typescript/react-app.json`        | React applications with JSX and `noEmit`                 |
| `@reasonabletech/config-typescript/react-library.json`    | React libraries with JSX settings                        |
| `@reasonabletech/config-typescript/nextjs.json`           | Next.js applications with bundler module resolution      |
| `@reasonabletech/config-typescript/server.json`           | Server applications with decorators and `@/*` path alias |
| `@reasonabletech/config-typescript/chrome-extension.json` | Chrome extension packages                                |
| `@reasonabletech/config-typescript/vscode-extension.json` | VS Code extension packages                               |
| `@reasonabletech/config-typescript/tooling.json`          | Tooling scripts and build utilities                      |
| `@reasonabletech/config-typescript/eslint.json`           | TypeScript settings for ESLint integration               |
| `@reasonabletech/config-typescript/strict.json`           | Additional strictness beyond `base.json`                 |
| `@reasonabletech/config-typescript/docs.json`             | Documentation-focused TypeScript settings                |

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/README.md)
- [Base Config Details](./docs/api/base-config.md)
