import type { PlaywrightTestConfig } from "@playwright/test";

/**
 * Returns configured Playwright project names from a config object.
 * @param config - Playwright configuration to inspect
 * @returns project name list in order
 */
export function getProjectNames(config: PlaywrightTestConfig): string[] {
  return (config.projects ?? []).map((project) => project.name ?? "");
}
