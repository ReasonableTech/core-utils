/**
 * Node.js Application Configuration Example
 *
 * This example demonstrates the configuration for Node.js applications,
 * CLI tools, and server-side packages.
 *
 * Use this configuration for:
 * - CLI applications
 * - Server applications
 * - Node.js utilities
 * - Build tools and scripts
 */

import { createTsupConfig } from "../src/index.js";

// Basic Node.js application configuration
export default createTsupConfig({
  // Entry point for CLI application
  entry: { cli: "src/cli.ts" },

  // Node.js applications typically use CommonJS
  format: ["cjs"],

  // Target Node.js platform
  platform: "node",

  // Modern Node.js version
  target: "node22",

  // Node.js shims would be configured via esbuildOptions if needed

  // External Node.js built-ins and common CLI dependencies
  external: [
    // Node.js built-ins
    "fs",
    "path",
    "crypto",
    "child_process",
    "os",
    "util",

    // Common CLI dependencies
    "commander",
    "inquirer",
    "chalk",
    "ora",
    "boxen",
  ],

  // Don't split code for CLI applications
  splitting: false,
});

// Alternative: Using the Node preset directly
// import { nodeConfig } from "@reasonabletech/config-tsup";
// export default nodeConfig;

// Advanced CLI application with multiple commands
export const advancedCliConfig = createTsupConfig({
  entry: {
    // Main CLI entry
    cli: "src/cli.ts",

    // Individual command modules
    "commands/build": "src/commands/build.ts",
    "commands/dev": "src/commands/dev.ts",
    "commands/deploy": "src/commands/deploy.ts",

    // Shared utilities
    utils: "src/utils/index.ts",
  },

  format: ["cjs"],
  platform: "node",
  target: "node22",

  external: [
    "commander",
    "inquirer",
    "chalk",
    "ora",
    "fs-extra",
    "glob",
    "rimraf",
  ],

  // Note: Shebang would be configured via esbuildOptions if needed

  // Environment variables for CLI
  define: {
    "process.env.CLI_VERSION": JSON.stringify(process.env.npm_package_version),
  },
});

// Server application configuration
export const serverConfig = createTsupConfig({
  entry: {
    server: "src/server.ts",
    worker: "src/worker.ts",
  },

  format: ["cjs"],
  platform: "node",
  target: "node22",

  external: [
    // Server frameworks
    "express",
    "fastify",
    "koa",

    // Database
    "mongoose",
    "pg",
    "redis",

    // Authentication
    "passport",
    "jsonwebtoken",

    // Utilities
    "lodash",
    "moment",
    "uuid",
  ],

  // Server-specific optimizations
  treeshake: true,
  splitting: false,

  // Add process environment
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
  },
});

// Build tool configuration
export const buildToolConfig = createTsupConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    plugins: "src/plugins/index.ts",
  },

  format: ["esm", "cjs"], // Support both for wider compatibility
  platform: "node",
  target: "node22", // Modern Node.js version

  external: [
    // Build tool dependencies
    "esbuild",
    "rollup",
    "webpack",
    "vite",

    // File system utilities
    "fs-extra",
    "glob",
    "minimatch",
    "chokidar",

    // Common utilities
    "chalk",
    "debug",
    "yargs",
  ],

  // Enable splitting for plugin architecture
  splitting: true,

  esbuildOptions(options) {
    return {
      ...options,
      // Don't bundle dynamic imports for plugin loading
      external: [...(options.external || []), "./plugins/*"],
    };
  },
});

// Development vs Production Node.js builds
const isDev = process.env.NODE_ENV === "development";

export const environmentSpecificConfig = createTsupConfig({
  entry: { server: "src/server.ts" },

  format: ["cjs"],
  platform: "node",
  target: "node22",

  // Development optimizations
  sourcemap: true,
  clean: !isDev,

  // External dependencies
  external: isDev
    ? ["express"] // Minimal externals in dev
    : ["express", "lodash", "moment"], // More externals in prod

  // Environment-specific defines
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isDev ? "development" : "production",
    ),
    "process.env.DEBUG": JSON.stringify(isDev ? "app:*" : "false"),
  },

  // Development-specific hooks
  onSuccess: isDev
    ? async () => console.log("🚀 Development build ready")
    : async () => console.log("✅ Production build optimized"),
});

/*
 * Package.json configuration for Node.js applications:
 *
 * CLI Application:
 * {
 *   "type": "commonjs",
 *   "main": "./dist/cli.cjs",
 *   "bin": {
 *     "my-cli": "./dist/cli.cjs"
 *   },
 *   "files": ["dist"],
 *   "engines": {
 *     "node": ">=18.0.0"
 *   },
 *   "scripts": {
 *     "build": "tsup",
 *     "dev": "tsup --watch",
 *     "start": "node dist/cli.cjs"
 *   }
 * }
 *
 * Server Application:
 * {
 *   "type": "commonjs",
 *   "main": "./dist/server.cjs",
 *   "files": ["dist"],
 *   "engines": {
 *     "node": ">=18.0.0"
 *   },
 *   "scripts": {
 *     "build": "tsup",
 *     "start": "node dist/server.cjs",
 *     "dev": "tsup --watch & nodemon dist/server.cjs"
 *   }
 * }
 *
 * Build Tool:
 * {
 *   "type": "module",
 *   "main": "./dist/index.cjs",
 *   "module": "./dist/index.js",
 *   "types": "./dist/index.d.ts",
 *   "bin": {
 *     "my-build-tool": "./dist/cli.cjs"
 *   },
 *   "exports": {
 *     ".": {
 *       "import": "./dist/index.js",
 *       "require": "./dist/index.cjs",
 *       "types": "./dist/index.d.ts"
 *     },
 *     "./plugins": {
 *       "import": "./dist/plugins.js",
 *       "require": "./dist/plugins.cjs",
 *       "types": "./dist/plugins.d.ts"
 *     }
 *   },
 *   "files": ["dist"],
 *   "engines": {
 *     "node": ">=16.0.0"
 *   }
 * }
 */
