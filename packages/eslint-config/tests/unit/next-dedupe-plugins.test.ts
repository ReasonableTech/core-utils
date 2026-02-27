import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDedupeBaseConfigs } from "../fixtures/next/dedupe-plugin-configs.js";
import { createTypeAwareConfig } from "../mocks/next-index-module.js";
import { createNextjsConfigs } from "../mocks/next-config-module.js";
import { createNextjsPluginConfig } from "../mocks/next-plugins-module.js";

vi.mock(
  "../../src/index.js",
  async () => await import("../mocks/next-index-module.js"),
);

vi.mock(
  "../../src/next/config.js",
  async () => await import("../mocks/next-config-module.js"),
);

vi.mock(
  "../../src/next/plugins.js",
  async () => await import("../mocks/next-plugins-module.js"),
);

import { createTypeAwareNextConfig } from "../../src/next.js";

describe("createTypeAwareNextConfig plugin deduplication", () => {
  beforeEach(() => {
    createTypeAwareConfig.mockReset();
    createNextjsPluginConfig.mockReset();
    createNextjsConfigs.mockReset();
  });

  it("removes duplicate plugin entries and strips plugin configs metadata", () => {
    createTypeAwareConfig.mockReturnValue(createDedupeBaseConfigs());
    createNextjsPluginConfig.mockReturnValue({
      usesFallback: false,
      nextConfigs: [],
      fallbackConfigs: [],
    });
    createNextjsConfigs.mockReturnValue([]);

    const config = createTypeAwareNextConfig(".");

    const firstPluginEntry = config.find(
      (entry) =>
        entry.plugins !== undefined &&
        Object.prototype.hasOwnProperty.call(entry.plugins, "react"),
    );
    expect(firstPluginEntry).toBeDefined();
    if (firstPluginEntry?.plugins !== undefined) {
      const reactPlugin = (firstPluginEntry.plugins as Record<string, unknown>)
        .react as Record<string, unknown>;
      expect(reactPlugin.configs).toBeUndefined();
      expect(reactPlugin.meta).toEqual({ name: "react" });
    }

    const duplicatePluginEntry = config.find(
      (entry) => (entry.rules as Record<string, unknown> | undefined)?.semi === "error",
    );
    expect(duplicatePluginEntry).toBeDefined();
    expect(duplicatePluginEntry?.plugins).toBeUndefined();

    const rulesOnlyEntry = config.find(
      (entry) =>
        (entry.rules as Record<string, unknown> | undefined)?.eqeqeq === "error",
    );
    expect(rulesOnlyEntry).toBeDefined();
    expect(rulesOnlyEntry?.plugins).toBeUndefined();
  });
});
