/**
 * ReasonableTech ESLint plugin
 *
 * Aggregates all custom ESLint rules into a single plugin object for
 * registration in flat config via `plugins: { "@reasonabletech": reasonableTechPlugin }`.
 */

import { noDependencyBundlingRule } from "./custom-rules/architecture-patterns.js";
import { noLinterDisablingRule, noBarrelExportsRule } from "./custom-rules/code-quality.js";
import {
  noErrorMessageParsingRule,
  noInlineErrorUnionsRule,
} from "./custom-rules/error-handling.js";
import { noNullUndefinedChecksRule } from "./custom-rules/null-undefined-checks.js";
import { useResultHelpersRule } from "./custom-rules/platform-conventions.js";
import { noAsAnyRule } from "./custom-rules/type-safety.js";

export const reasonableTechPlugin = {
  meta: {
    name: "@reasonabletech/eslint-plugin",
    version: "0.1.0",
  },
  rules: {
    "no-as-any": noAsAnyRule,
    "no-barrel-exports": noBarrelExportsRule,
    "no-dependency-bundling": noDependencyBundlingRule,
    "no-error-message-parsing": noErrorMessageParsingRule,
    "no-inline-error-unions": noInlineErrorUnionsRule,
    "no-linter-disabling": noLinterDisablingRule,
    "no-null-undefined-checks": noNullUndefinedChecksRule,
    "use-result-helpers": useResultHelpersRule,
  },
};
