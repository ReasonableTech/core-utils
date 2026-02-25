# Releasing core-utils

`core-utils` publishes from `main` through [`.github/workflows/release.yml`](./.github/workflows/release.yml).

## Required Secrets

- `NPM_TOKEN`: NPM automation token with publish rights for `@reasonabletech/*`

## CI Publish Gates

The release job blocks publishing unless all gates pass:

1. `pnpm turbo lint`
2. `pnpm turbo typecheck`
3. `pnpm turbo test`
4. `pnpm turbo build`
5. `pnpm verify:release`

`pnpm verify:release` currently runs:

1. `pnpm turbo run verify:release --filter=@reasonabletech/config-typescript --filter=@reasonabletech/config-tsup`

## Versioning and Publishing

On push to `main`, the workflow:

1. Generates an auto changeset from package-scoped Conventional Commits (unless a manual changeset already exists).
2. Runs `pnpm version-packages`.
3. Commits version updates.
4. Runs `pnpm release` to publish to NPM.

## Provenance

The workflow enables NPM provenance with:

- `permissions.id-token: write`
- `NPM_CONFIG_PROVENANCE=true`

## Local Preflight and Manual Publish

- `pnpm release:preflight` validates environment and release gates.
- `pnpm release:turnkey` performs guarded local publishing.

## Rollback

If a bad publish slips through:

1. Deprecate affected versions on NPM.
2. Land a fix on `main`.
3. Publish a patch release.
