/**
 * React Library ESLint Configuration Example
 * 
 * Demonstrates ESLint setup for React component libraries
 * with TypeScript, build outputs, and package publishing considerations.
 */

import { createTypeAwareReactConfig } from "@reasonabletech/eslint-config/react";

/**
 * React library configuration optimized for component libraries,
 * with strict rules for public APIs and build artifacts.
 */
export default [
  ...createTypeAwareReactConfig(import.meta.dirname),
  {
    // Library-specific rules
    rules: {
      // Enforce explicit return types for public APIs
      "@typescript-eslint/explicit-function-return-type": "error",
      
      // Require JSDoc for exported functions
      "require-jsdoc": ["error", {
        require: {
          FunctionDeclaration: true,
          ClassDeclaration: true
        }
      }],
      
      // Strict prop types enforcement
      "react/prop-types": "error",
      
      // No default props (use TypeScript defaults)
      "react/require-default-props": "off",
      
      // Enforce component naming
      "react/jsx-pascal-case": "error"
    }
  },
  {
    // Source component files
    files: ["src/**/*.tsx", "src/**/*.ts"],
    rules: {
      // Components should be exported
      "import/prefer-default-export": "off",
      
      // Allow named exports for tree shaking
      "import/no-default-export": "error",
      
      // Enforce TypeScript strict mode
      "@typescript-eslint/strict-boolean-expressions": "error"
    }
  },
  {
    // Component index files
    files: ["src/**/index.ts", "src/**/index.tsx"],
    rules: {
      // Index files are for re-exports
      "import/no-default-export": "off",
      "import/prefer-default-export": "off"
    }
  },
  {
    // Example/demo files
    files: ["examples/**/*.tsx", "stories/**/*.tsx", "demos/**/*.tsx"],
    rules: {
      // Examples can be more relaxed
      "@typescript-eslint/explicit-function-return-type": "off",
      "require-jsdoc": "off",
      "no-console": "off",
      
      // Examples can use default exports
      "import/no-default-export": "off"
    }
  },
  {
    // Test files
    files: ["**/*.test.tsx", "**/*.spec.tsx", "tests/**/*.{ts,tsx}"],
    rules: {
      // Testing can be more flexible
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "require-jsdoc": "off",
      
      // Allow test utilities
      "import/no-extraneous-dependencies": ["error", { 
        devDependencies: true 
      }]
    }
  },
  {
    // Storybook files
    files: ["**/*.stories.tsx", "**/*.story.tsx", ".storybook/**"],
    rules: {
      // Stories have their own conventions
      "import/no-default-export": "off",
      "require-jsdoc": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      
      // Storybook specific
      "storybook/hierarchy-separator": "error",
      "storybook/default-exports": "error"
    }
  },
  {
    // Build configuration files
    files: [
      "rollup.config.*",
      "webpack.config.*", 
      "vite.config.*",
      "tsup.config.*"
    ],
    rules: {
      // Config files can use require and console
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off",
      "import/no-default-export": "off"
    }
  },
  {
    // Type definition files
    files: ["**/*.d.ts"],
    rules: {
      // Type files have different conventions
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-default-export": "off"
    }
  },
  {
    // Package.json and other config
    files: ["*.json"],
    rules: {
      // JSON files don't need most rules
      "@typescript-eslint/no-unused-expressions": "off"
    }
  },
  {
    // Ignore build outputs and generated files
    ignores: [
      "dist/",
      "lib/", 
      "esm/",
      "cjs/",
      "umd/",
      "build/",
      "coverage/",
      "*.tsbuildinfo",
      "storybook-static/",
      ".turbo/"
    ]
  }
];