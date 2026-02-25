import { expect } from "vitest";

/**
 * Asserts that a Vite resolve alias does not define an "@" entry.
 * Supports array and object alias shapes.
 * @param alias - Vite resolve alias (array or map) to validate.
 */
export const expectNoAtAlias = (alias: unknown): void => {
  if (alias === undefined || alias === null) {
    expect(alias).toBeUndefined();
    return;
  }

  if (Array.isArray(alias)) {
    const hasAtAlias = alias.some((entry) => {
      if (entry === null || typeof entry !== "object") {
        return false;
      }
      if (!("find" in entry)) {
        return false;
      }
      const find = (entry as { readonly find?: unknown }).find;
      return find === "@";
    });
    expect(hasAtAlias).toBe(false);
    return;
  }

  if (typeof alias === "object") {
    expect(Object.prototype.hasOwnProperty.call(alias, "@")).toBe(false);
    return;
  }

  expect(alias).toBeUndefined();
};

/**
 * Converts a Vite alias value to an object map when possible.
 * @param alias - resolve.alias value to normalize
 * @returns object alias map or empty map for unsupported shapes
 */
export const getAliasMap = (alias: unknown): Record<string, string> => {
  if (alias !== null && typeof alias === "object" && !Array.isArray(alias)) {
    return alias as Record<string, string>;
  }
  return {};
};
