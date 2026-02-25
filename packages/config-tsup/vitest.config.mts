import { createVitestConfig } from "../config-vitest/src/index.js";

export default createVitestConfig(import.meta.dirname, {
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
