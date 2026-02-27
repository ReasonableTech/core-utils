# Framework Configurations

Framework-specific ESLint configurations with specialized rules and patterns.

## Overview

This section provides detailed documentation for framework-specific ESLint configurations, including React, Next.js, and other popular development frameworks supported by `@reasonabletech/eslint-config`.

## Available Frameworks

### React

- **[React Configuration](./react-config.md)** - ESLint rules for React component development with hooks support

### Next.js

- **[Next.js Configuration](./next-config.md)** - Full-stack React applications with server actions and app router

## Framework Selection Guide

### Choose React Configuration When

- Building React libraries or component packages
- Creating client-side React applications
- Working with React Native projects
- Developing Storybook components

### Choose Next.js Configuration When

- Building Next.js applications with app router
- Using Next.js server actions and server components
- Implementing Next.js API routes
- Deploying full-stack React applications

## Configuration Features

Each framework configuration includes:

- **Base type-aware rules** from the core configuration
- **Framework-specific plugins** and their recommended rules
- **Custom rule overrides** for framework patterns
- **Specialized globals** for the framework environment
- **Performance optimizations** for the specific build tool

## Usage Patterns

All framework configurations follow the same usage pattern:

```typescript
// Framework-specific import
import { createTypeAware[Framework]Config } from "@reasonabletech/eslint-config/[framework]";

// Project directory configuration
export default createTypeAware[Framework]Config(import.meta.dirname);
```

## Related Documentation

- [API Reference](../api-reference.md) - Complete function documentation
- [Usage Guide](../../guides/usage-guide.md) - Setup instructions and examples
- [Architecture](../../concepts/architecture.md) - Framework integration design decisions
