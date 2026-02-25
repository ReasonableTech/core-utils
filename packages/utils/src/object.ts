/**
 * Object utility functions for handling exactOptionalPropertyTypes and clean object construction
 *
 * These utilities are designed to work with TypeScript's strict mode and exactOptionalPropertyTypes
 * configuration, which prevents assigning undefined to optional properties. They provide clean,
 * type-safe ways to construct objects with conditional properties.
 *
 * ## Key Use Cases
 *
 * 1. **exactOptionalPropertyTypes compliance** - When you cannot assign undefined to optional properties
 * 2. **Clean object construction** - Building objects with conditional properties based on runtime values
 * 3. **API response formatting** - Creating response objects that omit undefined fields
 * 4. **Configuration objects** - Building config objects where some properties may not be defined
 *
 * ## Examples
 *
 * ### Basic Conditional Properties
 * ```typescript
 * // Instead of this (fails with exactOptionalPropertyTypes):
 * const badObj = {
 * name: "test",
 * description: undefined, // ❌ Error: undefined not assignable to optional property
 * };
 *
 * // Use this:
 * const goodObj = {
 * name: "test",
 * ...includeIf("description", maybeDescription),
 * };
 * ```
 *
 * ### Multiple Conditional Properties
 * ```typescript
 * const config = {
 * host: "localhost",
 * port: 3000,
 * ...includeIfDefined({
 * ssl: enableSsl ? { cert: certPath, key: keyPath } : undefined,
 * auth: authConfig, // may be undefined
 * timeout: customTimeout, // may be undefined
 * }),
 * };
 * ```
 *
 * ### API Response Building
 * ```typescript
 * function buildApiResponse(user: User) {
 * return {
 * id: user.id,
 * name: user.name,
 * ...includeIf("email", user.email), // only include if user has email
 * ...includeIf("avatar", user.avatarUrl), // only include if user has avatar
 * ...includeIf("lastSeen", user.lastSeenAt ? lastSeenAt.toISOString()), // convert and include if exists
 * };
 * }
 * ```
 * @module object
 * @since 1.0.0
 */

/**
 * Conditionally includes a property in an object if the value is not undefined.
 * This is useful for exactOptionalPropertyTypes compliance where you cannot assign undefined to optional properties.
 * @param key - The property key to conditionally include
 * @param value - The value to include, or undefined to omit the property
 * @returns An empty object if value is undefined, otherwise an object with the key-value pair
 * @example Basic usage
 * ```typescript
 * const obj = {
 *   required : "value",
 *   ...includeIf("optional", maybeUndefinedValue),
 * };
 * // If maybeUndefinedValue is "hello": { required: "value", optional: "hello" }
 * // If maybeUndefinedValue is undefined: { required: "value" }
 * ```
 * @example API response building
 * ```typescript
 * function createUserResponse(user: User) {
 *   return {
 *     id: user.id,
 *     name: user.name,
 *     ...includeIf("email", user.email),
 *     ...includeIf("avatar", user.avatar ? avatar.url),
 *     ...includeIf("lastLogin", user.lastLoginAt?.toISOString()),
 *   };
 * }
 * ```
 * @example Billing service usage (real project example)
 * ```typescript
 * return {
 *   amount : pricing.amount,
 *   ...includeIf("setupFee", pricing.setupFee),
 *   ...includeIf("savings", calculatedSavings),
 * };
 * ```
 */
export function includeIf<K extends string, V>(
  key: K,
  value: V | undefined,
): Record<string, unknown> {
  return value !== undefined ? { [key]: value } : {};
}

/**
 * Conditionally includes multiple properties from an object, omitting any with undefined values.
 * This creates a new object with only the defined properties.
 * @param obj - Object containing key-value pairs where values may be undefined
 * @returns New object containing only the properties where values are not undefined
 * @example Basic usage
 * ```typescript
 * const obj = {
 *   required: "value",
 *   ...includeIfDefined({
 *     optional1: maybeUndefined1,  // included only if not undefined
 *     optional2: maybeUndefined2,  // included only if not undefined
 *   }),
 * };
 * ```
 * @example Configuration object building
 * ```typescript
 * const config = {
 *   host: "localhost",
 *   port: 3000,
 *   ...includeIfDefined({
 *     ssl: sslEnabled ? sslEnabled.sslConfig : undefined,
 *     auth: authConfig, // may be undefined
 *     timeout: userTimeout, // may be undefined
 *     retries: retryCount, // may be undefined
 *   }),
 * };
 * ```
 * @example Form data processing
 * ```typescript
 * const formData = {
 *   name: data.name,
 *   email: data.email,
 *   ...includeIfDefined({
 *     phone: data.phone ? phone.trim() || undefined,
 *     company : data.company?.trim() || undefined,
 *     website: data.website ? website.startsWith('http') ? data.website  : undefined,
 *   }),
 * };
 * ```
 */
