# Base ESLint Configuration

The base configuration (`@reasonabletech/config-eslint`) provides fundamental linting rules suitable for all TypeScript projects in the monorepo.

## Features

- ESLint recommended rules for code quality
- Prettier integration to avoid conflicts with code formatting
- TypeScript-ESLint recommended rules for type safety
- Turbo rules for monorepo health
- Error handling best practices
- Consistent type annotations

## Installation

This package is installed as a workspace dependency:

```bash
pnpm add -D @reasonabletech/config-eslint
```

## Usage

Create an `eslint.config.js` file in your project root:

```javascript
// eslint.config.js
import { config } from "@reasonabletech/config-eslint";

export default config;
```

## Configuration Details

The base configuration includes:

### Core Rules

- ESLint recommended rules from `@eslint/js`
- Prettier compatibility via `eslint-config-prettier`
- TypeScript-ESLint recommended rules

### Plugins

- `turbo` - Enforces monorepo best practices

### Key Rules

- `turbo/no-undeclared-env-vars`: Errors when using undeclared environment variables
- `no-throw-literal`: Enforces throwing Error objects instead of literals
- `prefer-promise-reject-errors`: Ensures consistent error handling in Promises
- `no-new-native-nonconstructor`: Prevents using the global Error constructor directly
- `@typescript-eslint/explicit-function-return-type`: Enforces return types on functions

### Ignored Patterns

- `dist/**` - Ignores build output
- `scripts/**` - Ignores script files
- `**/scripts/**` - Ignores nested script directories

## Philosophy: Warnings as Errors

### Design Decision

All ESLint warnings are treated as errors in the the codebase. This design choice reflects our commitment to code quality and developer experience.

### Rationale

- **Fail Fast**: Issues are caught immediately rather than accumulating
- **CI/CD Reliability**: Builds fail on any code quality issues, preventing problematic code from reaching production
- **Developer Discipline**: Encourages addressing issues immediately rather than deferring them
- **Consistent Standards**: No distinction between "minor" and "major" issues - all violations block progress
- **Agentic Code Quality**: Forces AI coding tools to write higher quality code by preventing warning tolerance

### Implementation

- Removed `eslint-plugin-only-warn` that converted errors to warnings
- Updated rule configurations from `"warn"` to `"error"` severity
- All ESLint violations now cause build failures in CI/CD

### Benefits

1. **Improved Code Quality**: No ignored warnings that could lead to bugs
2. **Cleaner Codebase**: Zero tolerance for code quality violations
3. **Better Developer Habits**: Immediate feedback loop encourages best practices
4. **Predictable Builds**: CI failures are deterministic and actionable
5. **Enhanced AI Development**: Agentic coding tools are compelled to generate cleaner, more maintainable code

## Example

```javascript
// eslint.config.js
import { config as baseConfig } from "@reasonabletech/config-eslint";

export default [
  ...baseConfig,
  {
    // Project-specific rules
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // File-specific rules
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

## Related Documentation

- [API Reference](./api-reference.md) — Complete function documentation
- [Framework Configurations](./frameworks/) — React and Next.js specific configurations
- [Usage Guide](../guides/usage-guide.md) — Setup instructions and troubleshooting
- [Architecture](../concepts/architecture.md) — Design principles and decisions
