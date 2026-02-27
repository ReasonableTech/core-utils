/**
 * Test quality rule definitions for ReasonableTech projects
 *
 * These rules prevent low-value test patterns that inflate coverage
 * metrics without verifying real behavior. They are specifically designed
 * to catch AI-generated test anti-patterns.
 */

import type { Linter } from "eslint";

/**
 * AST selector matching `expect(typeof <expr>).<matcher>(...)`.
 *
 * The pattern:
 * - Outer CallExpression  → the matcher call, e.g. `.toBe("function")`
 * - callee is a MemberExpression whose object is a CallExpression to `expect`
 * - The argument passed to `expect` is a UnaryExpression with operator `"typeof"`
 *
 * This catches all variants regardless of the matcher used:
 * `expect(typeof x).toBe("function")`
 * `expect(typeof x).toEqual("object")`
 * `expect(typeof x).toStrictEqual("string")`
 */
const TYPEOF_IN_EXPECT_SELECTOR =
  'CallExpression[callee.type="MemberExpression"]' +
  '[callee.object.type="CallExpression"]' +
  '[callee.object.callee.name="expect"]' +
  '[callee.object.arguments.0.type="UnaryExpression"]' +
  '[callee.object.arguments.0.operator="typeof"]';

const NO_TYPEOF_IN_EXPECT_MESSAGE =
  "❌ FORBIDDEN: expect(typeof x).toBe(...) adds zero test value and hides real" +
  " gaps in functionality. Test observable behaviour instead — call the function," +
  " check its return value, assert side-effects.";

/**
 * Creates ESLint rules that ban `expect(typeof <expr>).<matcher>(...)` patterns.
 *
 * These assertions only verify that JavaScript knows the type of an expression
 * at the time the test runs — information that TypeScript already guarantees at
 * compile time. They are a classic AI-generated coverage-padding anti-pattern.
 *
 * ❌ FORBIDDEN:
 * ```typescript
 * expect(typeof tabula.close).toBe("function");
 * expect(typeof result).toBe("object");
 * expect(typeof user.name).toEqual("string");
 * ```
 *
 * ✅ CORRECT: test observable behaviour
 * ```typescript
 * // Call the function and assert what it does
 * await tabula.close();
 * expect(tabula.isClosed()).toBe(true);
 *
 * // Assert the shape of a result
 * expect(result).toMatchObject({ id: expect.any(String) });
 *
 * // Assert the value, not the type
 * expect(user.name).toBe("Alice");
 * ```
 * @returns ESLint rules that prevent typeof-in-expect patterns
 */
export function createNoTypeofInExpectRules(): Linter.RulesRecord {
  return {
    "no-restricted-syntax": [
      "error",
      {
        selector: TYPEOF_IN_EXPECT_SELECTOR,
        message: NO_TYPEOF_IN_EXPECT_MESSAGE,
      },
    ],
  };
}
