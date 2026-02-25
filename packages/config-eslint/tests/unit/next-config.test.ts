/**
 * Next.js Configuration Tests
 */

import { describe, expect, it } from "vitest";
import { createTypeAwareNextConfig } from "../../src/next.js";

describe("Next.js Configuration", () => {
  it("returns valid configuration array", () => {
    const config = createTypeAwareNextConfig(".");
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it("includes Next.js specific configurations", () => {
    const config = createTypeAwareNextConfig(".");
    expect(config.length).toBeGreaterThan(1);
  });

  it("works with different project directories", () => {
    const config1 = createTypeAwareNextConfig(".");
    const config2 = createTypeAwareNextConfig("/some/other/path");

    expect(Array.isArray(config1)).toBe(true);
    expect(Array.isArray(config2)).toBe(true);
  }, 20000);

  describe("dedupePlugins behavior", () => {
    it("deduplicates plugin entries across config objects", () => {
      const config = createTypeAwareNextConfig(".");

      // Collect all plugin names across all config objects
      const pluginOccurrences = new Map<string, number>();
      for (const entry of config) {
        if (entry.plugins !== undefined) {
          for (const name of Object.keys(entry.plugins)) {
            pluginOccurrences.set(name, (pluginOccurrences.get(name) ?? 0) + 1);
          }
        }
      }

      // Each plugin name should appear at most once across all config objects
      for (const [name, count] of pluginOccurrences) {
        expect(count, `Plugin "${name}" should appear only once`).toBe(1);
      }
    });

    it("preserves configs without plugins unchanged", () => {
      const config = createTypeAwareNextConfig(".");

      // Configs without plugins should still be present (rules-only, settings-only, etc.)
      const configsWithoutPlugins = config.filter(
        (c) => c.plugins === undefined,
      );
      expect(configsWithoutPlugins.length).toBeGreaterThan(0);
    });

    it("strips plugin configs property from deduplicated plugins", () => {
      const config = createTypeAwareNextConfig(".");

      // Plugins in the output should not have a `configs` property
      // (stripPluginConfigs removes it to avoid circular references)
      for (const entry of config) {
        if (entry.plugins !== undefined) {
          for (const [, plugin] of Object.entries(entry.plugins)) {
            if (typeof plugin === "object") {
              expect(
                (plugin as Record<string, unknown>).configs,
                "Plugin should not have configs property after stripping",
              ).toBeUndefined();
            }
          }
        }
      }
    });
  });
});
