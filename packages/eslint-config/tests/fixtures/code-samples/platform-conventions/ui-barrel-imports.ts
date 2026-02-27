/**
 * Code fixtures for UI barrel imports rule testing
 *
 * FIXTURE: Pure test data - code samples demonstrating violations and correct patterns
 */

/**
 * UI barrel imports violation using multiple named imports.
 *
 * This pattern imports multiple UI components from the `@lovelace-ai/ui` barrel
 * export, which is discouraged because it can accidentally include client-only
 * React components in server-side code. When Next.js processes server components,
 * barrel imports pull in the entire module graph, potentially importing
 * components marked "use client" into server contexts. This causes build errors
 * or unexpected hydration issues.
 */
export const multipleBarrelImportsViolation = `
import { Button, Input, Card } from "@lovelace-ai/ui";

export function MyForm() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button>Submit</Button>
    </Card>
  );
}
`;

/**
 * UI barrel imports violation using single named import.
 *
 * Even importing a single component from the barrel is problematic because
 * it loads the entire barrel module, including all its dependencies and
 * re-exports. This negates tree-shaking benefits and can pull client-only
 * code into server components. Using subpath imports ensures only the specific
 * component module is loaded, not the entire UI package.
 */
export const singleBarrelImportViolation = `
import { Button } from "@lovelace-ai/ui";

export function MyButton() {
  return <Button>Click me</Button>;
}
`;

/**
 * UI barrel imports violation mixed with other valid imports.
 *
 * This pattern shows that barrel imports from `@lovelace-ai/ui` are problematic
 * even when mixed with valid imports from other packages. The issue is specific
 * to UI component imports - barrel imports from utility packages like
 * `@reasonabletech/utils` are fine because they don't have client/server boundary
 * concerns. Only UI components need the subpath import pattern.
 */
export const mixedBarrelImportViolation = `
import React from "react";
import { Button, Input } from "@lovelace-ai/ui";
import { ok } from "@reasonabletech/utils";

export function MyComponent() {
  return <Button>Submit</Button>;
}
`;

/**
 * Correct UI component imports using default imports from subpaths.
 *
 * This pattern imports each component from its specific subpath using default
 * imports. This ensures only the exact component module is loaded, with its
 * direct dependencies. Tree-shaking can work properly, and there's no risk of
 * accidentally importing client-only components in server code. Each subpath
 * (button, input, card) is a separate entry point in the package.
 */
export const subpathImportCorrect = `
import Button from "@lovelace-ai/ui/button";
import Input from "@lovelace-ai/ui/input";
import Card from "@lovelace-ai/ui/card";

export function MyForm() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button>Submit</Button>
    </Card>
  );
}
`;

/**
 * Correct imports showing barrel imports are allowed from non-UI packages.
 *
 * This pattern demonstrates that barrel imports (named imports from package
 * root) are perfectly fine for non-UI packages like `@reasonabletech/utils` and
 * `@reasonabletech/logger`. These packages don't have React client/server boundary
 * issues, so importing from their barrel exports is safe and idiomatic. Only
 * `@lovelace-ai/ui` requires the special subpath import pattern.
 */
export const otherPackageBarrelImportsCorrect = `
import { ok, err } from "@reasonabletech/utils";
import { logger } from "@reasonabletech/logger";
import Button from "@lovelace-ai/ui/button";

export function MyComponent() {
  logger.info("Component", "Rendering");
  return <Button>Submit</Button>;
}
`;

/**
 * Correct mixed imports combining React, utilities, and UI components.
 *
 * This pattern shows a complete example of proper import style: React's own
 * named exports (useCallback), barrel imports from utility packages (ok from
 * `@reasonabletech/utils`), and subpath imports for UI components (Button, Input
 * from `@lovelace-ai/ui/...`). This combination ensures correct module loading,
 * tree-shaking, and no client/server boundary violations.
 */
export const mixedCorrectImportsCorrect = `
import React from "react";
import { useCallback } from "react";
import Button from "@lovelace-ai/ui/button";
import Input from "@lovelace-ai/ui/input";
import { ok } from "@reasonabletech/utils";

export function MyForm() {
  const handleSubmit = useCallback(() => {
    return ok("submitted");
  }, []);

  return (
    <>
      <Input placeholder="Name" />
      <Button onClick={handleSubmit}>Submit</Button>
    </>
  );
}
`;
