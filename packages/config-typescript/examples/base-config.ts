/**
 * Base configuration examples for projects that consume
 * @reasonabletech/config-typescript.
 */

const baseTsConfig = {
  extends: "@reasonabletech/config-typescript/base.json",
  compilerOptions: {
    outDir: "./dist",
    rootDir: "./src",
    baseUrl: ".",
    paths: {
      "@/*": ["src/*"],
      "@/utils/*": ["src/utils/*"],
    },
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
};

const strictTsConfig = {
  extends: "@reasonabletech/config-typescript/strict.json",
  compilerOptions: {
    outDir: "./dist",
  },
  include: ["src/**/*"],
};

const libraryTsConfig = {
  extends: "@reasonabletech/config-typescript/library.json",
  compilerOptions: {
    outDir: "./dist",
    rootDir: "./src",
  },
  include: ["src/**/*"],
};

const serverTsConfig = {
  extends: "@reasonabletech/config-typescript/server.json",
  compilerOptions: {
    outDir: "./dist",
  },
  include: ["src/**/*"],
};

export { baseTsConfig, strictTsConfig, libraryTsConfig, serverTsConfig };
