# @reasonabletech/config-tsup Examples

This directory contains practical examples of different tsup configurations for various package types in the monorepo.

## Available Examples

### Basic Configurations

- **[simple-library.ts](./simple-library.ts)** - Basic utility library configuration
- **[react-components.ts](./react-components.ts)** - React component library with JSX
- **[node-application.ts](./node-application.ts)** - Node.js CLI application
- **[browser-library.ts](./browser-library.ts)** - Browser-only library with IIFE

### Advanced Configurations

- **[multi-entry.ts](./multi-entry.ts)** - Multiple entry points and code splitting
- **[monorepo-package.ts](./monorepo-package.ts)** - Monorepo-aware configuration
- **[environment-specific.ts](./environment-specific.ts)** - Different dev/prod builds
- **[custom-plugins.ts](./custom-plugins.ts)** - Using esbuild plugins and hooks

## Usage

Each example can be copied directly to your package's `tsup.config.ts` file:

```bash
# Copy an example to your package
cp examples/simple-library.ts packages/your-package/tsup.config.ts

# Customize as needed for your specific requirements
```

## Testing Examples

You can test these configurations in a sample package:

```bash
# Create a test package
mkdir test-package
cd test-package

# Copy an example configuration
cp ../examples/simple-library.ts ./tsup.config.ts

# Create sample source files
mkdir src
echo 'export const hello = "world";' > src/index.ts

# Test the build
pnpm tsup
```

## Configuration Tips

1. **Start with presets**: Begin with `simpleConfig`, `reactConfig`, or `nodeConfig`
2. **Customize gradually**: Only override options you need to change
3. **Test thoroughly**: Verify builds work in your target environments
4. **Consider consumers**: Think about how others will use your package
5. **Optimize for use case**: Different configurations for libraries vs applications

## Common Patterns

### Library vs Application

**Libraries** should:

- Use multiple formats (ESM + CommonJS)
- Mark dependencies as external
- Generate TypeScript declarations
- Enable tree shaking

**Applications** should:

- Use single format appropriate for target
- Bundle most dependencies
- Skip TypeScript declarations
- Focus on bundle size optimization

### Development vs Production

**Development** builds should:

- Skip minification for faster builds
- Use inline source maps for debugging
- Disable declaration generation
- Enable watch mode

**Production** builds should:

- Enable minification and optimization
- Generate proper source maps
- Include TypeScript declarations
- Perform bundle analysis

See individual example files for detailed implementations of these patterns.
