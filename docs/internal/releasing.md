# Releasing core-utils

`core-utils` publishes automatically from `main` through [`.github/workflows/release.yml`](../../.github/workflows/release.yml). Every push to `main` that passes all quality gates will result in a new npm publish and GitHub Release for any packages with changes.

## How Releases Work

The full pipeline on every push to `main`:

```
lint → typecheck → test → build → verify:release
  → auto-changeset (or skip if manual exists)
  → version-packages
  → commit version bumps
  → publish to npm
  → create GitHub Releases
```

### Auto-generated changelogs

By default, the pipeline generates a changeset automatically from Conventional Commits scoped to each package. Each package's changelog entry lists only the commit subjects directly relevant to it. Packages bumped transitively (via the linked release group) get a note naming the packages that drove the bump.

For example, a push containing:

```
feat(config-typescript): add verbatimModuleSyntax option
fix(utils): handle null in retry backoff
```

...would produce separate changelog entries for `@reasonabletech/config-typescript` (minor) and `@reasonabletech/utils` (patch), each listing only their own commits.

### Manual changelogs (recommended for significant releases)

**For any release involving new public API, breaking changes, or functionality worth explaining to consumers, write a manual changeset instead.** Auto-generated entries are just commit subject lines — they don't provide context, examples, or migration guidance.

To write a manual changeset:

1. Create a file in `.changeset/` with any name, e.g. `.changeset/add-deep-merge.md`.
2. Write the frontmatter listing each affected package and its bump level:

   ```md
   ---
   "@reasonabletech/utils": minor
   "@reasonabletech/config-typescript": patch
   ---
   ```

3. Write the changelog body below the frontmatter. This text will appear verbatim in `CHANGELOG.md` and in the GitHub Release notes:

   ```md
   ---
   "@reasonabletech/utils": minor
   ---

   Add `deepMerge` utility for recursive object merging.

   Unlike `Object.assign`, `deepMerge` recurses into nested objects rather than
   overwriting them. Arrays are replaced, not concatenated.

   ```ts
   import { deepMerge } from "@reasonabletech/utils";

   deepMerge({ a: { x: 1 } }, { a: { y: 2 } });
   // → { a: { x: 1, y: 2 } }
   ```
   ```

4. Commit the `.changeset/*.md` file together with your code changes and push.

**The auto-changeset script will automatically append a `### Commits` section to your manual file** listing every commit subject scoped to that package. You get your prose up top and the full commit log underneath — no extra steps required.

> Use `pnpm changeset` as an interactive alternative to writing the file manually — it prompts for packages, bump level, and description.

## CI Publish Gates

The release job blocks publishing unless all of the following pass:

1. `pnpm turbo lint`
2. `pnpm turbo typecheck`
3. `pnpm turbo test`
4. `pnpm turbo build`
5. `pnpm verify:release`

`pnpm verify:release` currently validates output for `@reasonabletech/config-typescript` and `@reasonabletech/config-tsup`.

## Versioning

All packages except `@reasonabletech/utils` are in a **linked release group** — they always share the same version number. If any one of them is bumped, all are bumped to the highest level among them.

`@reasonabletech/utils` is versioned independently.

## Required Secrets

- `NPM_TOKEN`: NPM automation token with publish rights for `@reasonabletech/*`. Set via `pnpm bootstrap`.

## Provenance

The workflow publishes with npm provenance enabled:

- `permissions.id-token: write`
- `NPM_CONFIG_PROVENANCE=true`

This links each published package to the exact commit and workflow run that produced it.

## Local Preflight and Manual Publish

- `pnpm release:preflight` — validates environment and release gates without publishing.
- `pnpm release:turnkey` — guarded local publish (runs gates, then publishes).

## Rollback

If a bad publish slips through:

1. Deprecate affected versions on npm (`npm deprecate @reasonabletech/pkg@x.y.z "reason"`).
2. Land a fix on `main`.
3. The next push publishes a patch release automatically.
