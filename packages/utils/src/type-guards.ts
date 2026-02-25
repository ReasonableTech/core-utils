/**
 * Type guard utilities for common type checking patterns
 * @module type-guards
 */

/**
 * Type guard to check if value is neither null nor undefined
 * @template T - The value type
 * @param value - The value to check
 * @returns True if value is present (not null or undefined), with type narrowing
 * @example
 * ```typescript
 * // Optional configuration value
 * const redirectUrl: string | null | undefined = config.redirectUrl;
 * if (isPresent(redirectUrl)) {
 *   window.location.href = redirectUrl; // redirectUrl is string
 * }
 *
 * // Database lookup result
 * const user: User | null = await db.users.findById(id);
 * if (isPresent(user)) {
 *   console.log(user.email); // user is User
 * }
 * ```
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
