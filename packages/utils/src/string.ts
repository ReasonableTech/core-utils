/**
 * String utility functions
 */

/**
 * Check if a string is empty or only contains whitespace
 * @param value - The string to check
 * @returns true if the string is empty, null, undefined, or only whitespace
 */
export function isEmptyString(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

/**
 * Check if a string is not empty and contains non-whitespace characters
 * @param value - The string to check
 * @returns true if the string has content
 */
export function isNonEmptyString(
  value: string | null | undefined,
): value is string {
  return value != null && value.trim().length > 0;
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param str - The string to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 */
export function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a base64url encoded string
 * @param data - Data to encode (string or Buffer)
 * @returns Base64url encoded string (URL-safe, no padding)
 */
export function encodeBase64Url(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decode a base64url encoded string
 * @param encoded - Base64url encoded string
 * @returns Decoded data as Buffer
 */
export function decodeBase64Url(encoded: string): Buffer {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

/**
 * Check if a string is a valid base64url format
 * @param str - String to validate
 * @returns True if the string is valid base64url format
 */
export function isValidBase64Url(str: string): boolean {
  const base64UrlRegex = /^[A-Za-z0-9_-]*$/;
  return base64UrlRegex.test(str);
}

/**
 * Extract a message string from an unknown error value
 * @deprecated This utility is unnecessary. The logger accepts `ErrorLike` (unknown)
 * directly via `logger.error(tag, message, error)`. Pass errors directly to the
 * logger instead of manually converting to strings.
 *
 * See: docs/standards/error-boundary-patterns.md
 * @example
 * ```typescript
 * // ❌ DEPRECATED: Manual error string extraction
 * try {
 *   await operation();
 * } catch (error) {
 *   logger.error("Component", getErrorMessage(error));
 * }
 *
 * // ✅ CORRECT: Pass error directly to logger
 * try {
 *   await operation();
 * } catch (error) {
 *   logger.error("Component", "Operation failed", error);
 * }
 * ```
 * @param error - Error value (Error object, string, or other)
 * @returns Error message string
 * @internal
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return String(error);
}
