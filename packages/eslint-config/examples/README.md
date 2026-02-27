# @reasonabletech/eslint-config Examples

Example ESLint configurations for different project types.

## Files

| Example                                    | Project Type                |
| ------------------------------------------ | --------------------------- |
| [basic-setup.mjs](./basic-setup.mjs)       | Standard TypeScript project |
| [react-library.mjs](./react-library.mjs)   | React component library     |
| [nextjs-project.mjs](./nextjs-project.mjs) | Next.js application         |

## Usage

Each example shows a complete `eslint.config.mjs` file. Copy the relevant example to your project root and adjust as needed.

### TypeScript Project

```typescript
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default createTypeAwareConfig(import.meta.dirname);
```

### React Project

```typescript
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

### Next.js Project

```typescript
import { createTypeAwareNextConfig } from "@reasonabletech/eslint-config/next";

export default createTypeAwareNextConfig(import.meta.dirname);
```

### Adding Custom Overrides

```typescript
import { createTypeAwareConfig } from "@reasonabletech/eslint-config";

export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

See the [Usage Guide](../docs/guides/usage-guide.md) for more configuration patterns.
