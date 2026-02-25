# New Package Checklist

Use this checklist when adding a new package to the core-utils monorepo.

## Package Structure

- [ ] Create package directory: `packages/package-name/`
- [ ] Create `package.json` with required fields:
  - [ ] `name`: `@reasonabletech/package-name`
  - [ ] `version`: `0.1.0`
  - [ ] `description`: One-line description
  - [ ] `keywords`: Array including "reasonabletech", "config", etc.
  - [ ] `type`: `"module"`
  - [ ] `exports`: Proper subpath exports
  - [ ] `files`: `["dist", "docs/**/*"]`
  - [ ] `publishConfig`: `{ "access": "public" }`
  - [ ] `repository`, `bugs`, `homepage` fields
  - [ ] `engines`: `{ "node": ">=22" }`
  - [ ] `license`: `"MIT"`
  - [ ] `author`: `"Reasonable Tech Company"`
- [ ] Create `tsconfig.json` extending base config
- [ ] Create `eslint.config.mjs`
- [ ] Create `vitest.config.mts` (if package has runtime code)
- [ ] Create `tsup.config.ts` (if package has runtime code)

## Source Files

- [ ] Create `src/index.ts` (main entry point)
- [ ] Add JSDoc to all exported functions/types
- [ ] Include `@param`, `@returns`, `@example` annotations

## Documentation

- [ ] Create `README.md` (use template)
  - [ ] Badges (npm, license, TypeScript)
  - [ ] Installation instructions
  - [ ] Peer dependencies section
  - [ ] Usage examples
  - [ ] Changelog link
- [ ] Create `CHANGELOG.md` stub
- [ ] Create `docs/README.md` (docs index)
- [ ] Create `docs/guides/usage-guide.md`
- [ ] Create `docs/guides/migration.md` (template)
- [ ] Create `examples/` directory with README

## Tests

- [ ] Create `tests/` directory
- [ ] Add unit tests for all exports
- [ ] Ensure 100% coverage threshold

## Integration

- [ ] Add to `.changeset/config.json` linked packages (if config package)
- [ ] Add to root README.md package index
- [ ] Run `pnpm install` to link workspace
- [ ] Run `pnpm quality` to verify setup
