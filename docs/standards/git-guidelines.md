# Git Commit Guidelines

**CRITICAL: Follow these guidelines to prevent repository damage.**

This document is **workflow-focused**. For commit message composition and structure, see:

- **[CONTRIBUTING.md](../../CONTRIBUTING.md)** — commit format and contribution guidelines
- **[commitlint.config.js](../../commitlint.config.js)** — valid scopes enforced by commitlint

## Staging Safety Rules

- **NEVER use `git add -A` or `git add .` unless 100% certain of what you're staging**
- **PREFER specific file paths**: `git add path/to/specific/file.ts`
- **ALWAYS run `git status` before committing** to review staged files
- **Use `git add -p` for interactive staging** of partial file changes

## Recommended Atomic Workflow Pattern

**For multi-agent safety and clean commits, use this atomic pattern:**

```bash
git restore --staged . && git add file1.ts file2.ts && git commit -m "type(scope): title

Detailed message explaining the changes and their impact.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

**Why this pattern:**

- **Multi-agent safety**: Prevents Agent A's files from being included in Agent B's commit
- **Atomic operation**: All steps succeed or fail together using `&&`
- **Clean slate**: `git restore --staged .` clears any stale staging from other processes
- **Explicit staging**: No surprises from lingering staged files
- **Single command**: Pre-commit hooks run once on the exact files you specified
- **Race condition prevention**: Prevents interleaving from concurrent agents

## Workflow Checklist

1. **Clear staging**: `git restore --staged .`
2. **Stage exact files**: `git add path/to/file.ts` (or `git add -p`)
3. **Review staging**: `git status`
4. **Commit using the atomic pattern** (hooks run automatically)
5. **Verify commit**: `git log -1` and `git show --stat`

## Workflow Rules and Exceptions

- **Trust the tooling** — pre-commit and commit-msg hooks are authoritative
- **Fix, don't bypass** — resolve hook failures instead of skipping
- **No proactive repo-wide validation** — the pre-commit hook handles lint and typecheck for affected packages automatically. Avoid running `pnpm typecheck`/`pnpm lint` manually unless:
  - You changed tooling/configuration that affects the whole repo (ESLint config, tsconfig, etc.)
- **Local builds are OK** — run `pnpm build` for the packages you touched if useful
- **Single atomic commit** — don't split commits because hooks failed; fix the failures
- **Re-run the full atomic command** after fixes (unstage → stage → commit)

## Commit Message Standards

Commit messages are permanent documentation. Follow the conventional commits format:

- **Format**: `type(scope): description`
- **Valid types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, `revert`
- **Valid scopes**: Defined in `commitlint.config.js` (`scope-enum` rule)
- **Breaking changes**: Use `!` suffix: `feat(auth)!: breaking change`
- **No scope**: Cross-cutting changes can omit scope: `chore: update dependencies`

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full format details.

## Git Hooks Overview

### Pre-commit Hook

**Source of truth**: `.githooks/pre-commit`

Runs automatically on every commit. The hook performs three steps in order:

1. **eslint-config rebuild** — If staged files include `packages/eslint-config/src/**`, the config package is rebuilt before other checks run. This ensures other packages lint against the latest config.
2. **lint-staged** — Runs ESLint (`--fix`) and Prettier (`--write`) on staged files only. Fixed files are automatically re-staged. If unfixable errors remain, the commit is blocked.
3. **Typecheck** — Detects which packages have staged files and runs `pnpm --filter=<pkg> typecheck` for each affected package. Skipped if no package files are staged (e.g., root-only changes).

The lint-staged configuration is defined in the root `package.json`:

- `*.{ts,tsx,mjs}` — ESLint with autofix
- `*.{ts,tsx,md,json,mjs}` — Prettier with autofix

### Commit-msg Hook

**Source of truth**: `.githooks/commit-msg`

Validates commit messages using commitlint with `@commitlint/config-conventional`:

- **Validates scope**: Ensures commit scope matches entries defined in `commitlint.config.js`
- **Conventional commits**: Enforces type, scope, and message format
- **Allows no scope**: Cross-cutting changes can omit scope entirely
- **Error guidance**: Provides actionable error messages with fix instructions

**Examples:**

```bash
# ✅ Valid - scope in commitlint.config.js scope-enum
feat(utils): add retry helper with exponential backoff

# ✅ Valid - no scope for cross-cutting change
chore: update all dependencies

# ✅ Valid - breaking change with valid scope
feat(eslint-config)!: rename preset function

# ❌ Invalid - scope not in commitlint.config.js
feat(wrong-scope): something
# Error: scope must be one of [config-typescript, config-tsup, ...]
```

**Bypass** (not recommended):

```bash
git commit --no-verify -m "feat(wrong): bypass validation"
```

See `commitlint.config.js` for the complete list of valid scopes.

## If Hooks Fail

1. Read the error output carefully
2. Fix **all** reported issues in the failing files
3. Re-stage the fixes
4. Re-run the **same atomic command**

**Pre-commit failures**: lint-staged auto-fixes what it can (ESLint, Prettier) and re-stages the results. If the commit still fails, the remaining errors require manual fixes. Typecheck failures always require manual fixes.

**Do not** use `git restore`/`git reset` to drop failing files after hooks fail. Those commands are acceptable for staging cleanup **before** the commit, but not as a bypass.

## Absolutely Forbidden Practices

**🚨 THESE ACTIONS ARE FIREABLE OFFENSES:**

- `git add -A` / `git add .` / `git add *` — stages everything indiscriminately
- `git reset --hard` — destroys work permanently
- `git push --force` — destroys commit history
- `git commit -a` — commits without proper review
- **`git commit --no-verify`** — bypasses critical quality enforcement
- **Dropping failing files after hooks fail** instead of fixing the issues
- **Commit titles mentioning phases**

## Damage Prevention

❌ **NEVER EVER EVER EVER EVER USE `git reset --hard` UNDER ANY CIRCUMSTANCES**

- This command PERMANENTLY DESTROYS all uncommitted work
- There is NO legitimate reason to use this command
- If the user asks for it, explain the dangers and offer safer alternatives
- **ALWAYS use `git reset --soft` or `git reset --mixed` instead**

Safe alternatives:

- **Keep changes staged**: `git reset --soft HEAD~1`
- **Unstage everything**: `git reset HEAD` or `git reset --mixed HEAD`
- **Discard specific file changes**: `git restore --source=HEAD -- path/to/file`
- **Create backup branch first**: `git branch backup-branch`
- **Never force push** without explicit permission

## Safe Staging Examples

```bash
# ✅ Good - specific files
git add packages/eslint-config/index.ts packages/utils/src/result.ts

# ✅ Good - interactive staging
git add -p src/components/Button.tsx

# ❌ Bad - stages everything
git add -A
git add .
```

## Related

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — contribution and commit guidelines
- [docs/tooling.md](../tooling.md) — tooling setup
