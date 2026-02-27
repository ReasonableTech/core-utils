import type { ESLint } from "eslint";

/**
 * Removes plugin config metadata to avoid circular references in flat configs.
 * @param plugin - ESLint plugin instance that may include circular configs
 * @returns Plugin without the `configs` metadata attached
 */
export const stripPluginConfigs = <T extends ESLint.Plugin>(
  plugin: T,
): ESLint.Plugin => {
  const { rules, processors, environments, meta } = plugin;
  const stripped: ESLint.Plugin = {};
  if (rules !== undefined) {
    stripped.rules = rules;
  }
  if (processors !== undefined) {
    stripped.processors = processors;
  }
  if (environments !== undefined) {
    stripped.environments = environments;
  }
  if (meta !== undefined) {
    stripped.meta = meta;
  }
  return stripped;
};
