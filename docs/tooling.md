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
      "dependsOn": ["@reasonabletech/eslint-config#build"]
    }
  }
}
```

Key points:

- `^build` means "build upstream dependencies first"
- `lint` waits for `eslint-config` to build (we use our own ESLint config)
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
    ["@reasonabletech/eslint-config", "@reasonabletech/config-typescript", ...]
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

### Writing Changeset Content

Changeset bodies appear directly in the published CHANGELOG and GitHub Release notes. The release pipeline produces a two-part entry for each package: your human-written prose on top, and an auto-generated `### Commits` section appended underneath listing every scoped commit subject. See [releasing.md](./internal/releasing.md#manual-changelogs-recommended-for-significant-releases) for the full release pipeline context.

The `@changesets/changelog-github` generator renders the body as follows:

- The **first line** becomes a top-level bullet item, prefixed with auto-generated PR/commit/author links
- All **subsequent lines** are indented under that bullet
- The auto-generated `### Commits` section is appended by the release pipeline — you don't write it

This means the first line is what consumers see when scanning the changelog. Write it as a clear, standalone summary sentence.

#### Template

```markdown
---
"@reasonabletech/package-name": minor
---

One-sentence summary of what changed and why.

#### Breaking changes

- What broke and what to do about it.

#### New features

- What's new and how to use it.

#### Bug fixes

- What was wrong and what's fixed now.
```

Only include sections that apply. A patch with one bug fix needs just the summary line and a sentence or two of detail — not three empty headers.

#### Rules

1. **First line is the summary.** It should make sense on its own — this is the text that appears next to the PR link in the changelog. Don't start with a heading or bullet.
2. **Use `####` (h4) for section headers.** The changelog generator places content under an auto-generated `###` heading (`### Minor Changes`), so h4 nests correctly.
3. **Lead with breaking changes.** If there are breaking changes, they come first with explicit migration steps. Consumers need to know what to do before they upgrade.
4. **Write for the consumer.** Internal implementation details (utility function refactors, test reorganization) don't belong here. Describe what changed from the user's perspective.
5. **Include migration steps.** Don't just say "removed X" — say what to use instead.
6. **Don't list commits.** The release pipeline appends a `### Commits` section automatically. Your job is the narrative, not the log.

#### When to create a changeset

- ✅ New features, bug fixes, breaking changes to published packages
- ✅ Documentation changes that ship with a package
- ❌ Internal tooling, CI changes, or dev-only updates

For auto-generated changelogs (no manual changeset), the pipeline creates one from commit subjects. **Write a manual changeset for any release involving new public API, breaking changes, or functionality worth explaining.** See [releasing.md](./internal/releasing.md) for details.

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
    "scope-enum": [
      2,
      "always",
      [
        "config-typescript",
        "config-tsup",
        "config-vitest",
        "eslint-config",
        "config-playwright",
        "utils",
        "repo",
      ],
    ],
  },
};
```

### Allowed Scopes

| Scope               | Use For                   |
| ------------------- | ------------------------- |
| `config-typescript` | TypeScript preset changes |
| `config-tsup`       | tsup config changes       |
| `config-vitest`     | Vitest config changes     |
| `eslint-config`     | ESLint config changes     |
| `config-playwright` | Playwright config changes |
| `utils`             | Runtime utilities changes |
| `repo`              | Monorepo-wide changes     |

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

We use our own `@reasonabletech/eslint-config` package.

### How We Use It

Each package has an `eslint.config.mjs`:

```javascript
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

### Why Type-Aware?

Our ESLint config enables TypeScript-aware rules that catch bugs regular linting misses:

- Strict boolean expressions (no implicit truthy/falsy)
- No floating promises (must await or handle)
- Consistent type imports

See [@reasonabletech/eslint-config docs](../packages/eslint-config/docs/index.md) for details.

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
