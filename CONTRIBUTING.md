# Contributing to @reasonabletech/core-utils

> **Note:** This repository is primarily maintained for internal use at ReasonableTech. We publish these packages publicly because they may be useful to others, but we are not actively seeking external contributions.

## Before You Contribute

**Please understand:**

- We may not accept your contribution, even if it's well-written and useful
- These packages reflect our internal opinions and workflows—we're not trying to be everything to everyone
- Feature requests that don't align with our use cases will likely be closed
- Bug fixes and documentation improvements have a better chance of being merged

If you still want to contribute, read on. We appreciate the effort, and this guide will help you submit something we can actually review.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this standard.

## Getting Started

See the [README](./README.md) for prerequisites, installation, and available commands.

## Making Changes

### Branch Strategy

1. Create a feature branch from `main`: `git checkout -b feat/your-feature-name`
2. Make your changes with atomic commits.
3. Push and open a pull request against `main`.

### Code Style and Testing

- Follow existing patterns; run `pnpm quality` before submitting.
- See [docs/standards/](./docs/standards/) for TypeScript, error handling, and testing standards.

## Creating Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. See [docs/tooling.md](./docs/tooling.md#changesets) for full details.

Create a changeset when your changes affect a published package:

- ✅ New features, bug fixes, breaking changes
- ✅ Documentation changes that ship with a package
- ❌ Internal tooling, CI changes, or dev-only updates

```bash
pnpm changeset
```

Commit the generated `.changeset/` file with your PR.

## Commit Conventions

Commits are enforced via [commitlint](https://commitlint.js.org/) using [Conventional Commits](https://www.conventionalcommits.org/). Invalid commits are rejected at the hook level — the hook is configured automatically when you run `pnpm install`.

See **[docs/standards/git-guidelines.md](./docs/standards/git-guidelines.md)** for the full format, allowed types, valid scopes, and examples.

## Pull Request Process

### Before Submitting

1. **Open an issue first** for anything beyond a trivial fix. We'd rather discuss before you invest time.
2. Run `pnpm quality` and ensure tests pass.
3. Add a changeset if needed (see [Creating Changesets](#creating-changesets)).
4. Write clear commit messages following [Commit Conventions](#commit-conventions).

### PR Requirements

- **Title**: Follow Conventional Commits format (e.g., `feat(eslint-config): add React rules`).
- **Description**: Explain what the PR does and why *we* would want it.
- **Tests**: Include tests for new functionality.
- **Changeset**: Include if the change affects published packages.

### Review Expectations

- PRs may sit for a while. We review when we have time.
- We may ask for significant changes or decline the PR entirely.
- Don't take it personally—these packages serve our specific needs first.

---

## Further Reading

- [Tooling](./docs/tooling.md) — Turbo, Changesets, Commitlint, Prettier
- [Scripts](./docs/scripts.md) — All npm scripts explained
- [Architecture](./docs/architecture.md) — Monorepo structure
- [Git Guidelines](./docs/standards/git-guidelines.md) — Commit format, scopes, staging safety
- [Error Handling](./docs/standards/error-handling.md) — Result types, error detection rules
- [TypeScript Standards](./docs/standards/typescript-standards.md) — Type safety requirements
- [Testing Standards](./docs/standards/testing-organization-standards.md) — Coverage and test organization

---

Questions? Open an issue. We'll get to it when we can.
