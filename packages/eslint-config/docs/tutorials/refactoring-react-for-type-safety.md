# Refactoring React Code for Type Safety

A comprehensive guide to updating React components to work with strict TypeScript ESLint rules, focusing on the `@typescript-eslint/strict-boolean-expressions` rule.

## Overview

This tutorial walks you through refactoring common React patterns that violate strict boolean expression rules. These patterns can cause subtle rendering bugs and inconsistent behavior.

## The Problem

With `@typescript-eslint/strict-boolean-expressions` enabled, React code that uses "truthiness" checks will produce lint errors. These patterns are problematic because they can render unexpected values like `0`, empty strings, or `[object Object]` instead of nothing.

## Common Problematic Patterns

### 1. Object Truthiness Checks

**❌ Problematic Pattern:**

```tsx
{
  result.symbolIndex && <SymbolSummary result={result} />;
}

{
  streamingMessage && <StreamingMessage message={streamingMessage} />;
}
```

**✅ Fixed Pattern:**

```tsx
// Explicit null/undefined checks
{
  result.symbolIndex != null && <SymbolSummary result={result} />;
}
{
  streamingMessage != null && <StreamingMessage message={streamingMessage} />;
}
```

### 2. Error Object Rendering

**❌ Problematic Pattern:**

```tsx
{
  error && <ErrorMessage>{error}</ErrorMessage>;
}

{
  status.error && <Text color="red"> - {status.error}</Text>;
}
```

**✅ Fixed Pattern:**

```tsx
// Explicit error checks
{
  error != null && <ErrorMessage>{error}</ErrorMessage>;
}
{
  status.error != null && <Text color="red"> - {status.error}</Text>;
}

// Even better - handle error types properly
{
  error instanceof Error && <ErrorMessage>{error.message}</ErrorMessage>;
}
```

### 3. Boolean State Checks

**❌ Problematic Pattern:**

```tsx
{
  isDevelopmentBypass && <DevelopmentBanner />;
}

{
  isRetrying && <Spinner />;
}
```

**✅ Fixed Pattern:**

```tsx
// These are actually already correct! Boolean checks are allowed
{
  isDevelopmentBypass && <DevelopmentBanner />;
}
{
  isRetrying && <Spinner />;
}

// But for clarity, you can be explicit
{
  isDevelopmentBypass === true && <DevelopmentBanner />;
}
{
  isRetrying === true && <Spinner />;
}
```

### 4. String and Number Checks

**❌ Problematic Pattern:**

```tsx
// Common patterns that would fail
{
  count && <Counter value={count} />;
} // Could render 0
{
  user?.name && <UserName name={user.name} />;
} // Could render empty string
{
  items && <ItemList items={items} />;
} // Could render empty array
```

**✅ Fixed Pattern:**

```tsx
// Numbers - explicit comparison
{
  count > 0 && <Counter value={count} />;
}
{
  (count ?? 0) > 0 && <Counter value={count} />;
}

// Strings - explicit checks
{
  user?.name != null && user.name.length > 0 && <UserName name={user.name} />;
}
{
  Boolean(user?.name) && <UserName name={user.name} />;
}

// Arrays - check length
{
  items.length > 0 && <ItemList items={items} />;
}
{
  Array.isArray(items) && items.length > 0 && <ItemList items={items} />;
}
```

## Step-by-Step Refactoring Process

### Step 1: Identify Problematic Patterns

Run ESLint to find violations:

```bash
# In your project directory
pnpm lint

# Look for errors like:
# "Unexpected value in conditional. A boolean expression is required."
```

### Step 2: Categorize the Issues

Group violations by type:

- **Object checks**: `someObject && <Component />`
- **Array checks**: `someArray && <Component />`
- **Number checks**: `count && <Component />`
- **String checks**: `text && <Component />`
- **Error objects**: `error && <ErrorDisplay />`

### Step 3: Apply Appropriate Fixes

#### For Object/Value Existence Checks:

```tsx
// Before
{
  user && <UserProfile user={user} />;
}

// After
{
  user != null && <UserProfile user={user} />;
}
```

#### For Array Checks:

```tsx
// Before
{
  items && <ItemList items={items} />;
}

// After
{
  items.length > 0 && <ItemList items={items} />;
}
```

#### For Numeric Checks:

```tsx
// Before
{
  count && <Counter count={count} />;
}

// After - depends on intent
{
  count > 0 && <Counter count={count} />;
} // Only positive numbers
{
  count != null && <Counter count={count} />;
} // Any number including 0
{
  count !== 0 && <Counter count={count} />;
} // Any number except 0
```

#### For String Checks:

```tsx
// Before
{
  message && <Alert>{message}</Alert>;
}

// After - depends on intent
{
  message != null && message.length > 0 && <Alert>{message}</Alert>;
}
{
  Boolean(message) && <Alert>{message}</Alert>;
}
{
  message != null && <Alert>{message}</Alert>;
} // Allow empty strings
```

