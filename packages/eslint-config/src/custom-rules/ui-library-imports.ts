import type { Linter } from "eslint";

/**
 * Configuration options for UI library import boundary rules.
 */
export interface UILibraryImportRuleOptions {
  /**
   * Whether to enforce subpath-only imports for `@lovelace-ai/ui`.
   * @default true
   */
  discourageUILibraryBarrelImports?: boolean;
}

const DEFAULT_UI_LIBRARY_OPTIONS: Required<UILibraryImportRuleOptions> = {
  discourageUILibraryBarrelImports: true,
};
const LOVELACE_UI_PACKAGE_NAME = "@lovelace-ai/ui";

function escapeSelectorLiteral(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

/**
 * Creates rules that enforce subpath imports for the configured UI library.
 *
 * This enforces separation of responsibilities for shared UI code by preventing
 * broad barrel imports from the package root.
 * @param options Configuration for UI library import boundaries
 * @returns ESLint rules for UI import boundaries
 */
export function createUILibraryImportRules(
  options: UILibraryImportRuleOptions = {},
): Linter.RulesRecord {
  const config = { ...DEFAULT_UI_LIBRARY_OPTIONS, ...options };

  if (!config.discourageUILibraryBarrelImports) {
    return {};
  }

  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: `ImportDeclaration[source.value='${escapeSelectorLiteral(LOVELACE_UI_PACKAGE_NAME)}'] ImportSpecifier`,
        message: `❌ FORBIDDEN: Never use barrel imports from ${LOVELACE_UI_PACKAGE_NAME}. Use default imports from specific subpaths instead. Example: import Button from "${LOVELACE_UI_PACKAGE_NAME}/button";`,
      },
    ],
  };
}
