import { afterEach, beforeEach, vi } from "vitest";

// Mock Node.js modules for build config testing
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
}));

vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    resolve: vi.fn((...paths) => paths.join("/")),
  };
});

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
