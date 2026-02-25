/**
 * Simple Library Configuration Example
 *
 * This example demonstrates the basic configuration for a utility library
 * or simple package with minimal dependencies.
 *
 * Use this configuration for:
 * - Utility libraries
 * - Helper functions
 * - Data processing packages
 * - Simple APIs without external dependencies
 */

import { createTsupConfig } from "../src/index.js";

// Basic configuration using defaults
export default createTsupConfig({});

/*
 * This minimal configuration provides:
 *
 * - Entry point: src/index.ts
 * - Output formats: ESM and CommonJS
 * - TypeScript declarations: Enabled
 * - Source maps: Enabled
 * - Tree shaking: Enabled
 * - Clean output: Enabled
 * - Platform: Neutral (works in Node.js and browsers)
 * - Target: Node.js 16+ compatible
 *
 * Generated files:
 * - dist/index.js (ESM)
 * - dist/index.cjs (CommonJS)
 * - dist/index.d.ts (TypeScript declarations)
 * - dist/index.js.map (Source map)
 * - dist/index.cjs.map (Source map)
 */

// Alternative: Using the simple preset directly
// import { simpleConfig } from "@reasonabletech/config-tsup";
// export default simpleConfig;

// Example with minimal customization
export const customizedSimple = createTsupConfig({
  // Override entry point if needed
  entry: { index: "src/main.ts" },

  // Add package-specific externals
  external: ["some-peer-dependency"],

  // Customize target if needed
  target: "es2020",
});

/*
 * Package.json configuration for this build:
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
 *     }
 *   },
 *   "files": ["dist"],
 *   "scripts": {
 *     "build": "tsup",
 *     "dev": "tsup --watch"
 *   }
 * }
 */
