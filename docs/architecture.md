# Architecture

This document describes the structure and design of the @reasonabletech/core-utils monorepo.

## Monorepo Structure

```
core-utils/
├── packages/                    # Published packages
│   ├── config-typescript/       # TypeScript tsconfig presets
│   ├── config-tsup/             # tsup build configuration
│   ├── config-vitest/           # Vitest test configuration
│   ├── config-eslint/           # ESLint flat-config factories
│   ├── config-playwright/       # Playwright browser test config
│   └── utils/                   # Runtime utility functions
├── scripts/                     # Build and release tooling
│   ├── bootstrap/               # First-run setup scripts
│   ├── docs/                    # Documentation validation
│   └── shared/                  # Shared script utilities
├── docs/                        # Developer documentation
└── .github/workflows/           # CI/CD pipelines
```

## Package Relationships

### Config Packages

The config packages are **linked** for versioning—when one gets a major bump, they all do. This ensures consumers can depend on compatible versions across the stack.

```
config-typescript ←── config-tsup (uses tsconfig presets)
                 ←── config-vitest (uses tsconfig presets)
                 ←── config-eslint (uses tsconfig presets)
                 ←── config-playwright (standalone)
```

### Build Dependencies

Within the monorepo, packages have build-time dependencies:

- `config-eslint` must build before other packages can lint (they use its output)
- `config-typescript` presets are consumed by other packages' tsconfig files
- `config-tsup` is used to build other packages

### The `utils` Package

`@reasonabletech/utils` is a **runtime** package (not a config package). It:

- Has no dependencies on config packages
- Is NOT linked with config packages for versioning
- Provides utilities like Result types, retry helpers, datetime functions

## Workspace Configuration

### pnpm Workspaces

Defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

### Turbo Task Graph

Turbo orchestrates tasks across packages. Key configurations in `turbo.json`:

- `build` depends on upstream packages building first (`^build`)
- `lint` depends on `config-eslint` being built
- `typecheck` depends on upstream typechecks (`^typecheck`)

See [Tooling](./tooling.md) for details on Turbo configuration.

## Design Principles

### 1. Extend, Don't Configure

Packages export factory functions that return sensible defaults. Consumers extend rather than configure from scratch:

```typescript
// Consumer just extends
export default createTsupConfig();

// Or customizes specific options
export default createTsupConfig({ dts: true });
```

### 2. Strict by Default

All config packages enable strict settings:

- TypeScript: `strict: true`, `noUncheckedIndexedAccess`, etc.
- ESLint: Type-aware rules, no implicit any
- Vitest: 100% coverage thresholds

### 3. Batteries Included

Each config package bundles its dependencies. Consumers install the config package and its peer dependencies—nothing else.

### 4. Escape Hatches

Every factory function accepts overrides. Nothing is locked down:

```typescript
export default [
  ...createTypeAwareConfig(import.meta.dirname),
  { rules: { "@typescript-eslint/no-unused-vars": "warn" } },
];
```

## Adding a New Package

See [New Package Checklist](./templates/NEW_PACKAGE_CHECKLIST.md) for the complete process.

Key steps:

1. Create `packages/new-package/` with standard structure
2. Add to `.changeset/config.json` linked packages (if config package)
3. Update root `README.md` package index
4. Run `pnpm install` to link workspace
