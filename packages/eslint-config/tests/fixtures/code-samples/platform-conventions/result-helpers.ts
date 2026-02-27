/**
 * Code fixtures for Result helper rule testing
 *
 * FIXTURE: Pure test data - code samples demonstrating violations and correct patterns
 */

/**
 * Result helper violation using manual success result construction.
 *
 * This pattern manually constructs success results with { success: true, data }
 * instead of using the ok() helper from `@reasonabletech/utils`. Manual construction
 * is discouraged because it's more verbose, prone to typos, and doesn't benefit
 * from the type safety that ok() provides. The ok() helper ensures consistent
 * Result type structure across the codebase.
 */
export const manualSuccessResultViolation = `
async function getUser(id: string) {
  const user = await fetchUser(id);
  return { success: true, data: user };
}
`;

/**
 * Result helper violation using manual error result construction.
 *
 * This pattern manually constructs both success and error results instead of
 * using ok() and err() helpers. Manual construction makes code harder to read,
 * increases the chance of structural errors (wrong property names), and doesn't
 * provide the type inference benefits of the helper functions. Using err() makes
 * error returns explicit and easier to identify in code review.
 */
export const manualErrorResultViolation = `
async function getUser(id: string) {
  if (!id) {
    return { success: false, error: "invalid_id" };
  }
  const user = await fetchUser(id);
  return { success: true, data: user };
}
`;

/**
 * Result helper violation using inline result object with value property.
 *
 * This pattern uses 'value' instead of 'data' for the success property, which
 * breaks the standard Result type contract. The Result type always
 * uses 'data' for success payloads. Inconsistent property names make code
 * harder to understand and break type compatibility with functions expecting
 * standard Result types.
 */
export const manualResultWithValueViolation = `
async function processData(input: string) {
  if (!input) {
    return { success: false, error: "empty_input" };
  }
  const result = await process(input);
  return { success: true, value: result };
}
`;

/**
 * Correct usage of ok() and err() Result helpers.
 *
 * This pattern uses the ok() helper for success cases and err() for errors,
 * which is the preferred approach in the codebase. These helpers
 * provide better type inference, ensure consistent Result structure, and make
 * code more readable by clearly distinguishing success from error paths. The
 * helpers are shorter and less error-prone than manual construction.
 */
export const okHelperCorrect = `
import { ok, err } from "@reasonabletech/utils";

async function getUser(id: string) {
  if (!id) {
    return err("invalid_id");
  }
  const user = await fetchUser(id);
  return ok(user);
}
`;

/**
 * Correct usage of Result helpers with comprehensive error handling.
 *
 * This pattern demonstrates proper Result type usage with documented error
 * types, the Result type annotation, and complete error handling. The
 * GetUserError type documents all possible failure modes, making the function's
 * error contract explicit. Using ok() and err() with typed errors provides
 * both compile-time type checking and runtime error handling, while maintaining
 * readable code that's easy to test.
 */
export const resultHelperWithErrorHandlingCorrect = `
import { ok, err, type Result } from "@reasonabletech/utils";

type GetUserError = "invalid_id" | "not_found" | "database_error";

async function getUser(id: string): Promise<Result<User, GetUserError>> {
  if (!id) {
    return err("invalid_id");
  }

  try {
    const user = await database.user.findUnique({ where: { id } });
    if (!user) {
      return err("not_found");
    }
    return ok(user);
  } catch (error) {
    logger.error("UserService", "Failed to fetch user", error);
    return err("database_error");
  }
}
`;
