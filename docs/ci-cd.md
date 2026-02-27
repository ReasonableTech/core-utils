# CI/CD

This document describes the GitHub Actions workflows for core-utils.

## Workflows

| Workflow | File          | Triggers     | Purpose          |
| -------- | ------------- | ------------ | ---------------- |
| CI       | `ci.yml`      | Push, PR     | Validate changes |
| Release  | `release.yml` | Push to main | Publish packages |

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
pnpm turbo run lint --filter=@reasonabletech/eslint-config
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
4. **Pack release artifacts** — Creates package tarballs from release candidates
5. **Attest provenance** — Attaches GitHub build provenance attestations to tarballs
6. **Publish** — Publishes via npm trusted publishing (OIDC, no long-lived npm token)

### Provenance

The release workflow records provenance in two places:

1. npm provenance (`NPM_CONFIG_PROVENANCE=true`)
2. GitHub attestations (`actions/attest-build-provenance`)

The workflow includes the required permissions:

```json
{
  "permissions": {
    "id-token": "write",
    "attestations": "write"
  }
}
```

Consumers can verify package origin on npmjs.com.

---

## Required Repository Configuration

| Key           | Type                           | Purpose                          |
| ------------- | ------------------------------ | -------------------------------- |
| `TURBO_TOKEN` | Secret                         | Turbo remote cache token for CI  |
| `TURBO_TEAM`  | Variable (preferred) or Secret | Turbo team slug for remote cache |

## Trusted Publishing Setup (npm)

Trusted publishing must be configured per package, and only after that package already exists on npm.

1. For each brand-new package, do one initial token-based publish to create it on npm.
2. On npmjs.com, open that package and go to `Settings > Trusted Publisher`.
3. Select GitHub Actions and configure:
4. `Organization or user`: `ReasonableTech`
5. `Repository`: `core-utils`
6. `Workflow filename`: `release.yml`
7. `Environment`: leave blank unless GitHub Actions enforces one
8. Save and rerun release; publish uses OIDC from then on.

---

## Local Validation

Before pushing, run the same checks CI runs:

```bash
# Full CI simulation
pnpm verify

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
