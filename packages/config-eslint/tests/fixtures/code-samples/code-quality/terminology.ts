/**
 * Code fixtures for terminology rule testing
 *
 * FIXTURE: Pure test data — code samples demonstrating violations and correct patterns.
 * These strings are linted by integration tests; they are not executed.
 */

/**
 * Violation: using deprecated "toolCall" identifier
 *
 * The platform uses "action" instead of "toolCall" for consistency.
 */
export const toolCallIdentifierViolation = `
const toolCall = { name: "search", args: {} };
`;

/**
 * Correct: using the preferred "action" identifier
 */
export const actionIdentifierCorrect = `
const action = { name: "search", args: {} };
`;
