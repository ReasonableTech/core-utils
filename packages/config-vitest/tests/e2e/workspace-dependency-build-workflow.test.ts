import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { spawnSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawnSync: spawnSyncMock,
}));

import globalSetup, { getTurboBuildArgs } from "../../src/global-setup.js";

const tempRoots: string[] = [];

beforeEach(() => {
  spawnSyncMock.mockReset();
});

afterEach(() => {
  for (const tempRoot of tempRoots) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
  tempRoots.length = 0;

  delete process.env.RT_VITEST_SKIP_DEP_BUILD;
  delete process.env.RT_VITEST_DEP_BUILD_RUNNING;

  vi.restoreAllMocks();
});

describe("workspace dependency build workflow", () => {
  describe("Core use cases", () => {
    it("builds upstream workspace packages from the caller package context", () => {
      const repoRoot = mkdtempSync(join(tmpdir(), "config-vitest-e2e-repo-"));
      tempRoots.push(repoRoot);

      writeFileSync(join(repoRoot, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");

      const packageDir = join(repoRoot, "packages", "consumer");
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        join(packageDir, "package.json"),
        JSON.stringify({ name: "@reasonabletech/consumer" }),
      );

      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(packageDir);
      spawnSyncMock.mockReturnValue({ status: 0 });

      globalSetup();

      expect(getTurboBuildArgs("@reasonabletech/consumer")).toEqual([
        "-w",
        "turbo",
        "run",
        "build",
        "--filter=@reasonabletech/consumer^...",
      ]);

      expect(spawnSyncMock).toHaveBeenCalledTimes(1);
      const firstCall = spawnSyncMock.mock.calls[0] as unknown as [
        string,
        readonly string[],
        {
          readonly cwd: string;
          readonly stdio: string;
          readonly env?: NodeJS.ProcessEnv;
        },
      ];
      expect(firstCall[0]).toBe("pnpm");
      expect(firstCall[1]).toEqual([
        "-w",
        "turbo",
        "run",
        "build",
        "--filter=@reasonabletech/consumer^...",
      ]);
      expect(firstCall[2].cwd).toBe(repoRoot);
      expect(firstCall[2].stdio).toBe("inherit");
      expect(firstCall[2].env?.RT_VITEST_DEP_BUILD_RUNNING).toBe("true");

      cwdSpy.mockRestore();
    });
  });

  describe("Error handling", () => {
    it("throws a descriptive error when upstream build fails", () => {
      const repoRoot = mkdtempSync(join(tmpdir(), "config-vitest-e2e-repo-"));
      tempRoots.push(repoRoot);

      writeFileSync(join(repoRoot, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");

      const packageDir = join(repoRoot, "packages", "consumer");
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        join(packageDir, "package.json"),
        JSON.stringify({ name: "@reasonabletech/consumer" }),
      );

      vi.spyOn(process, "cwd").mockReturnValue(packageDir);
      spawnSyncMock.mockReturnValue({ status: 17 });

      expect(() => {
        globalSetup();
      }).toThrow("Failed to build workspace dependencies (exit code: 17)");
    });

    it("skips execution when dependency build is intentionally disabled", () => {
      process.env.RT_VITEST_SKIP_DEP_BUILD = "true";

      globalSetup();

      expect(spawnSyncMock).not.toHaveBeenCalled();
    });
  });
});
