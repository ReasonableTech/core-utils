# React ESLint Configuration

The React configuration (`@reasonabletech/eslint-config/react`) provides comprehensive TypeScript and React rules specifically tailored for React projects in the monorepo.

## Features

- **Complete TypeScript integration**: All base TypeScript type-aware rules included
- **Modern React support**: React 18+ with new JSX transform compatibility
- **React Hooks validation**: Exhaustive dependency checking and Rules of Hooks
- **Browser environment**: Browser and service worker globals configured
- **Optimized rule sets**: React-specific TypeScript rule adjustments
- **Modular architecture**: Built from focused, reusable modules

## Installation

This package is installed as a workspace dependency:

```bash
pnpm add -D @reasonabletech/eslint-config
```

## Usage

Create an `eslint.config.mjs` file in your project root:

```javascript
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default createTypeAwareReactConfig(import.meta.dirname);
```

## Configuration Details

The React configuration automatically includes the complete TypeScript base configuration plus React-specific enhancements:

### Base TypeScript Features

- Full type-aware analysis with TypeScript's type checker
- Strict type safety rules optimized for AI-generated code
- JSDoc documentation requirements
- Performance-optimized type checking

### React-Specific Additions

#### Plugins & Rules

- **React Plugin**: Core React linting with `eslint-plugin-react`
- **React Hooks Plugin**: Rules of Hooks and exhaustive dependency validation
- **Modern JSX**: `react/react-in-jsx-scope` disabled for new JSX transform

#### Environment Configuration

- **Browser Globals**: Complete browser API support
- **Service Worker Globals**: PWA and service worker compatibility
- **React Settings**: Automatic React version detection

#### TypeScript Rule Adjustments

- `@typescript-eslint/prefer-readonly-parameter-types`: Disabled for component props
- `@typescript-eslint/require-await`: Disabled for event handlers
- `@typescript-eslint/unbound-method`: Disabled for React patterns
- **`@typescript-eslint/strict-boolean-expressions`: ENABLED** - Explicit boolean checks required even in React

#### JSDoc Rules

- Component files (`.tsx`, `.jsx`) exempt from `@returns` documentation
- TypeScript provides return type information automatically

## Conditional Rendering with Strict Boolean Expressions

The React configuration enforces explicit boolean checks in conditional rendering to prevent common bugs and maintain architectural consistency. This means **truthiness checks are not allowed** - you must be explicit about your conditions.

### ❌ Problematic Patterns (Will Cause Lint Errors)

```tsx
// These patterns can render unexpected values like 0, "", or "[object Object]"
{
  items && <ItemList items={items} />;
} // Could render empty array or 0
{
  count && <Counter value={count} />;
} // Will render 0 instead of nothing
{
  user?.name && <UserName name={user.name} />;
} // Could render empty string
{
  error && <ErrorMessage>{error}</ErrorMessage>;
} // Could render error object
```

### ✅ Correct Patterns (Explicit Boolean Checks)

```tsx
// Arrays - check length explicitly
{
  items.length > 0 && <ItemList items={items} />;
}

// Numbers - explicit comparison
{
  count > 0 && <Counter value={count} />;
}

// Strings - null check or length check
{
  user?.name != null && <UserName name={user.name} />;
}
{
  (user?.name?.length ?? 0) > 0 && <UserName name={user.name} />;
}

// Objects - explicit null/undefined checks
{
  error != null && <ErrorMessage>{error}</ErrorMessage>;
}
{
  selectedWorkspace != null && (
    <WorkspaceOverview workspace={selectedWorkspace} />
  );
}

// Boolean conversion when appropriate
{
  Boolean(user?.name) && <UserName name={user.name} />;
}

// Multiple conditions
{
  user != null && user.isActive && <ActiveUserBadge />;
}
```

### Advanced Patterns

#### Guard Components

For complex conditions, use guard components:

```tsx
function ConditionalRenderer({
  condition,
  children,
}: {
  condition: boolean;
  children: React.ReactNode;
}) {
  return condition ? <>{children}</> : null;
}

// Usage
<ConditionalRenderer condition={items.length > 0}>
  <ItemList items={items} />
</ConditionalRenderer>;
```

#### Custom Hooks for State Logic

```tsx
function useVisibilityState(items: unknown[]) {
  return {
    shouldShowList: items.length > 0,
    shouldShowEmptyState: items.length === 0,
  };
}

// Usage in component
const { shouldShowList, shouldShowEmptyState } = useVisibilityState(items);
return (
  <>
    {shouldShowList && <ItemList items={items} />}
    {shouldShowEmptyState && <EmptyState />}
  </>
);
```

#### Ternary Operators for Either/Or Cases

```tsx
{
  items.length > 0 ? <ItemList items={items} /> : <EmptyState />;
}
```

### Why This Approach?

1. **Prevents Rendering Bugs**: No more accidentally rendering `0`, `""`, or `[object Object]`
2. **Explicit Intent**: Code clearly shows what conditions trigger rendering
3. **Consistent Architecture**: Same strict patterns across TypeScript and React code
4. **Better Maintainability**: Conditions are clear and unambiguous
5. **AI Code Safety**: Strict checks prevent subtle bugs in generated code

## Example with Custom Rules

```javascript
// eslint.config.mjs
import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

export default [
  ...createTypeAwareReactConfig(import.meta.dirname),
  {
    // Component file patterns
    files: ["**/components/**/*.{tsx,jsx}"],
    rules: {
      // Enforce component naming conventions
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      // Stricter TypeScript rules for components
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    // Hook file patterns
    files: ["**/hooks/**/*.{ts,tsx}"],
    rules: {
      // Stricter hook dependency checking
      "react-hooks/exhaustive-deps": "error",
      // Require JSDoc for custom hooks
      "jsdoc/require-jsdoc": [
        "error",
        { require: { FunctionDeclaration: true } },
      ],
    },
  },
];
```

## Modular Architecture

The React configuration is built from focused modules:

### `src/react/plugins.ts`

- React and React Hooks plugin configurations
- Browser globals and environment setup
- Plugin composition utilities

### `src/react/rules.ts`

- React-specific rules using shared React patterns
- Integration with shared React rules from `src/shared/react-rules.ts`
- Framework-specific rule extensions

### `src/react/config.ts`

- Complete configuration builder
- Combines plugins, rules, and file-specific overrides
- Orchestrates all React-specific configurations

### Shared Components

- `src/shared/react-rules.ts`: Common rules shared with Next.js config
- `src/index.ts`: Base TypeScript configuration automatically included

## Best Practices

- Use the React configuration for any project that uses React
- Consider using more specific configurations (Next.js) for framework-specific projects
- Customize rules for specific file patterns to enforce different standards for components, hooks, etc.
- Keep components and hooks in separate files to apply more targeted linting rules

## Related Documentation

- [Next.js Configuration](./next-config.md) — Next.js specific configuration
- [API Reference](../api-reference.md) — Complete function documentation
- [Usage Guide](../../guides/usage-guide.md) — Setup instructions and troubleshooting
- [Refactoring React for Type Safety](../../tutorials/refactoring-react-for-type-safety.md) — Fixing strict-boolean-expressions in React components
- [AI Code Safety](../../concepts/ai-code-safety.md) — Why strict linting matters
