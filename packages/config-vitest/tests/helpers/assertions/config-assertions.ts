import { expect } from "vitest";

interface SetupFilesContainer {
  test?: {
    setupFiles?: unknown;
  };
}

/**
 * Asserts that a configuration export includes a specific setup file entry.
 * @param configExport - Configuration export returned by config factory functions.
 * @param setupFile - Setup file path expected to be present.
 */
export function expectIncludesSetupFile(
  configExport: unknown,
  setupFile: string,
): void {
  if (configExport === null || typeof configExport !== "object") {
    throw new TypeError("Expected config export to be an object");
  }

  const setupFiles = (configExport as SetupFilesContainer).test?.setupFiles;
  expect(Array.isArray(setupFiles)).toBe(true);
  if (!Array.isArray(setupFiles)) {
    return;
  }
  expect(setupFiles).toContain(setupFile);
}
