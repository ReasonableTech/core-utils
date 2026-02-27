# Architecture

This document outlines the architectural design and principles behind `@reasonabletech/eslint-config`, explaining the decisions made to create a maintainable, modular, and consistent ESLint configuration system for the monorepo.

## Design Principles

### 1. Type-Aware First

**Principle:** All configurations prioritize TypeScript type-aware rules as the primary approach.

**Rationale:** AI-generated code requires comprehensive static analysis to catch subtle runtime errors that syntax-only rules would miss. Type-aware rules leverage TypeScript's type system to detect:

- Unsafe type operations
- Floating promises
- Incorrect async/await usage
- Type assertion issues
- Boolean expression strictness

**Implementation:** The `createTypeAwareConfig()` function is the primary export for all greenfield TypeScript projects.

### 2. Modular Composition

**Principle:** All configurations are built from composable, shared modules to eliminate duplication.

**Rationale:** The original monolithic configuration contained 400+ lines with massive duplication across base, type-aware, React, and Next.js configurations. This led to:

- Maintenance overhead when updating rules
- Inconsistencies between configurations
- Difficulty understanding rule origins
- Code bloat

**Architecture:**

```
src/
├── index.ts                    # Base TypeScript configuration
├── react.ts                   # React configuration entry point
├── next.ts                    # Next.js configuration entry point
├── base-configs.ts            # Core TypeScript configuration logic
├── react/                     # React-specific modules
│   ├── config.ts              # React configuration builder
│   ├── plugins.ts             # React plugin setups
│   └── rules.ts               # React rule definitions
├── next/                      # Next.js-specific modules
│   ├── config.ts              # Next.js configuration builder
│   ├── ignores.ts             # File ignore patterns
│   ├── plugins.ts             # Plugin loading and fallbacks
│   ├── rules.ts               # Rule configurations
│   └── settings.ts            # Plugin settings
├── shared/                    # Shared utilities
│   └── react-rules.ts         # Common React rules for both React and Next.js
├── shared-ignores.ts          # Centralized ignore patterns
└── shared-rules.ts            # Shared TypeScript rule sets
```

### 3. Explicit Over Implicit

**Principle:** All rules and patterns are explicitly defined rather than relying on defaults.

**Rationale:** AI-generated code analysis requires predictable, explicit rule sets. Implicit defaults can lead to:

- Inconsistent behavior across projects
- Difficulty debugging rule conflicts
- Unclear rule inheritance chains

**Implementation:** Each rule is explicitly set with clear documentation of its purpose and behavior.

### 4. Framework-Specific Customization

**Principle:** Framework configurations extend the base rather than replacing it entirely.

**Rationale:** Frameworks like React and Next.js have specific patterns that conflict with strict TypeScript rules, but they should still maintain the core safety guarantees.

**Implementation:** Framework overrides are isolated in separate rule sets that can be composed with the base configuration.

## Package Structure

### Core Components

#### 1. Shared Ignore Patterns (`src/shared-ignores.ts`)

**Purpose:** Centralized file exclusion patterns for all project types.

**Categories:**

- Build outputs (`dist/`, `build/`, `.next/`)
- Dependencies (`node_modules/`, `.pnp.*`)
- Generated files (`*.d.ts`, `*.generated.*`)
- Development tooling (`scripts/`, config files)
- Test infrastructure and coverage
- IDE and OS-specific files

**Design Decision:** Single array with comprehensive patterns rather than categorized objects to maintain ESLint compatibility and simplicity.

#### 2. Modular Rule Organization

**Purpose:** Framework-specific rule modules that eliminate duplication.

**React Module (`src/react/`):**

- `rules.ts`: React-specific rule definitions using shared React rules
- `plugins.ts`: React and React Hooks plugin configurations
- `config.ts`: Complete React configuration builder

**Next.js Module (`src/next/`):**

- `rules.ts`: Next.js rule definitions with React rule inheritance
- `plugins.ts`: Plugin loading with graceful fallbacks
- `ignores.ts`: Next.js-specific file ignore patterns
- `settings.ts`: Plugin settings for React and Next.js
- `config.ts`: Complete Next.js configuration orchestrator

**Shared Module (`src/shared/`):**

- `react-rules.ts`: Common React rules shared between React and Next.js configs

**Design Decision:** Focused modules with single responsibilities rather than monolithic rule objects to improve maintainability and enable better code organization.

#### 3. Base Configuration Builders (`src/base-configs.ts`)

**Purpose:** Factory functions that compose shared components into complete configurations.

**Functions:**

- `createTypeAwareBaseConfig()`: Type-aware foundation

**Design Decision:** Factory functions rather than static objects to enable parameterization (project directory) and better TypeScript integration.

### Framework Configurations

#### React Configuration (`react.ts`)

**Extends:** Base configuration + React-specific rules

**Additions:**

- React Hooks plugin with recommended rules
- JSX transform compatibility (no React import required)
- Browser and service worker globals
- Relaxed parameter typing for component props

**Design Decision:** Separate file to enable selective imports and clear framework boundaries.

#### Next.js Configuration (`next.ts`)

**Extends:** Base configuration + React rules + Next.js-specific rules

**Additions:**

- Next.js Core Web Vitals rules via FlatCompat
- Server action support (allows async without explicit await)
- Service worker globals for PWA features

**Design Decision:** Uses FlatCompat for Next.js integration to maintain compatibility with Next.js's ESLint plugin ecosystem.

## Architectural Patterns

### 1. Composition Over Inheritance

The package uses functional composition rather than class inheritance:

```typescript
// ✅ Composition approach
const config = [
  ...createTypeAwareBaseConfig(projectDir),
  reactPlugin.configs.flat.recommended,
  { rules: reactRuleOverrides },
];

// ❌ Inheritance approach (avoided)
class ReactConfig extends BaseConfig {
  // Complex inheritance chain
}
```

