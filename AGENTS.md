# Development Principles

> General guidelines for developing in this monorepo. For contribution process and PR requirements, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Monorepo Philosophy

This repo contains several small, focused packages under `packages/`. Each package owns exactly one concern — a shared config, a utility library, a plugin. They are published independently and consumed independently.

- **Packages are the unit of work.** Development, testing, versioning, and changelogs all happen at the package level. When making a change, know which package it belongs to.
- **Packages share tooling, not implementation.** Config packages (`config-typescript`, `config-vitest`, etc.) standardize how packages are built and tested. `@reasonabletech/utils` provides shared runtime utilities. Beyond that, packages should not reach into each other's internals.
- **Reuse before you create.** Before writing a new utility, check if `@reasonabletech/utils` already provides it. That package exists specifically to prevent duplication across the repo.
- **Keep packages small and self-contained.** If a change doesn't clearly belong to an existing package, that's a signal to think carefully about where it goes — not to scatter it across several.

## Development Approach

- **Read before you write.** Understand existing code, patterns, and conventions before modifying anything. Each package may have its own `AGENTS.md` with package-specific guidance.
- **Keep it minimal.** Only make changes that are directly necessary. Don't refactor surrounding code, add speculative features, or introduce abstractions for hypothetical future needs.
- **Follow existing patterns.** When adding to a package, match the conventions already established there. Consistency within a package matters more than personal preference.

## Development Workflow

Every change follows this process. For the full guide, see [development workflow](./docs/development-workflow.md).

1. **Understand** — Determine the change type (feature, fix, refactor, chore) and which package it targets.
2. **Plan** — Design the approach. Brainstorm with the developer to clarify requirements and scope.
3. **Write tests first** — Tests define the contract. Create stubs or interfaces if the implementation doesn't exist yet.
4. **Implement** — Build the implementation to satisfy the tests. Follow existing patterns.
5. **Iterate until green** — Run tests and quality gates. Fix failures. Repeat.
6. **Review** — Get feedback from the developer. Adjust as needed.
7. **Commit** — Scope the commit to the package. Each commit = one changelog entry.

## Commit Discipline

**Think of each commit as a changelog entry.** Every commit should be something a consumer of the package would recognize as a distinct, meaningful change.

- **Scope to a package.** Commits must use `type(scope): description` format where the scope is a package name (e.g., `feat(utils): ...`, `fix(eslint-config): ...`). This is how changes appear in the correct package's changelog. Valid scopes are defined in `commitlint.config.js`.
- **One logical change per commit.** A commit may touch many files, but all changes must serve a single cohesive purpose. If you can describe the commit with "and" joining two unrelated things, it should be two commits.
- **No overlapping commits.** Each commit's scope must be distinct. Don't spread one logical change across multiple commits, and don't bundle unrelated changes into one.
- **Cross-cutting changes are the exception.** Changes to CI, root configuration, or documentation that don't affect a published package may omit the scope: `chore: update dependencies`.

For staging safety, atomic workflow patterns, and git hook details, see [git guidelines](./docs/standards/git-guidelines.md).

## Detailed Standards

For coding standards, workflow details, and reference material, see:

- [Development Workflow](./docs/development-workflow.md) — end-to-end process, TDD, quality gates, changesets
- [Git Guidelines](./docs/standards/git-guidelines.md) — staging safety, atomic workflow, hooks
- [TypeScript Standards](./docs/standards/typescript-standards.md) — compiler options, strict defaults
- [TypeScript Design Patterns](./docs/standards/typescript-design-patterns.md) — type narrowing, generics, branded types
- [Error Handling](./docs/standards/error-handling.md) — Result types, error detection rules
- [Architecture Principles](./docs/standards/architecture-principles.md) — service patterns, dependency injection
- [Testing Standards](./docs/standards/testing-organization-standards.md) — coverage, test organization
- [ESLint Rule Antipatterns](./docs/standards/eslint-rule-antipatterns.md) — common rule mistakes

Package-specific guidelines live in `AGENTS.md` files within each package.
