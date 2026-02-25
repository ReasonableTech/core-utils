# CI/CD

This document describes the GitHub Actions workflows for core-utils.

## Workflows

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| CI | `ci.yml` | Push, PR | Validate changes |
| Release | `release.yml` | Push to main | Publish packages |

---

## CI Workflow

**File:** `.github/workflows/ci.yml`

### Triggers

- Push to any branch
- Pull request to `main`

### Jobs

1. **Lint** — Run ESLint across workspace
2. **Typecheck** — Run TypeScript checks
3. **Test** — Run Vitest tests
4. **Build** — Build all packages

All jobs must pass for PRs to merge.

### Debugging CI Failures

**Lint failures:**

```bash
# Reproduce locally
pnpm lint

# See specific errors
pnpm turbo run lint --filter=@reasonabletech/config-eslint
```

**Type errors:**

```bash
# Reproduce locally
pnpm typecheck
```

**Test failures:**

```bash
# Run specific package tests
pnpm turbo run test --filter=@reasonabletech/utils

# Run with verbose output
cd packages/utils && pnpm test -- --reporter=verbose
```

**Build failures:**

```bash
# Clean and rebuild
pnpm clean && pnpm build
```

---

## Release Workflow

**File:** `.github/workflows/release.yml`

### Triggers

- Push to `main` branch only

### Publish Gates

The release job blocks publishing unless all gates pass:

1. `pnpm turbo lint`
2. `pnpm turbo typecheck`
3. `pnpm turbo test`
4. `pnpm turbo build`
5. `pnpm verify:release`

### Process

On push to `main`:

1. **Generate changeset** — If no manual changeset exists, generates one from Conventional Commit messages
2. **Version packages** — Runs `pnpm version-packages` to bump versions
3. **Commit versions** — Commits updated package.json files
4. **Publish** — Runs `pnpm release` to publish to npm

### Provenance

Packages are published with npm provenance, proving they were built by GitHub Actions:

```json
{
  "permissions": {
    "id-token": "write"
  }
}
```

Consumers can verify package origin on npmjs.com.

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm automation token with publish rights for `@reasonabletech/*` |

### Setting Up NPM_TOKEN

1. Generate token at npmjs.com → Access Tokens → Generate New Token
2. Select "Automation" token type
3. Add to repository: Settings → Secrets → Actions → New repository secret

---

## Local Validation

Before pushing, run the same checks CI runs:

```bash
# Full CI simulation
pnpm quality && pnpm test

# Or step by step
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

### Pre-release Validation

```bash
# Verify release gates pass
pnpm setup:verify
```

This runs everything CI checks plus release verification.
