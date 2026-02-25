/**
 * Multi-Entry Configuration Example
 *
 * This example demonstrates how to configure packages with multiple entry points,
 * code splitting, and advanced bundling strategies.
 *
 * Use this configuration for:
 * - Large libraries with multiple modules
 * - Packages with optional features
 * - Platform-specific implementations
 * - Packages with separate API surfaces
 */

import { createTsupConfig } from "../src/index.js";

// Basic multi-entry configuration
export default createTsupConfig({
  entry: {
    // Main entry point
    index: "src/index.ts",

    // Feature modules
    auth: "src/auth/index.ts",
    storage: "src/storage/index.ts",
    utils: "src/utils/index.ts",

    // Platform-specific entries
    node: "src/platforms/node.ts",
    browser: "src/platforms/browser.ts",

    // Optional features
    plugins: "src/plugins/index.ts",
    experimental: "src/experimental/index.ts",
  },

  format: ["esm", "cjs"],

  // Enable code splitting to share common code
  splitting: true,

  // External dependencies
  external: ["react", "lodash"],

  // Tree shaking for better optimization
  treeshake: true,
});

// Advanced multi-entry with conditional building
export const conditionalEntryConfig = createTsupConfig({
  entry: (() => {
    const baseEntries = {
      index: "src/index.ts",
      core: "src/core/index.ts",
    };

    // Add optional entries based on environment
    const optionalEntries: Record<string, string> = {};

    // Include experimental features in development
    if (process.env.NODE_ENV === "development") {
      optionalEntries.experimental = "src/experimental/index.ts";
      optionalEntries.debug = "src/debug/index.ts";
    }

    // Include platform-specific builds based on target
    if (process.env.TARGET_PLATFORM === "browser") {
      optionalEntries.browser = "src/platforms/browser.ts";
    } else if (process.env.TARGET_PLATFORM === "node") {
      optionalEntries.node = "src/platforms/node.ts";
    } else {
      // Include both for universal builds
      optionalEntries.browser = "src/platforms/browser.ts";
      optionalEntries.node = "src/platforms/node.ts";
    }

    return { ...baseEntries, ...optionalEntries };
  })(),

  format: ["esm", "cjs"],
  splitting: true,

  // Platform-specific externals
  external:
    process.env.TARGET_PLATFORM === "browser"
      ? ["react", "react-dom"]
      : ["fs", "path", "crypto"],
});

// Micro-frontend architecture
export const microfrontendConfig = createTsupConfig({
  entry: {
    // Shell application
    shell: "src/shell/index.ts",

    // Individual micro-frontends
    "mf-dashboard": "src/microfrontends/dashboard/index.ts",
    "mf-settings": "src/microfrontends/settings/index.ts",
    "mf-profile": "src/microfrontends/profile/index.ts",

    // Shared modules
    shared: "src/shared/index.ts",
    "shared-components": "src/shared/components/index.ts",
    "shared-utils": "src/shared/utils/index.ts",
  },

  format: ["esm"], // ESM for better module federation
  splitting: true,

  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "@shared/components", // Shared between micro-frontends
  ],

  esbuildOptions(options) {
    return {
      ...options,
      // Configure for module federation
      jsx: "automatic" as const,
      format: "esm",
      // No global for ESM - don't set globalName
    };
  },

  define: {
    "process.env.MICRO_FRONTEND_MODE": JSON.stringify("true"),
  },
});

// Plugin-based architecture
export const pluginArchitectureConfig = createTsupConfig({
  entry: {
    // Core system
    core: "src/core/index.ts",

    // Plugin system
    "plugin-system": "src/plugins/system.ts",

    // Individual plugins
    "plugins/auth": "src/plugins/auth/index.ts",
    "plugins/storage": "src/plugins/storage/index.ts",
    "plugins/ui": "src/plugins/ui/index.ts",
    "plugins/analytics": "src/plugins/analytics/index.ts",

    // Plugin utilities
    "plugin-utils": "src/plugins/utils/index.ts",
  },

  format: ["esm", "cjs"],
  splitting: true,

  external: [
    // Core should be external to plugins
    "@my-app/core",
  ],

  esbuildOptions(options) {
    return {
      ...options,
      // Allow dynamic imports for plugin loading
      platform: "neutral",
      // Don't bundle plugin dependencies
      external: [...(options.external || []), "./plugins/*"],
    };
  },

  // Custom plugin resolution
  onSuccess: async () => {
    console.log("✅ Core and plugins built successfully");
    console.log("📦 Plugin manifest generation...");
    // Generate plugin manifest here
  },
});

