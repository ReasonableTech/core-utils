# Development Workflow

This document describes the end-to-end process for making changes in this monorepo.

## The Process

### 1. Understand the Change

Before writing any code, determine:

- **What type of change is this?** A new feature (`feat`), a bug fix (`fix`), a refactor (`refactor`), or maintenance (`chore`)? This determines the commit type and whether a changeset is needed.
- **Which package does it belong to?** Every change should target a specific package. If the change spans multiple packages, treat each package's changes as a separate unit of work.
- **What already exists?** Read the affected code and the package's `AGENTS.md` if one exists. Check `@reasonabletech/utils` for utilities you might need — don't reimplement what's already there.

### 2. Plan the Approach

Design the implementation before writing code. For non-trivial changes:

- Brainstorm interactively with the developer to clarify requirements, trade-offs, and scope.
- Identify which files need to change and what the expected behavior should be.
- Keep the scope tight — one logical change, one package.

### 3. Write Tests First

Tests define the contract for the change. Write them before the implementation.

- Write tests that describe the expected behavior of the change.
- If the implementation doesn't exist yet, create stubs or interfaces so the tests compile. The tests should fail because the behavior isn't implemented, not because the code doesn't build.
- Follow the testing patterns established in the package. See [testing standards](./standards/testing-organization-standards.md) for conventions.

```bash
# Run tests for the package you're working on
pnpm --filter=@reasonabletech/<package> test
```

### 4. Implement

Build the implementation to satisfy the tests.

- Follow existing patterns in the package. Consistency matters more than novelty.
- Keep it minimal — implement what the tests require, nothing more.

### 5. Iterate Until Green

Run tests and quality checks. Fix failures. Repeat.

```bash
# Run tests for the touched package
pnpm --filter=@reasonabletech/<package> test

# Run full quality gates (lint + typecheck + test + build)
pnpm verify

# Or target a single package
pnpm --filter=@reasonabletech/<package> typecheck
```

All tests must pass and quality gates must succeed before committing.

### 6. Review

Get feedback from the developer before committing. Walk through the changes, confirm the approach is correct, and adjust if needed.

### 7. Commit

Commit the change scoped to the package. Each commit should read like a changelog entry — a single, distinct change that a package consumer would recognize.

```
feat(utils): add exponential backoff to retry helper
fix(eslint-config): handle edge case in error-handling rule selector
refactor(config-vitest): simplify coverage threshold merging
```

For staging safety and commit mechanics, see [git guidelines](./standards/git-guidelines.md).

## Changesets

If your change affects a published package, create a changeset:

```bash
pnpm changeset
```

**When to create one:**

- New features, bug fixes, breaking changes to a published package — yes
- Internal tooling, CI changes, dev-only updates — no

**Version bump guidance:**

| Change                             | Bump    |
| ---------------------------------- | ------- |
| Bug fix, documentation             | `patch` |
| New feature, non-breaking addition | `minor` |
| Breaking change                    | `major` |

**Important:** The config packages (`config-typescript`, `config-tsup`, `config-vitest`, `eslint-config`, `config-playwright`) are [linked](./tooling.md#changesets) — a major bump to one bumps all of them. `@reasonabletech/utils` versions independently.

Commit the generated `.changeset/` file with your change.

## After Push

Pushes to `main` trigger CI, which runs lint, typecheck, test, and build across all packages. If a changeset is present, the release workflow handles versioning and publishing automatically. See [CI/CD](./ci-cd.md) for details.
