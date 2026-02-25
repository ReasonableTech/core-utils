import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { findRepoRoot, readPackageName } from "../../src/workspace.js";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe("workspace utilities", () => {
  describe("Core use cases", () => {
    it("finds the monorepo root by locating pnpm-workspace.yaml", () => {
      const rootDir = createTempDir("config-vitest-workspace-root-");
      const nestedDir = join(rootDir, "packages", "app");
      mkdirSync(nestedDir, { recursive: true });
      writeFileSync(join(rootDir, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");

      expect(findRepoRoot(nestedDir)).toBe(rootDir);
    });

    it("reads package name from package.json", () => {
      const packageDir = createTempDir("config-vitest-package-name-");
      writeFileSync(
        join(packageDir, "package.json"),
        JSON.stringify({ name: "@reasonabletech/example" }),
      );

      expect(readPackageName(packageDir)).toBe("@reasonabletech/example");
    });
  });

  describe("Error handling", () => {
    it("returns start directory when workspace marker is missing", () => {
      const startDir = createTempDir("config-vitest-no-workspace-");

      expect(findRepoRoot(startDir)).toBe(startDir);
    });

    it("returns null when package.json is missing", () => {
      const packageDir = createTempDir("config-vitest-missing-package-json-");

      expect(readPackageName(packageDir)).toBeNull();
    });

    it("returns null when package.json contains invalid JSON", () => {
      const packageDir = createTempDir("config-vitest-invalid-json-");
      writeFileSync(join(packageDir, "package.json"), "{invalid-json");

      expect(readPackageName(packageDir)).toBeNull();
    });

    it("returns null when package name is not a non-empty string", () => {
      const packageDir = createTempDir("config-vitest-empty-name-");
      writeFileSync(join(packageDir, "package.json"), JSON.stringify({ name: "" }));

      expect(readPackageName(packageDir)).toBeNull();
    });
  });
});
