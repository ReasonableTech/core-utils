/**
 * ReasonableTech ESLint plugin
 *
 * Aggregates all custom ESLint rules into a single plugin object for
 * registration in flat config via `plugins: { "@reasonabletech": reasonableTechPlugin }`.
 */

import { noDependencyBundlingRule } from "./custom-rules/architecture-patterns.js";
import { noLinterDisablingRule } from "./custom-rules/code-quality.js";
import { noNullUndefinedChecksRule } from "./custom-rules/null-undefined-checks.js";
import { useResultHelpersRule } from "./custom-rules/platform-conventions.js";

export const reasonableTechPlugin = {
  rules: {
    "no-dependency-bundling": noDependencyBundlingRule,
    "no-linter-disabling": noLinterDisablingRule,
    "no-null-undefined-checks": noNullUndefinedChecksRule,
    "use-result-helpers": useResultHelpersRule,
  },
};
