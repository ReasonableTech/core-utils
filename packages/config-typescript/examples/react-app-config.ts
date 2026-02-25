/**
 * React-oriented configuration examples.
 */

const reactAppTsConfig = {
  extends: "@reasonabletech/config-typescript/react-app.json",
  compilerOptions: {
    baseUrl: ".",
    paths: {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
    },
    types: ["vite/client", "node"],
  },
  include: ["src/**/*", "vite-env.d.ts"],
  exclude: ["node_modules", "dist"],
};

const reactLibraryTsConfig = {
  extends: "@reasonabletech/config-typescript/react-library.json",
  compilerOptions: {
    outDir: "./dist",
    rootDir: "./src",
  },
  include: ["src/**/*"],
  exclude: ["**/*.test.tsx", "**/*.spec.tsx"],
};

const nextJsTsConfig = {
  extends: "@reasonabletech/config-typescript/nextjs.json",
  compilerOptions: {
    baseUrl: ".",
    paths: {
      "@/*": ["src/*"],
    },
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
};

const reactTestTsConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    types: ["vitest/globals", "jsdom", "@testing-library/jest-dom"],
  },
  include: ["src/**/*", "tests/**/*", "**/*.test.ts", "**/*.test.tsx"],
};

const reactPackageScripts = {
  scripts: {
    dev: "vite",
    build: "tsc --noEmit && vite build",
    typecheck: "tsc --noEmit",
    test: "vitest",
  },
};

export {
  reactAppTsConfig,
  reactLibraryTsConfig,
  nextJsTsConfig,
  reactTestTsConfig,
  reactPackageScripts,
};
