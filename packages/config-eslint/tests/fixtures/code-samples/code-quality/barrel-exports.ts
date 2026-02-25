/**
 * Code fixtures for barrel export rule testing
 *
 * FIXTURE: Pure test data — code samples demonstrating violations and correct patterns.
 * These strings are linted by integration tests; they are not executed.
 */

/**
 * Violation: export * re-exports everything from a module
 *
 * Barrel exports create bloated namespaces and make it impossible to
 * track what is actually exported from a package.
 */
export const exportAllViolation = `
export * from "./utils";
`;

/**
 * Correct: explicit named exports make the public API visible
 */
export const namedExportCorrect = `
export { foo, bar } from "./utils";
`;

/**
 * Correct: default function export is not a barrel export
 */
export const defaultExportCorrect = `
export default function doWork() {
  return 42;
}
`;