// Library with optional peer dependencies
export const optionalPeersConfig = createTsupConfig({
  entry: {
    // Core functionality (no optional deps)
    index: "src/index.ts",

    // React integration (requires React)
    react: "src/integrations/react/index.ts",

    // Vue integration (requires Vue)
    vue: "src/integrations/vue/index.ts",

    // Node.js specific features
    node: "src/integrations/node/index.ts",

    // Testing utilities
    testing: "src/testing/index.ts",
  },

  format: ["esm", "cjs"],
  splitting: true,

  // Different externals for different entries
  external: [
    // Always external
    "lodash",

    // Conditionally external based on entry
    "react", // Only for react entry
    "vue", // Only for vue entry
    "fs", // Only for node entry
    "vitest", // Only for testing entry
  ],

  esbuildOptions(options) {
    return {
      ...options,
      // Default configuration for all entries
      format: "esm",
      // External dependencies are handled via the external config above
    };
  },
});

// Performance-optimized multi-entry
export const performanceOptimizedConfig = createTsupConfig({
  entry: {
    // Separate small and large modules
    core: "src/core/index.ts", // Small, essential
    features: "src/features/index.ts", // Medium, commonly used
    extended: "src/extended/index.ts", // Large, rarely used
  },

  format: ["esm"], // ESM only for better tree shaking
  splitting: true,
  treeshake: true,

  // Aggressive external marking for smaller bundles
  external: ["react", "lodash", "moment", "axios", "@mui/material"],

  // Minify for production

  // Bundle analysis would be configured via esbuildOptions if needed

  onSuccess: async () => {
    if (process.env.NODE_ENV === "production") {
      console.log("📊 Bundle analysis saved to dist/metafile.json");
      console.log("💡 Use esbuild-visualizer to analyze bundle size");
    }
  },
});

/*
 * Package.json for multi-entry packages:
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
 *     "./auth": {
 *       "import": "./dist/auth.js",
 *       "require": "./dist/auth.cjs",
 *       "types": "./dist/auth.d.ts"
 *     },
 *     "./storage": {
 *       "import": "./dist/storage.js",
 *       "require": "./dist/storage.cjs",
 *       "types": "./dist/storage.d.ts"
 *     },
 *     "./utils": {
 *       "import": "./dist/utils.js",
 *       "require": "./dist/utils.cjs",
 *       "types": "./dist/utils.d.ts"
 *     },
 *     "./node": {
 *       "import": "./dist/node.js",
 *       "require": "./dist/node.cjs",
 *       "types": "./dist/node.d.ts"
 *     },
 *     "./browser": {
 *       "import": "./dist/browser.js",
 *       "require": "./dist/browser.cjs",
 *       "types": "./dist/browser.d.ts"
 *     },
 *     "./plugins": {
 *       "import": "./dist/plugins.js",
 *       "require": "./dist/plugins.cjs",
 *       "types": "./dist/plugins.d.ts"
 *     }
 *   },
 *   "typesVersions": {
 *     "*": {
 *       "auth": ["./dist/auth.d.ts"],
 *       "storage": ["./dist/storage.d.ts"],
 *       "utils": ["./dist/utils.d.ts"],
 *       "node": ["./dist/node.d.ts"],
 *       "browser": ["./dist/browser.d.ts"],
 *       "plugins": ["./dist/plugins.d.ts"]
 *     }
 *   },
 *   "files": ["dist"],
 *   "sideEffects": false,
 *   "scripts": {
 *     "build": "tsup",
 *     "build:analyze": "tsup --metafile && esbuild-visualizer --metadata dist/metafile.json",
 *     "dev": "tsup --watch"
 *   }
 * }
 *
 * Usage examples:
 *
 * // Import main entry
 * import { mainFunction } from "@my-package";
 *
 * // Import specific modules
 * import { authenticate } from "@my-package/auth";
 * import { store, retrieve } from "@my-package/storage";
 * import { helpers } from "@my-package/utils";
 *
 * // Platform-specific imports
 * import { nodeSpecific } from "@my-package/node";
 * import { browserSpecific } from "@my-package/browser";
 *
 * // Plugin system
 * import { loadPlugin } from "@my-package/plugins";
 */
