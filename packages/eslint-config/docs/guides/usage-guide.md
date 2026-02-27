# Usage Guide

## Quick Start

### 1. Installation

```bash
pnpm add -D @reasonabletech/eslint-config
```

### 2. Basic Setup

Create an `eslint.config.mjs` file in your project root:

```typescript
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

### 3. Add Scripts

Update your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "lint:check": "eslint ."
  }
}
```

### 4. Verify Setup

```bash
pnpm lint
```

## Framework-Specific Configurations

### React Projects

```typescript
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

Adds React Hooks rules, JSX transform support, browser globals, and relaxed parameter typing for component props.

### Next.js Applications

```typescript
// eslint.config.mjs
import { createTypeAwareNextConfig } from "@reasonabletech/eslint-config/next";

export default createTypeAwareNextConfig(import.meta.dirname);
```

Adds Next.js Core Web Vitals rules, server action support (async without explicit `await`), and Next.js-specific ignores.

## Custom Rule Overrides

Spread the config and add overrides after it:

```typescript
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "error",
    },
  },
];
```

### File-Specific Overrides

```typescript
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default [
  ...createTypeAwareReactConfig(import.meta.dirname),
  {
    files: ["**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
```

## Monorepo Usage

### Package-Specific Configurations

Each package can have its own `eslint.config.mjs`:

```typescript
// packages/my-package/eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

### Workspace Root Configuration

```typescript
// eslint.config.mjs (root)
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

## Ignored Files & Patterns

The configuration automatically ignores files that would cause TypeScript project conflicts or are not worth linting.

### Automatically Ignored Categories

- **Build outputs** — `dist/`, `build/`, `.next/`, `out/`, `coverage/`
- **Dependencies** — `node_modules/`
- **Generated files** — `*.d.ts`, `*.generated.*`, `generated/`
- **Config files** — `*.config.*`, `tsconfig*.json`, `package*.json` (prevents "file not in tsconfig" errors)
- **IDE/cache** — `.vscode/`, `.idea/`, `.turbo/`, `.cache/`
- **Lock files** — `pnpm-lock.yaml`, `yarn.lock`
- **Examples** — `examples/`

### Adding Custom Ignores

```typescript
// eslint.config.mjs
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    ignores: ["archived-code/**", "*.special.js"],
  },
];
```

## Integration with Development Tools

### VS Code

Create `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Pre-commit Hooks

Using lint-staged:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix"]
  }
}
```

### CI/CD

```yaml
- run: pnpm lint:check
- run: pnpm typecheck
```

## Troubleshooting

### "Parsing error: Cannot read file 'tsconfig.json'"

Your `tsconfig.json` must be in the project directory passed to the config function:

```bash
npx tsc --showConfig
```

### "Rule requires type checking to be enabled"

Make sure you're using a `createTypeAware*` function, not manually constructing config:

```typescript
// Correct
export default createTypeAwareConfig(import.meta.dirname);
```

### "Cannot resolve module" errors

Verify the package is installed:

```bash
pnpm list @reasonabletech/eslint-config
```

### Performance on Large Projects

Type-aware linting is slower than syntax-only linting. For large projects:

```bash
# Use ESLint cache
pnpm eslint . --cache

# Increase memory if needed
NODE_OPTIONS="--max-old-space-size=4096" pnpm lint
```

### Debugging Configuration

```bash
# See which rules are active for a file
npx eslint --print-config src/index.ts

# Check if a specific file is ignored
npx eslint path/to/file.ts --debug
```

## Related Documentation

- [API Reference](../reference/api-reference.md) — All exported functions and plugin rules
- [Architecture](../concepts/architecture.md) — Design decisions and internal structure
