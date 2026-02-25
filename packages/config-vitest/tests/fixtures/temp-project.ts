import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDirs: string[] = [];

export interface TempProjectOptions {
  packageName?: string;
  withVitestSetup?: boolean;
  withTestsSetup?: boolean;
}

/**
 * Creates a temporary test project for config factory assertions.
 * Call cleanupTempProjects in afterEach to avoid leaked temp dirs.
 * @param options - setup options for files created in temp project
 * @returns absolute path to temp project directory
 */
export function createTempProject(options: TempProjectOptions = {}): string {
  const projectDir = mkdtempSync(join(tmpdir(), "config-vitest-react-"));
  tempDirs.push(projectDir);

  mkdirSync(join(projectDir, "src"), { recursive: true });

  if (typeof options.packageName === "string") {
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ name: options.packageName }),
    );
  }

  if (options.withVitestSetup === true) {
    writeFileSync(join(projectDir, "vitest.setup.ts"), "export {};\n");
  }

  if (options.withTestsSetup === true) {
    mkdirSync(join(projectDir, "tests"), { recursive: true });
    writeFileSync(join(projectDir, "tests", "setup.ts"), "export {};\n");
  }

  return projectDir;
}

/** Removes all temporary project directories created by this fixture module. */
export function cleanupTempProjects(): void {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
}
