/**
 * Code fixtures for type safety (any casts) rule testing
 *
 * FIXTURE: Pure test data - code samples demonstrating violations and correct patterns
 */

/**
 * Type safety violation using 'as any' cast.
 *
 * This pattern completely bypasses TypeScript's type checking by casting a
 * value to the 'any' type. Once a value is 'any', TypeScript allows any
 * operation on it without validation. This creates runtime errors that could
 * have been caught at compile time. Using 'as any' destroys type safety and
 * should be replaced with proper type assertions or type guards.
 */
export const asAnyCastViolation = `
const response = await fetch("/api/data");
const data = response as any;
return data.result;
`;

/**
 * Type safety violation using double cast through 'any'.
 *
 * This pattern is even more dangerous than a simple 'as any' because it
 * explicitly casts through 'any' as an intermediate step to bypass type
 * compatibility checking. This circumvents TypeScript's protection against
 * incompatible type casts. If you need to cast between unrelated types, the
 * proper solution is to use type guards or redesign the types.
 */
export const doubleCastThroughAnyViolation = `
const response = await fetch("/api/data");
const data = (response as any) as User;
return data;
`;

/**
 * Type safety violation using 'any' in type annotations.
 *
 * This pattern declares both parameters and return types as 'any', completely
 * disabling type checking for the function. TypeScript can't validate how the
 * function is called or used. This makes refactoring dangerous and hides bugs
 * that would otherwise be caught at compile time. Use specific types or
 * generic type parameters instead.
 */
export const anyTypeAnnotationViolation = `
function processData(input: any): any {
  return input.value;
}
`;

/**
 * Type safety violation using Array<any>.
 *
 * This pattern declares an array that can contain values of any type, which
 * defeats the purpose of static typing. Operations on array elements aren't
 * type-checked, and TypeScript can't help prevent runtime errors. Use specific
 * types (Array<string>), generic parameters (Array<T>), or union types
 * (Array<string | number>) instead.
 */
export const arrayAnyViolation = `
function processList(items: Array<any>): void {
  items.forEach(item => console.log(item));
}
`;

/**
 * Correct type assertion using a specific type.
 *
 * This pattern uses a type assertion to tell TypeScript the specific type of
 * a value when you have information that the type checker doesn't. This is
 * safe when the assertion is accurate and the types are compatible. Type
 * assertions should be used sparingly and only when you're certain about the
 * actual type at runtime.
 */
export const properTypeAssertionCorrect = `
const response = await fetch("/api/data");
const data = response as Response;
return data;
`;

/**
 * Correct type narrowing using 'unknown' with type guards.
 *
 * This pattern starts with 'unknown' (the type-safe version of 'any') and
 * uses runtime checks (type guards) to narrow to specific types. TypeScript
 * understands typeof checks and custom type predicates, allowing type-safe
 * operations after validation. This provides runtime safety with compile-time
 * checking.
 */
export const unknownWithTypeGuardCorrect = `
function processData(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  if (isUserData(input)) {
    return input.name;
  }
  throw new Error("Invalid input");
}
`;

/**
 * Correct usage of generic types for type safety.
 *
 * This pattern uses generic type parameters to maintain type safety while
 * allowing flexibility. Generics let you write reusable code that works with
 * multiple types while preserving type information. The constraint (T extends
 * UserData) ensures the generic type has required properties, providing both
 * flexibility and safety.
 */
export const genericTypesCorrect = `
function processData<T extends UserData>(input: T): string {
  return input.name;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}
`;
