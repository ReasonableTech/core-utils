import { createVitestConfig } from "@reasonabletech/config-vitest";

export default createVitestConfig(import.meta.dirname, {
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./generated/test-coverage",
      include: ["src/**/*.ts"],
      exclude: ["node_modules/**", "dist/**", "tests/**"],
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
});
