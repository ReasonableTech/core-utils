import { beforeEach, describe, expect, it, vi } from "vitest";

const { spawnSyncMock, existsSyncMock, readFileSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
  existsSyncMock: vi.fn(),
  readFileSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawnSync: spawnSyncMock,
}));

vi.mock("node:fs", () => ({
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}));

import globalSetup, { getTurboBuildArgs } from "../../src/global-setup.js";

describe("Vitest workspace dependency build globalSetup", () => {
  beforeEach(() => {
    spawnSyncMock.mockReset();
    existsSyncMock.mockReset();
    readFileSyncMock.mockReset();
    delete process.env.RT_VITEST_SKIP_DEP_BUILD;
    delete process.env.RT_VITEST_DEP_BUILD_RUNNING;
  });

  it("builds workspace dependencies via turbo using the calling package name", () => {
    const cwdSpy = vi
      .spyOn(process, "cwd")
      .mockReturnValue("/repo/apps/example-service");

    existsSyncMock.mockImplementation((p: string) => {
      if (p === "/repo/apps/example-service/package.json") {
        return true;
      }
      if (p === "/repo/pnpm-workspace.yaml") {
        return true;
      }
      return false;
    });

    readFileSyncMock.mockImplementation((p: string) => {
      if (p !== "/repo/apps/example-service/package.json") {
        throw new Error("Unexpected readFileSync path");
      }
      return JSON.stringify({ name: "example-service" });
    });

    spawnSyncMock.mockReturnValue({ status: 0 });

    globalSetup();

    expect(spawnSyncMock).toHaveBeenCalledWith(
      "pnpm",
      getTurboBuildArgs("example-service"),
      expect.objectContaining({
        cwd: "/repo",
        stdio: "inherit",
      }),
    );

    cwdSpy.mockRestore();
  });

  it("skips building when RT_VITEST_SKIP_DEP_BUILD=true", () => {
    const previousValue = process.env.RT_VITEST_SKIP_DEP_BUILD;
    process.env.RT_VITEST_SKIP_DEP_BUILD = "true";

    try {
      globalSetup();
      expect(spawnSyncMock).not.toHaveBeenCalled();
    } finally {
      if (previousValue === undefined) {
        delete process.env.RT_VITEST_SKIP_DEP_BUILD;
      } else {
        process.env.RT_VITEST_SKIP_DEP_BUILD = previousValue;
      }
    }
  });

  it("skips building when a dependency build is already running", () => {
    const previousValue = process.env.RT_VITEST_DEP_BUILD_RUNNING;
    process.env.RT_VITEST_DEP_BUILD_RUNNING = "true";

    try {
      globalSetup();
      expect(spawnSyncMock).not.toHaveBeenCalled();
    } finally {
      if (previousValue === undefined) {
        delete process.env.RT_VITEST_DEP_BUILD_RUNNING;
      } else {
        process.env.RT_VITEST_DEP_BUILD_RUNNING = previousValue;
      }
    }
  });

  it("skips building when package.json cannot be resolved to a package name", () => {
    const cwdSpy = vi
      .spyOn(process, "cwd")
      .mockReturnValue("/repo/apps/missing-package");

    existsSyncMock.mockImplementation((p: string) => {
      if (p === "/repo/apps/missing-package/package.json") {
        return false;
      }
      return false;
    });

    globalSetup();

    expect(spawnSyncMock).not.toHaveBeenCalled();

    cwdSpy.mockRestore();
  });

  it("throws with an explicit exit code when dependency build fails", () => {
    const cwdSpy = vi
      .spyOn(process, "cwd")
      .mockReturnValue("/repo/apps/example-service");

    existsSyncMock.mockImplementation((p: string) => {
      if (p === "/repo/apps/example-service/package.json") {
        return true;
      }
      if (p === "/repo/pnpm-workspace.yaml") {
        return true;
      }
      return false;
    });

    readFileSyncMock.mockImplementation((p: string) => {
      if (p !== "/repo/apps/example-service/package.json") {
        throw new Error("Unexpected readFileSync path");
      }
      return JSON.stringify({ name: "example-service" });
    });

    spawnSyncMock.mockReturnValue({ status: 7 });

    expect(() => {
      globalSetup();
    }).toThrow("exit code: 7");

    cwdSpy.mockRestore();
  });

  it("throws with unknown exit code when dependency build status is unavailable", () => {
    const cwdSpy = vi
      .spyOn(process, "cwd")
      .mockReturnValue("/repo/apps/example-service");

    existsSyncMock.mockImplementation((p: string) => {
      if (p === "/repo/apps/example-service/package.json") {
        return true;
      }
      if (p === "/repo/pnpm-workspace.yaml") {
        return true;
      }
      return false;
    });

    readFileSyncMock.mockImplementation((p: string) => {
      if (p !== "/repo/apps/example-service/package.json") {
        throw new Error("Unexpected readFileSync path");
      }
      return JSON.stringify({ name: "example-service" });
    });

    spawnSyncMock.mockReturnValue({});

    expect(() => {
      globalSetup();
    }).toThrow("exit code: unknown");

    cwdSpy.mockRestore();
  });
});
