/**
 * React Component Library Configuration Example
 *
 * This example demonstrates the configuration for React component libraries
 * and UI packages that need JSX transformation and React-specific optimizations.
 *
 * Use this configuration for:
 * - React component libraries
 * - UI design systems
 * - React hooks packages
 * - Packages with JSX/TSX files
 */

import { createTsupConfig } from "../src/index.js";

// Basic React configuration using the preset
export default createTsupConfig({
  // React-specific entry points
  entry: {
    index: "src/index.ts",
    components: "src/components/index.ts",
    hooks: "src/hooks/index.ts",
  },

  // Formats appropriate for React libraries
  format: ["esm", "cjs"],

  // React and React DOM should be external (peer dependencies)
  external: ["react", "react-dom", "@types/react", "@types/react-dom"],

  // JSX configuration for automatic runtime
  esbuildOptions(options) {
    return {
      ...options,
      jsx: "automatic" as const,
      jsxDev: process.env.NODE_ENV === "development",
    };
  },
});

// Alternative: Using the React preset directly
// import { reactConfig } from "@reasonabletech/config-tsup";
// export default reactConfig;

// Advanced React configuration with custom features
export const advancedReactConfig = createTsupConfig({
  entry: {
    // Main component exports
    index: "src/index.ts",

    // Separate component groups
    buttons: "src/components/buttons/index.ts",
    forms: "src/components/forms/index.ts",
    layouts: "src/components/layouts/index.ts",

    // Utilities and hooks
    hooks: "src/hooks/index.ts",
    utils: "src/utils/index.ts",

    // Theming
    theme: "src/theme/index.ts",
  },

  format: ["esm", "cjs"],

  // External dependencies for React ecosystem
  external: [
    "react",
    "react-dom",
    "@emotion/react",
    "@emotion/styled",
    "@mui/material",
    "@mui/icons-material",
    "styled-components",
  ],

  // Enable code splitting for better tree shaking
  splitting: true,

  // React-specific esbuild configuration
  esbuildOptions(options) {
    return {
      ...options,
      // Modern JSX transform
      jsx: "automatic" as const,
      // Development vs production JSX
      jsxDev: process.env.NODE_ENV === "development",
      // Support for CSS imports (if using CSS-in-JS)
      loader: {
        ...options.loader,
        ".css": "css",
      },
    };
  },

  // Define React environment variables
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
  },
});

// React component library with style support
export const reactWithStylesConfig = createTsupConfig({
  entry: {
    index: "src/index.ts",
    styles: "src/styles/index.css",
  },

  format: ["esm", "cjs"],

  external: ["react", "react-dom"],

  esbuildOptions(options) {
    return {
      ...options,
      // JSX configuration
      jsx: "automatic" as const,
      // CSS handling
      loader: {
        ...options.loader,
        ".css": "css",
        ".scss": "css",
        ".sass": "css",
      },
    };
  },

  // Post-process CSS if needed
  onSuccess: async () => {
    console.log("✅ React components built with styles");
  },
});

// Storybook-compatible configuration
export const storybookCompatibleConfig = createTsupConfig({
  entry: {
    index: "src/index.ts",
  },

  format: ["esm", "cjs"],

  external: [
    "react",
    "react-dom",
    "@storybook/react",
    "@storybook/addon-essentials",
  ],

  // Preserve story files in development
  esbuildOptions(options) {
    const baseConfig = {
      ...options,
      jsx: "automatic" as const,
    };

    // Don't bundle story files in development
    if (process.env.NODE_ENV === "development") {
      return {
        ...baseConfig,
        external: [...(options.external || []), "*.stories.*"],
      };
    }

    return baseConfig;
  },
});

/*
 * Package.json configuration for React libraries:
 *
 * {
 *   "type": "module",
 *   "main": "./dist/index.cjs",
 *   "module": "./dist/index.js",
 *   "types": "./dist/index.d.ts",
 *   "exports": {
 *     ".": {
 *       "import": "./dist/index.js",
 *       "require": "./dist/index.cjs",
 *       "types": "./dist/index.d.ts"
 *     },
 *     "./components": {
 *       "import": "./dist/components.js",
 *       "require": "./dist/components.cjs",
 *       "types": "./dist/components.d.ts"
 *     },
 *     "./hooks": {
 *       "import": "./dist/hooks.js",
 *       "require": "./dist/hooks.cjs",
 *       "types": "./dist/hooks.d.ts"
 *     },
 *     "./theme": {
 *       "import": "./dist/theme.js",
 *       "require": "./dist/theme.cjs",
 *       "types": "./dist/theme.d.ts"
 *     }
 *   },
 *   "peerDependencies": {
 *     "react": ">=18.0.0",
 *     "react-dom": ">=18.0.0"
 *   },
 *   "files": ["dist"],
 *   "sideEffects": false,
 *   "scripts": {
 *     "build": "tsup",
 *     "dev": "tsup --watch",
 *     "storybook": "storybook dev -p 6006"
 *   }
 * }
 */
