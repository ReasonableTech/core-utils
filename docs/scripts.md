# Scripts

This document explains all npm scripts in the root `package.json`.

## Quick Reference

| Script | Purpose |
|--------|---------|
| `pnpm bootstrap` | First-time setup |
| `pnpm dev` | Development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm quality` | Run lint + typecheck + build |
| `pnpm format` | Format all files with Prettier |
| `pnpm clean` | Remove build artifacts |

---

## Setup Scripts

### `pnpm bootstrap`

**First-time repository setup.**

```bash
pnpm bootstrap
```

Runs `scripts/bootstrap/cold-start.mjs`:

1. Checks Node.js version (requires >= 22)
2. Checks pnpm version (requires 10.8.1)
3. Installs dependencies
4. Configures git hooks

Run this after cloning the repository.

### `pnpm bootstrap:doctor`

**Diagnose setup issues.**

```bash
pnpm bootstrap:doctor
```

Runs prerequisite checks without installing. Use when `bootstrap` fails.

### `pnpm setup` / `pnpm setup:verify`

- `setup` is an alias for `bootstrap`
- `setup:verify` runs full validation: typecheck, lint, build, test, then verify:release

---

## Development Scripts

### `pnpm dev`

**Start development mode.**

```bash
pnpm dev
```

Runs `turbo run dev` with watch mode enabled. Packages rebuild on file changes.

### `pnpm build`

**Build all packages.**

```bash
pnpm build
```

Runs `turbo run build`. Outputs go to each package's `dist/` directory.

### `pnpm clean`

**Remove build artifacts.**

```bash
pnpm clean
```

Runs `turbo run clean`. Removes `dist/`, `.turbo/`, `node_modules/`, etc.

---

## Quality Scripts

### `pnpm lint`

**Lint all packages.**

```bash
pnpm lint
```

Runs ESLint across the workspace. Automatically fixes fixable issues.

### `pnpm typecheck`

**Type-check all packages.**

```bash
pnpm typecheck
```

Runs `tsc --noEmit` in each package. Reports type errors without emitting files.

### `pnpm test`

**Run all tests.**

```bash
pnpm test
```

Runs Vitest in each package.

### `pnpm test:coverage`

**Run tests with coverage.**

```bash
pnpm test:coverage
```

Generates coverage reports in `generated/test-coverage/`.

### `pnpm quality`

**Run lint, typecheck, and build together.**

```bash
pnpm quality
```

Equivalent to:

```bash
pnpm turbo run lint typecheck build --continue
```

The `--continue` flag runs all tasks even if one fails, so you see all errors at once.

### `pnpm format`

**Format all files.**

```bash
pnpm format
```

Runs Prettier on TypeScript, JSON, and Markdown files.

---

## Validation Scripts

### `pnpm verify:release`

**Verify packages are ready for release.**

```bash
pnpm verify:release
```

Runs release verification for `config-typescript` and `config-tsup`:

- Checks package.json is valid
- Verifies exports are correct
- Tests consumer smoke tests

### `pnpm docs:validate`

**Validate documentation.**

```bash
pnpm docs:validate
```

Runs `scripts/docs/validate-usage-guides.mjs`:

- Checks each package has a usage guide
- Validates documentation structure

---

## Release Scripts

### `pnpm release`

**Publish packages to npm.**

```bash
pnpm release
```

Runs `scripts/bootstrap/publish-turnkey.mjs --publish`. This is typically run by CI, not locally.

### `pnpm prepare`

**Configure git hooks.**

```bash
# Runs automatically on pnpm install
pnpm prepare
```

Sets `core.hooksPath` to `.githooks/` so commitlint runs on commits.

---

## Package-Level Scripts

Each package has its own scripts. Common patterns:

| Script | Purpose |
|--------|---------|
| `build` | Build the package |
| `dev` | Watch mode |
| `test` | Run tests |
| `test:coverage` | Tests with coverage |
| `lint` | Lint the package |
| `typecheck` | Type-check |
| `clean` | Remove artifacts |

### Running Package Scripts

Use Turbo's filter:

```bash
# Test only utils
pnpm turbo run test --filter=@reasonabletech/utils

# Build only config packages
pnpm turbo run build --filter=@reasonabletech/config-*
```

Or run directly in the package:

```bash
cd packages/utils
pnpm test
```