### Step 4: Handle Complex Conditions

For complex conditions, break them down or use helper functions:

```tsx
// Complex condition
{
  user && user.permissions && user.permissions.length > 0 && user.isActive && (
    <AdminPanel user={user} />
  );
}

// Better approach - use helper
const canShowAdminPanel = (user: User | null): boolean => {
  return (
    user != null &&
    user.permissions != null &&
    user.permissions.length > 0 &&
    user.isActive === true
  );
};

// In component
{
  canShowAdminPanel(user) && <AdminPanel user={user} />;
}
```

## Advanced Refactoring Techniques

### Custom Hooks for State Logic

Instead of complex conditions in JSX, use custom hooks:

```tsx
function useComponentVisibility(
  items: unknown[],
  error: Error | null,
  loading: boolean,
) {
  return {
    shouldShowItems: items.length > 0 && !loading,
    shouldShowError: error != null,
    shouldShowLoading: loading === true,
    shouldShowEmpty: items.length === 0 && !loading && error == null,
  };
}

// In component
const { shouldShowItems, shouldShowError, shouldShowLoading, shouldShowEmpty } =
  useComponentVisibility(items, error, loading);

return (
  <>
    {shouldShowItems && <ItemList items={items} />}
    {shouldShowError && <ErrorDisplay error={error} />}
    {shouldShowLoading && <LoadingSpinner />}
    {shouldShowEmpty && <EmptyState />}
  </>
);
```

### Guard Components

For reusable conditional logic:

```tsx
interface ConditionalProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function Conditional({
  condition,
  children,
  fallback = null,
}: ConditionalProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

// Usage
<Conditional condition={items.length > 0} fallback={<EmptyState />}>
  <ItemList items={items} />
</Conditional>;
```

### Type Guards for Better Safety

Create type guards for complex object checks:

```tsx
function hasSymbolIndex(
  result: AnalysisResult,
): result is AnalysisResult & { symbolIndex: SymbolIndex } {
  return result.symbolIndex != null;
}

// In component
{
  hasSymbolIndex(result) && <SymbolSummary result={result} />;
}
```

## Testing Refactored Components

After refactoring, ensure your components still work as expected:

```tsx
describe("RefactoredComponent", () => {
  it("renders content when conditions are met", () => {
    render(<MyComponent items={["item1"]} error={null} loading={false} />);
    expect(screen.getByTestId("item-list")).toBeInTheDocument();
  });

  it("renders empty state when no items", () => {
    render(<MyComponent items={[]} error={null} loading={false} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders error when present", () => {
    const error = new Error("Test error");
    render(<MyComponent items={[]} error={error} loading={false} />);
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
  });

  it("does not render anything when count is 0", () => {
    render(<Counter count={0} />);
    expect(screen.queryByTestId("counter-display")).not.toBeInTheDocument();
  });
});
```

## Implementation Checklist

- [ ] Run `pnpm lint` to identify all strict-boolean-expressions violations
- [ ] Group violations by pattern type (object, array, number, string, error)
- [ ] For each violation:
  - [ ] Determine the intended behavior (show on truthy vs. show on non-null vs. show on non-empty)
  - [ ] Apply appropriate explicit boolean check
  - [ ] Test the component behavior with edge cases (0, "", null, undefined, empty arrays)
- [ ] Consider extracting complex conditions to helper functions or custom hooks
- [ ] Update tests to verify correct behavior with edge cases
- [ ] Run tests to ensure no regressions
- [ ] Run `pnpm lint` again to verify all violations are fixed

## Benefits of This Approach

1. **Prevents Rendering Bugs**: No more accidentally rendering `0`, `""`, or `[object Object]`
2. **Explicit Intent**: Code clearly shows what conditions trigger rendering
3. **Consistent Architecture**: Same strict patterns across TypeScript and React code
4. **Better Maintainability**: Conditions are unambiguous and easy to understand
5. **Type Safety**: Explicit checks work better with TypeScript's type system
6. **AI Code Safety**: Strict checks prevent subtle bugs in generated code

## Additional Resources

- [TypeScript ESLint strict-boolean-expressions rule](https://typescript-eslint.io/rules/strict-boolean-expressions/)
- [React Conditional Rendering Documentation](https://react.dev/learn/conditional-rendering)
- [Error Handling Standards](../../../../../docs/standards/error-handling.md)
- [TypeScript Standards](../../../../../docs/standards/typescript-standards.md)

## Related Documentation

- [React Configuration](../reference/frameworks/react-config.md) — React ESLint configuration details
- [AI Code Safety](../concepts/ai-code-safety.md) — Why strict linting matters for AI-generated code
- [Usage Guide](../guides/usage-guide.md) — Setup instructions and troubleshooting
