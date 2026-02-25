/**
 * Next.js Project ESLint Configuration Example
 * 
 * Demonstrates ESLint setup specifically optimized for Next.js applications
 * with App Router, server components, and modern Next.js features.
 */

import { createTypeAwareNextConfig } from "@reasonabletech/config-eslint/next";

/**
 * Next.js optimized configuration with App Router support,
 * server component rules, and Next.js best practices.
 */
export default [
  ...createTypeAwareNextConfig(import.meta.dirname),
  {
    // Next.js specific overrides
    rules: {
      // Allow dynamic imports for Next.js code splitting
      "import/no-dynamic-require": "off",
      
      // Next.js Image component optimization
      "@next/next/no-img-element": "error",
      
      // Prefer Next.js Link over anchor tags
      "@next/next/no-html-link-for-pages": "error"
    }
  },
  {
    // App Router specific rules
    files: ["app/**/*.tsx", "app/**/*.ts"],
    rules: {
      // Server components can't use browser APIs
      "no-restricted-globals": ["error", "window", "document", "localStorage"],
      
      // Async server components
      "@typescript-eslint/require-await": "off"
    }
  },
  {
    // Pages Router specific rules (if using hybrid setup)
    files: ["pages/**/*.tsx", "pages/**/*.ts"],
    rules: {
      // Pages can export default and named exports
      "import/no-default-export": "off",
      
      // API routes need default exports
      "import/prefer-default-export": ["error", { target: "any" }]
    }
  },
  {
    // API routes configuration
    files: ["pages/api/**/*.ts", "app/api/**/*.ts"],
    rules: {
      // API routes commonly use console for server logging
      "no-console": "off",
      
      // Allow any types in API handlers for flexibility
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    // Configuration files
    files: ["next.config.*", "middleware.ts"],
    rules: {
      // Config files may need require statements
      "@typescript-eslint/no-var-requires": "off",
      
      // Allow console in config files
      "no-console": "off"
    }
  },
  {
    // Component-specific rules
    files: ["components/**/*.tsx", "app/**/components/**/*.tsx"],
    rules: {
      // React components should have display names
      "react/display-name": "error",
      
      // Prefer function components
      "react/prefer-stateless-function": "error",
      
      // Enforce prop types or TypeScript
      "react/prop-types": "off" // Using TypeScript instead
    }
  },
  {
    // Utility and helper files
    files: ["lib/**/*.ts", "utils/**/*.ts", "helpers/**/*.ts"],
    rules: {
      // Utilities can export multiple functions
      "import/prefer-default-export": "off"
    }
  },
  {
    // Ignore Next.js generated and build files
    ignores: [
      ".next/",
      "out/",
      "build/",
      "dist/",
      "next-env.d.ts",
      "**/*.generated.*"
    ]
  }
];