export function includeIfDefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Omits properties with undefined values from an object.
 * This is useful for cleaning up objects before assignment when using exactOptionalPropertyTypes.
 * Note: This only removes undefined values, not other falsy values like null, 0, "", or false.
 * @param obj - The object to clean of undefined properties
 * @returns New object with undefined properties removed
 * @example Basic cleanup
 * ```typescript
 * const cleanObj = omitUndefined({
 *   a: "defined",
 *   b: undefined,    // ❌ removed
 *   c: null,         // ✅ preserved (null ≠ undefined)
 *   d: 0,            // ✅ preserved (falsy but defined)
 *   e: "",           // ✅ preserved (falsy but defined)
 *   f: false,        // ✅ preserved (falsy but defined)
 * });
 * // Result: { a: "defined", c: null, d: 0, e: "", f: false }
 * ```
 * @example API data cleaning
 * ```typescript
 * function sanitizeApiResponse(rawData: any) {
 *   return omitUndefined({
 *     id: rawData.id,
 *     name: rawData.name,
 *     description: rawData.description, // may be undefined
 *     metadata: rawData.metadata,       // may be undefined
 *     createdAt: rawData.created_at,
 *   });
 * }
 * ```
 * @example Before database save
 * ```typescript
 * const userUpdate = omitUndefined({
 *   name: formData.name,
 *   email: formData.email,
 *   avatar: formData.avatar,     // only update if provided
 *   settings: formData.settings, // only update if provided
 * });
 * ```
 */
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  return includeIfDefined(obj);
}

/**
 * Creates an object with conditional properties based on boolean conditions.
 * Each condition is checked and only truthy conditions include their corresponding properties.
 * @param conditions - Object where keys are boolean conditions (as strings) and values are objects to include
 * @returns Object containing properties from all truthy conditions
 * @example Basic conditional properties
 * ```typescript
 * const obj = {
 *   always: "included",
 *   ...conditionalProps({
 *     [String(isEnabled)]: { feature: "enabled" },
 *     [String(hasPermission)]: { admin: true },
 *   }),
 * };
 * ```
 * @example Feature flags
 * ```typescript
 * const config = {
 *   baseUrl: "https://api.example.com",
 *   ...conditionalProps({
 *     [String(enableLogging)]: { logging: { level: "debug" } },
 *     [String(enableMetrics)]: { metrics: { endpoint: "/metrics" } },
 *     [String(enableAuth)]: { auth: { provider: "oauth" } },
 *   }),
 * };
 * ```
 * @example User permission-based UI
 * ```typescript
 * const uiConfig = {
 *   showProfile: true,
 *   ...conditionalProps({
 *     [String(user.isAdmin)]: { showAdminPanel: true },
 *     [String(user.isPremium)]: { showPremiumFeatures: true },
 *     [String(user.canEdit)]: { showEditTools: true },
 *   }),
 * };
 * ```
 */
export function conditionalProps(
  conditions: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [condition, props] of Object.entries(conditions)) {
    if (condition === "true") {
      Object.assign(result, props);
    }
  }
  return result;
}

/**
 * Type-safe way to pick properties from an object, with undefined handling.
 * Unlike Lodash pick, this preserves exact types and handles undefined values correctly.
 * Only includes properties that exist in the source object.
 * @param obj - The source object to pick properties from
 * @param keys - Array of keys to pick from the object
 * @returns New object containing only the specified properties
 * @example Basic property picking
 * ```typescript
 * const user = { id: 1, name: "John", email: "john@example.com", password: "secret" };
 * const publicUser = pick(user, ['id', 'name', 'email']);
 * // Result: { id: 1, name: "John", email: "john@example.com" }
 * ```
 * @example API response filtering
 * ```typescript
 * function createPublicProfile(fullUser: FullUser) {
 *   return pick(fullUser, [
 *     'id',
 *     'username',
 *     'displayName',
 *     'avatar',
 *     'joinedAt'
 *   ]);
 * }
 * ```
 * @example Configuration subset
 * ```typescript
 * const fullConfig = { host: "localhost", port: 3000, ssl: true, debug: true, secret: "xxx" };
 * const clientConfig = pick(fullConfig, ['host', 'port', 'ssl']);
 * // Result: { host: "localhost", port: 3000, ssl: true }
 * ```
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Type-safe way to omit properties from an object, with undefined handling.
 * Unlike Lodash omit, this preserves exact types and handles undefined values correctly.
 * Creates a new object excluding the specified properties.
 * @param obj - The source object to omit properties from
 * @param keys - Array of keys to omit from the object
 * @returns New object with the specified properties removed
 * @example Remove sensitive data
 * ```typescript
 * const user = { id: 1, name: "John", email: "john@example.com", password: "secret", ssn: "xxx" };
 * const safeUser = omit(user, ['password', 'ssn']);
 * // Result: { id: 1, name: "John", email: "john@example.com" }
 * ```
 * @example Remove internal properties
 * ```typescript
 * function toApiResponse(internalObj: InternalUser) {
 *   return omit(internalObj, [
 *     '_id',
 *     '_version',
 *     '_internal',
 *     'hashedPassword',
 *     'secretKey'
 *   ]);
 * }
 * ```
 * @example Configuration sanitization
 * ```typescript
 * const fullConfig = {
 *   host: "localhost",
 *   port: 3000,
 *   ssl: true,
 *   debug: true,
 *   apiSecret: "xxx",
 *   dbPassword: "yyy"
 * };
 * const publicConfig = omit(fullConfig, ['apiSecret', 'dbPassword']);
 * // Result: { host: "localhost", port: 3000, ssl: true, debug: true }
 * ```
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = {} as Omit<T, K>;
  const keysSet = new Set(keys);
  for (const [key, value] of Object.entries(obj)) {
    if (!keysSet.has(key as K)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}
