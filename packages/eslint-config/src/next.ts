import { createTypeAwareConfig } from "./index.js";
import { createNextjsConfigs } from "./next/config.js";
import { createNextjsPluginConfig } from "./next/plugins.js";
import { stripPluginConfigs } from "./shared/plugin-utils.js";
import type { Linter } from "eslint";

/**
 * Creates a type-aware ESLint configuration for Next.js projects.
 *
 * This configuration extends the base TypeScript configuration with Next.js-specific
 * rules, React integration, and Next.js plugin support. It provides a comprehensive
 * setup for modern Next.js development with TypeScript.
 *
 * Key features:
 * - Next.js core-web-vitals and TypeScript integration
 * - Automatic React plugin setup with fallback support
 * - Next.js-optimized ignore patterns for generated files
 * - React Hooks validation with exhaustive dependencies
 * - TypeScript rule overrides for Next.js patterns
 * - JSDoc requirement exemptions for React components
 * - Graceful degradation when Next.js plugins are unavailable
 *
 * The configuration automatically detects Next.js plugin availability and falls back
 * to standalone React configuration when needed, making it robust across different
 * development environments.
 * @param projectDir - The directory containing the TypeScript project
 * @returns A comprehensive type-aware ESLint configuration for Next.js
 * @example
 * ```typescript
 * // In your eslint.config.mjs
 * import { createTypeAwareNextConfig } from "@reasonabletech/eslint-config/next";
 *
 * export default createTypeAwareNextConfig(import.meta.dirname);
 * ```
 */
export function createTypeAwareNextConfig(projectDir: string): Linter.Config[] {
  const baseConfigs = createTypeAwareConfig(projectDir);
  const pluginConfig = createNextjsPluginConfig(projectDir);
  const pluginEntries = pluginConfig.usesFallback
    ? pluginConfig.fallbackConfigs
    : pluginConfig.nextConfigs;

  const combinedConfigs = [
    ...baseConfigs,
    ...pluginEntries,
    // Next.js-specific configurations (includes strict TypeScript rules)
    ...createNextjsConfigs(projectDir),
  ] as Linter.Config[];

  return dedupePlugins(combinedConfigs);
}

// Export the function as the default export
export default createTypeAwareNextConfig;

function dedupePlugins(configs: readonly Linter.Config[]): Linter.Config[] {
  const seen = new Set<string>();

  return configs.map((config) => {
    if (config.plugins == null) {
      return config;
    }

    const entries = Object.entries(config.plugins).filter(([name]) => {
      if (seen.has(name)) {
        return false;
      }
      seen.add(name);
      return true;
    });

    if (entries.length === 0) {
      const rest = { ...config };
      delete rest.plugins;
      return rest;
    }

    return {
      ...config,
      plugins: Object.fromEntries(
        entries.map(([name, plugin]) => [name, stripPluginConfigs(plugin)]),
      ),
    };
  });
}
