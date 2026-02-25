# Tooling

This document describes the development tools used in the core-utils monorepo.

## Turbo

[Turborepo](https://turbo.build/) orchestrates tasks across the monorepo.

### How We Use It

All workspace-wide commands go through Turbo:

```bash
pnpm build      # turbo run build
pnpm test       # turbo run test
pnpm lint       # turbo run lint
pnpm typecheck  # turbo run typecheck
```

### Task Configuration

Defined in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "package.json", "tsconfig.json", "tsup.config.ts"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["@reasonabletech/config-eslint#build"]
    }
  }
}
```

Key points:

- `^build` means "build upstream dependencies first"
- `lint` waits for `config-eslint` to build (we use our own ESLint config)
- Turbo caches outputs—rebuilds only what changed

### Filtering

Run tasks for specific packages:

```bash
pnpm turbo run test --filter=@reasonabletech/utils
pnpm turbo run build --filter=@reasonabletech/config-*
```

---

## Changesets

[Changesets](https://github.com/changesets/changesets) manages versioning and changelogs.

### How We Use It

When making changes that should trigger a release:

```bash
pnpm changeset
```

This creates a markdown file in `.changeset/` describing the change.

### Configuration

Defined in `.changeset/config.json`:

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "ReasonableTech/core-utils" }],
  "linked": [
    ["@reasonabletech/config-eslint", "@reasonabletech/config-typescript", ...]
  ],
  "access": "public",
  "baseBranch": "main"
}
```

Key points:

- **Linked packages**: Config packages version together. A major bump to one bumps all.
- **Public access**: Packages publish to npm public registry.
- **GitHub changelog**: Changelogs include PR links and contributor attribution.

### Versioning Strategy

- `patch`: Bug fixes, documentation
- `minor`: New features, non-breaking additions
- `major`: Breaking changes (linked packages bump together)

---

## Commitlint

[Commitlint](https://commitlint.js.org/) enforces commit message format.

### How We Use It

A git hook (`.githooks/commit-msg`) runs commitlint on every commit:

```bash
# This is rejected:
git commit -m "fixed stuff"

# This passes:
git commit -m "fix(utils): handle null in retry helper"
```

### Configuration

Defined in `commitlint.config.js`:

```javascript
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", [
      "config-typescript",
      "config-tsup",
      "config-vitest",
      "config-eslint",
      "config-playwright",
      "utils",
      "repo",
    ]],
  },
};
```

### Allowed Scopes

| Scope | Use For |
|-------|---------|
| `config-typescript` | TypeScript preset changes |
| `config-tsup` | tsup config changes |
| `config-vitest` | Vitest config changes |
| `config-eslint` | ESLint config changes |
| `config-playwright` | Playwright config changes |
| `utils` | Runtime utilities changes |
| `repo` | Monorepo-wide changes |

Omit scope for general changes that span multiple packages.

### Setup

The `prepare` script configures git to use our hooks:

```json
{
  "scripts": {
    "prepare": "git config core.hooksPath .githooks"
  }
}
```

This runs automatically on `pnpm install`.

---

## Prettier

[Prettier](https://prettier.io/) formats code consistently.

### How We Use It

```bash
pnpm format  # Format all files
```

Formats: TypeScript, JavaScript, JSON, Markdown.

### Editor Integration

VS Code users: Install the Prettier extension and enable format-on-save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## ESLint

We use our own `@reasonabletech/config-eslint` package.

### How We Use It

Each package has an `eslint.config.mjs`:

```javascript
import { createTypeAwareConfig } from "@reasonabletech/config-eslint";

export default createTypeAwareConfig(import.meta.dirname);
```

### Why Type-Aware?

Our ESLint config enables TypeScript-aware rules that catch bugs regular linting misses:

- Strict boolean expressions (no implicit truthy/falsy)
- No floating promises (must await or handle)
- Consistent type imports

See [@reasonabletech/config-eslint docs](../packages/config-eslint/docs/index.md) for details.

---

## Vitest

[Vitest](https://vitest.dev/) runs tests. We use `@reasonabletech/config-vitest`.

### How We Use It

Each package has a `vitest.config.mts`:

```typescript
import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname);
```

### Coverage Requirements

Default thresholds are 100% for lines, functions, branches, statements.

For local development, disable thresholds:

```bash
VITEST_COVERAGE_THRESHOLDS_DISABLED=true pnpm test:coverage
```

---

## tsup

[tsup](https://tsup.egoist.dev/) bundles packages. We use `@reasonabletech/config-tsup`.

### How We Use It

Each package has a `tsup.config.ts`:

```typescript
import { createTsupConfig } from "@reasonabletech/config-tsup";

export default createTsupConfig();
```

### Default Output

- Format: ESM only
- Target: ES2023
- Sourcemaps: Enabled
- Tree-shaking: Enabled
