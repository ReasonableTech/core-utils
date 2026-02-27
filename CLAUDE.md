# Development Principles

> General guidelines for developing in this monorepo. For contribution process and PR requirements, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Code Principles

- **Read before you write.** Understand existing code and patterns before modifying anything.
- **Reuse before you create.** `@reasonabletech/utils` provides Result types, datetime helpers, object utilities, retry logic, string helpers, and type guards. Import from there instead of reimplementing.
- **Type safety is non-negotiable.** Strict TypeScript is enforced. No `any` types, no `as any` casts, no `@ts-ignore`.
- **Never parse error messages.** Use error codes (`error.code`), error classes (`instanceof`), or `Result<T, E>` types for expected failures. See [error handling standards](./docs/standards/error-handling.md).
- **Document every export.** All public functions, types, and interfaces require JSDoc with `@param`, `@returns`, and `@example` tags.
- **Keep it minimal.** Only make changes that are directly necessary. Don't refactor surrounding code, add speculative features, or introduce abstractions for one-time operations.

## Commit Discipline

**Think of each commit as a changelog entry.** Every commit should be something a consumer of the package would recognize as a distinct, meaningful change.

- **Scope to a package.** Commits must use `type(scope): description` format where the scope is a package name (e.g., `feat(utils): ...`, `fix(eslint-config): ...`). This is how changes appear in the correct package's changelog. Valid scopes are defined in `commitlint.config.js`.
- **One logical change per commit.** A commit may touch many files, but all changes must serve a single cohesive purpose. If you can describe the commit with "and" joining two unrelated things, it should be two commits.
- **No overlapping commits.** Each commit's scope must be distinct. Don't spread one logical change across multiple commits, and don't bundle unrelated changes into one.
- **Cross-cutting changes are the exception.** Changes to CI, root configuration, or documentation that don't affect a published package may omit the scope: `chore: update dependencies`.

For staging safety, atomic workflow patterns, and git hook details, see [git guidelines](./docs/standards/git-guidelines.md).

## Quality Gates

Before committing, run quality checks for the packages you touched:

```bash
pnpm quality          # lint + typecheck + build (all packages)
pnpm test             # run all tests
```

For targeted checks on a single package:

```bash
pnpm --filter=@reasonabletech/<package> test
pnpm --filter=@reasonabletech/<package> typecheck
```

## Detailed Standards

This file covers principles. For detailed reference, see:

- [Git Guidelines](./docs/standards/git-guidelines.md) — staging safety, atomic workflow, hooks, forbidden practices
- [TypeScript Standards](./docs/standards/typescript-standards.md) — compiler options, strict defaults
- [TypeScript Design Patterns](./docs/standards/typescript-design-patterns.md) — type narrowing, generics, branded types
- [Error Handling](./docs/standards/error-handling.md) — Result types, error detection rules
- [Architecture Principles](./docs/standards/architecture-principles.md) — service patterns, dependency injection
- [Testing Standards](./docs/standards/testing-organization-standards.md) — coverage, test organization
- [ESLint Rule Antipatterns](./docs/standards/eslint-rule-antipatterns.md) — common rule mistakes

Package-specific guidelines live in `CLAUDE.md` or `AGENTS.md` files within each package.
