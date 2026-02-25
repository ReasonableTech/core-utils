/**
 * Node.js-specific Vitest configuration
 * @module @reasonabletech/config-vitest/node
 */

import type { InlineConfig } from "vitest/node";
import type { UserConfig } from "vite";
import { createVitestConfig, type DeepReadonly } from "./index.js";

/** Immutable Vitest configuration type combining Vite UserConfig with Vitest InlineConfig */
export type VitestConfig = DeepReadonly<UserConfig> & {
  readonly test?: DeepReadonly<InlineConfig>;
};

// Empty readonly config for default parameters
const EMPTY_CONFIG = {} as const satisfies VitestConfig;

/**
 * Node.js-specific configuration options
 */
export const nodeConfig = {
  test: {
    environment: "node" as const,
    include: ["tests/**/*.test.ts"],
  },
} as const satisfies VitestConfig;

/**
 * Creates a Vitest configuration for Node.js-based packages.
 * @param projectDirOrConfig - Either the absolute project directory (use `import.meta.dirname`) or a prebuilt config.
 * @param customConfig - Additional configuration to merge when a project directory is provided.
 * @returns A Vitest configuration optimized for Node.js environments
 */
export function createNodeConfig(
  projectDirOrConfig?: string | VitestConfig,
  customConfig?: VitestConfig,
): ReturnType<typeof createVitestConfig> {
  // Handle overloaded parameters
  let projectDir: string | undefined;
  let config: VitestConfig;

  if (typeof projectDirOrConfig === "string") {
    projectDir = projectDirOrConfig;
    config = customConfig ?? EMPTY_CONFIG;
  } else {
    projectDir = undefined;
    config = projectDirOrConfig ?? EMPTY_CONFIG;
  }

  // Merge node-specific settings with consumer config
  const mergedConfig = {
    ...nodeConfig,
    ...config,
    test: {
      ...nodeConfig.test,
      ...config.test,
    },
  };

  // Delegate to createVitestConfig which handles aliasing and base config.
  // When projectDir is present, pass both args so createVitestConfig generates aliases.
  // When absent, pass the merged config as the sole argument.
  if (projectDir !== undefined) {
    return createVitestConfig(
      projectDir,
      mergedConfig as Parameters<typeof createVitestConfig>[1],
    );
  }
  return createVitestConfig(
    mergedConfig as Parameters<typeof createVitestConfig>[0],
  );
}

export default createNodeConfig;
