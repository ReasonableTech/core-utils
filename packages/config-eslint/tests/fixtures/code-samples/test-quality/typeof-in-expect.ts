/**
 * Code fixtures for no-typeof-in-expect rule testing
 *
 * FIXTURE: Pure test data — code samples demonstrating violations and correct patterns.
 * These strings are linted by integration tests; they are not executed.
 */

/**
 * Violation: expect(typeof fn).toBe("function")
 *
 * Checks that an identifier is a function. TypeScript already guarantees this
 * statically. The test always passes as long as the import resolves and adds
 * zero regression protection.
 */
export const typeofFunctionViolation = `
const close = () => {};
expect(typeof close).toBe("function");
`;

/**
 * Violation: expect(typeof obj).toBe("object")
 *
 * Same problem with objects — typeof only confirms that JavaScript sees a
 * non-null, non-primitive value. It never verifies any real behaviour.
 */
export const typeofObjectViolation = `
const db = { query: () => {} };
expect(typeof db).toBe("object");
`;

/**
 * Violation: expect(typeof x).toEqual("string")
 *
 * The ban applies to all matchers, not just toBe.
 */
export const typeofToEqualViolation = `
const name = "Alice";
expect(typeof name).toEqual("string");
`;

/**
 * Violation: expect(typeof x).toStrictEqual("number")
 */
export const typeofToStrictEqualViolation = `
const count = 42;
expect(typeof count).toStrictEqual("number");
`;

/**
 * Correct: asserting actual return value of a function call.
 *
 * Calling the function and asserting what it returns proves behaviour;
 * checking typeof never does.
 */
export const assertReturnValueCorrect = `
async function close() { return true; }
const result = await close();
expect(result).toBe(true);
`;

/**
 * Correct: asserting object shape via toMatchObject.
 *
 * Verifies that the object has the fields a consumer depends on, not merely
 * that JavaScript considers it an object.
 */
export const assertObjectShapeCorrect = `
const db = { query: () => Promise.resolve([]) };
expect(db).toMatchObject({ query: expect.any(Function) });
`;

/**
 * Correct: using toBeInstanceOf for class instances.
 *
 * Proves the value is the right kind of object, not just any object.
 */
export const instanceofCheckCorrect = `
class MyService {}
const svc = new MyService();
expect(svc).toBeInstanceOf(MyService);
`;
