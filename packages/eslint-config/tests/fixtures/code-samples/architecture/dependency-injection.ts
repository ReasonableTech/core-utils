/**
 * Code fixtures for dependency injection rule testing
 *
 * FIXTURE: Pure test data — code samples demonstrating violations and correct patterns.
 * These strings are linted by integration tests; they are not executed.
 */

/**
 * Violation: static getInstance() singleton pattern
 *
 * Singletons hide dependencies, make testing difficult, and create
 * implicit coupling. Services should be injected, not fetched from
 * a global access point.
 */
export const getInstanceViolation = `
class UserService {
  private static instance;
  static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }
}
`;

/**
 * Violation: creating dependencies inside constructor with new
 *
 * When a service creates its own dependencies, it becomes impossible to
 * substitute test doubles and tightly couples the service to concrete
 * implementations.
 */
export const newInConstructorViolation = `
class UserService {
  constructor(config) {
    this.db = new Database(config);
  }
}
`;

/**
 * Correct: dependencies injected via constructor parameters
 *
 * Each dependency is explicit, independently mockable, and visible
 * in the constructor signature.
 */
export const injectedDependencyCorrect = `
class UserService {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }
}
`;

/**
 * Correct: standalone factory function (no singleton, no constructor new)
 *
 * Factory functions are fine — they don't use getInstance() and they
 * don't create dependencies inside a constructor.
 */
export const factoryFunctionCorrect = `
function createService(db, logger) {
  return { db, logger };
}
`;

/**
 * Correct: using built-in constructors inside a constructor
 *
 * Built-in types like Map, Set, Date are not service dependencies —
 * they are standard data structures and value types that don't need injection.
 */
export const builtinNewInConstructorCorrect = `
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Set();
    this.createdAt = new Date();
  }
}
`;

/**
 * Correct: default parameter value with new expression
 *
 * Default parameter values are fine because the dependency CAN still be
 * injected — the new expression only runs when no argument is provided.
 * This is the recommended pattern for optional dependencies.
 */
export const defaultParamNewInConstructorCorrect = `
class UserService {
  constructor(private db: Database = new Database()) {}
}
`;
