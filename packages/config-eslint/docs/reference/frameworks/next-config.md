# Next.js ESLint Configuration

The Next.js configuration (`@reasonabletech/config-eslint/next`) provides comprehensive TypeScript, React, and Next.js rules specifically tailored for Next.js applications in the monorepo.

## Features

- **Complete TypeScript integration**: All base TypeScript type-aware rules included
- **Comprehensive React support**: Full React configuration with hooks validation
- **Next.js optimization**: Core web vitals and Next.js-specific performance rules
- **Graceful fallbacks**: Automatic React setup when Next.js plugins unavailable
- **Smart ignore patterns**: Optimized file exclusions for Next.js build outputs
- **Modular architecture**: Built from focused, reusable modules with shared React rules

## Installation

This package is installed as a workspace dependency:

```bash
pnpm add -D @reasonabletech/config-eslint
```

## Usage

Create an `eslint.config.mjs` file in your project root:

```javascript
// eslint.config.mjs
import { createTypeAwareNextConfig } from "@reasonabletech/config-eslint/next";

export default createTypeAwareNextConfig(import.meta.dirname);
```

## Configuration Details

The Next.js configuration automatically includes the complete TypeScript base configuration plus React-specific enhancements and Next.js-specific optimizations:

### Base TypeScript Features

- Full type-aware analysis with TypeScript's type checker
- **Strict boolean expressions enforced** - explicit checks required even in Next.js
- JSDoc documentation requirements
- Performance-optimized type checking

### React Integration

- Complete React plugin setup with hooks validation
- Modern JSX transform support (no React imports needed)
- Browser and service worker globals configured
- **TypeScript rule adjustments** for React patterns while maintaining strict safety

### Next.js-Specific Features

#### Core Web Vitals & Performance

- Next.js `core-web-vitals` rules via `@next/eslint-plugin-next`
- Performance optimization rules for images, scripts, and routing
- Server-side rendering and hydration safety checks

#### Smart File Ignores

- Build outputs: `.next/`, `out/`, `dist/`, `build/`
- Generated files: `next-env.d.ts`, `next.config.*`
- Development files: Storybook, test files, config files
- Next.js app directory patterns: `app/.well-known/**/*`

#### Graceful Plugin Loading

- **Primary**: Uses Next.js ESLint configs when available
- **Fallback**: Automatic React setup when Next.js plugins unavailable
- **Environment-aware**: Adapts to different development environments

### Important: Strict Boolean Expressions in Next.js

Like React configuration, Next.js enforces strict boolean expressions to prevent rendering bugs and maintain architectural consistency.

#### ❌ Problematic Next.js Patterns

```tsx
// These patterns violate strict-boolean-expressions
{
  params.id && <UserPage userId={params.id} />;
} // Could render "0"
{
  searchParams?.q && <SearchResults query={searchParams.q} />;
} // Could render empty string
{
  session.user && <UserMenu user={session.user} />;
} // Could render [object Object]
```

#### ✅ Correct Next.js Patterns

```tsx
// Explicit checks prevent rendering bugs
{
  params.id != null && <UserPage userId={params.id} />;
}
{
  (searchParams?.q?.length ?? 0) > 0 && (
    <SearchResults query={searchParams.q} />
  );
}
{
  session.user != null && <UserMenu user={session.user} />;
}

// Next.js-specific patterns
{
  Boolean(params.slug) && <DynamicPage slug={params.slug} />;
}
{
  searchParams != null && Object.keys(searchParams).length > 0 && (
    <FilteredView />
  );
}
```

## Example with Custom Rules

```javascript
// eslint.config.js
import { config as nextConfig } from "@reasonabletech/config-eslint/next";

export default [
  ...nextConfig,
  {
    // Page component rules
    files: ["**/pages/**/*.{tsx,jsx}"],
    rules: {
      // Enforce Next.js page conventions
      "@next/next/no-document-import-in-page": "error",
      "@next/next/no-head-import-in-document": "error",
    },
  },
  {
    // API route rules
    files: ["**/pages/api/**/*.{ts,js}"],
    rules: {
      // Enforce API route best practices
      "@next/next/no-html-link-for-pages": "error",
    },
  },
];
```

## Next.js App Directory Structure

When working with Next.js App Directory:

```javascript
// eslint.config.js
import { config as nextConfig } from "@reasonabletech/config-eslint/next";

export default [
  ...nextConfig,
  {
    // App directory client components
    files: ["**/app/**/page.{tsx,jsx}", "**/app/**/layout.{tsx,jsx}"],
    rules: {
      // Rules specific to page/layout components
      "@next/next/no-sync-scripts": "error",
    },
  },
  {
    // Route handlers
    files: ["**/app/api/**/route.{ts,js}"],
    rules: {
      // Rules specific to API routes
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
```

## Best Practices

- Use this configuration for all Next.js applications
- Configure different rules for pages vs. API routes
- For the App Directory, consider separate rules for server vs. client components
- Follow Next.js best practices for optimizing core web vitals

## Related Documentation

- [React Configuration](./react-config.md) — React specific configuration (Next.js builds on this)
- [API Reference](../api-reference.md) — Complete function documentation
- [Usage Guide](../../guides/usage-guide.md) — Setup instructions and troubleshooting
- [AI Code Safety](../../concepts/ai-code-safety.md) — Why strict linting matters