**Benefits:**

- Clear data flow and dependencies
- Easy to understand rule sources
- No hidden inheritance behavior
- Better TypeScript inference

### 2. Configuration as Data

All configurations are plain JavaScript objects/arrays rather than classes:

```typescript
// ✅ Data-driven approach
export const baseRules: Linter.RulesRecord = {
  "no-throw-literal": "error",
  // ...
};

// ❌ Class-based approach (avoided)
class RuleManager {
  getRules() {
    /* complex logic */
  }
}
```

**Benefits:**

- Serializable and inspectable
- No runtime dependencies
- Easy to merge and extend
- Compatible with ESLint's flat config system

### 3. Explicit Dependencies

All imports are explicit and traceable:

```typescript
// ✅ Explicit imports
import { sharedIgnores } from "./shared-ignores.js";
import { baseRules, typeAwareRules } from "./shared-rules.js";

// ❌ Implicit dependencies (avoided)
import * as config from "./monolithic-config.js";
```

**Benefits:**

- Clear dependency relationships
- Better tree-shaking
- Easier refactoring
- Explicit API boundaries

## Rule Philosophy

### Error Handling Standards

**Principle:** Never parse error messages; always use structured error detection.

**Implementation:**

```typescript
"no-throw-literal": "error",
"prefer-promise-reject-errors": "error",
"@typescript-eslint/only-throw-error": "error",
```

**Rationale:** AI-generated code often includes error handling patterns. Parsing error messages leads to brittle code that breaks when error messages change.

### TypeScript Safety

**Principle:** Maximize type safety while maintaining practical development experience.

**Implementation:**

```typescript
"@typescript-eslint/no-explicit-any": "error",
"@typescript-eslint/no-non-null-assertion": "error",
"@typescript-eslint/strict-boolean-expressions": "error",
```

**Rationale:** AI-generated code can introduce subtle type safety issues. Strict rules catch these early in development.

### Framework Accommodations

**Principle:** Relax rules only where framework patterns make strict rules impractical.

**Example - React:**

```typescript
"@typescript-eslint/prefer-readonly-parameter-types": "off", // Component props
"@typescript-eslint/require-await": "off",                   // Event handlers
"@typescript-eslint/unbound-method": "off",                  // React patterns
```

**Important Change: Strict Boolean Expressions in React**

As of the latest architecture revision, **`@typescript-eslint/strict-boolean-expressions` is no longer disabled for React projects**. This maintains consistent architectural patterns across the platform and prevents subtle rendering bugs.

**Rationale:**

- **Consistency**: All TypeScript code follows the same strict patterns
- **Bug Prevention**: Prevents rendering of `0`, `""`, or `[object Object]` in React components
- **Better Architecture**: Encourages explicit conditional logic over implicit truthiness
- **AI Code Safety**: Maintains strict type checking even in React contexts

React components should use explicit boolean checks:

```tsx
// ❌ Previously allowed, now flagged as error
{
  items && <ItemList items={items} />;
}

// ✅ Required explicit pattern
{
  items.length > 0 && <ItemList items={items} />;
}
```

## Implementation Approach

The current architecture standardizes configuration through a modular design:

1. **Shared rule and ignore modules** provide a single source of truth.
2. **Factory functions** compose complete project-specific configurations.
3. **Framework adapters** apply React and Next.js behavior without duplicating the base.
4. **Documentation and examples** define the canonical setup for new packages and apps.

## Performance Considerations

### Configuration Size

**Goal:** Minimize configuration object size while maintaining comprehensive rule coverage.

**Implementation:**

- Shared ignore patterns reduce duplication
- Rule objects are composed rather than merged at runtime
- TypeScript inference eliminates need for runtime type checking

### Type Checking Performance

**Goal:** Balance comprehensive type checking with reasonable performance.

**Implementation:**

- Type-aware rules are opt-in via `createTypeAwareConfig()`
- Project directory parameterization for efficient TypeScript project loading
- Comprehensive ignore patterns reduce files processed

## Extensibility

### Adding New Framework Support

To add support for a new framework:

1. **Create framework-specific rules** in `src/shared-rules.ts`
2. **Create framework configuration file** (e.g., `svelte.ts`)
3. **Compose base configuration** with framework-specific additions
4. **Document usage patterns** in the usage guide

### Custom Rule Integration

Projects can extend configurations:

```typescript
export default [
  ...createTypeAwareConfig(import.meta.dirname),
  {
    rules: {
      // Project-specific overrides
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
```

## Quality Assurance

### Testing Strategy

**Configuration packages are exempt** from comprehensive testing per UIDE-126 standards because:

- They contain declarative configuration objects, not business logic
- Their "testing" happens naturally when consumed by other packages
- Configuration errors are caught during actual linting operations

### Validation Approach

**Runtime validation:**

- ESLint validates configuration structure when loaded
- TypeScript ensures configuration object types are correct
- Consumer packages validate rule effectiveness through linting

**Documentation validation:**

- All examples are tested in real projects
- API documentation matches actual exports

## Future Considerations

### Planned Enhancements

1. **Additional framework support** (Svelte, Astro, etc.)
2. **Rule set customization** for different project types
3. **Performance optimization** for large monorepos
4. **Integration improvements** with development tools

### Versioning Policy

Public exports and behavior follow semantic versioning. Breaking changes are introduced only in major releases with updated package documentation.

## Related Documentation

- [API Reference](../reference/api-reference.md) - Complete API documentation
- [Usage Guide](../guides/usage-guide.md) - Detailed usage instructions
- [Examples](../../examples/) - Configuration examples
