import type {
  ConfigEnv,
  ViteUserConfig,
  ViteUserConfigExport,
} from "vitest/config";

const defaultEnv: ConfigEnv = {
  command: "serve",
  mode: "test",
  isSsrBuild: false,
  isPreview: false,
};

/**
 * Resolves a Vite config export (object or function) into a concrete config.
 * @param configExport - exported config from defineConfig or config factory
 * @returns resolved Vite user config
 */
export async function resolveConfigExport(
  configExport: ViteUserConfigExport,
): Promise<ViteUserConfig> {
  if (typeof configExport === "function") {
    return await configExport(defaultEnv);
  }
  return await Promise.resolve(configExport as ViteUserConfig);
}
