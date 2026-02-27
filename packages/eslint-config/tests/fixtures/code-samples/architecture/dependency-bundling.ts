/**
 * Code fixtures for dependency bundling rule testing
 *
 * FIXTURE: Pure test data - code samples demonstrating violations and correct patterns
 */

/**
 * Dependency bundling violation using *Dependencies interface suffix.
 *
 * This pattern is discouraged because bundling dependencies into a single
 * object parameter (deps, dependencies) creates god objects that obscure
 * actual dependencies and make testing harder. It's unclear from the
 * constructor signature what the service actually needs, and mocking
 * requires creating the entire bundle even when testing code that only
 * uses one dependency.
 */
export const dependenciesInterfaceViolation = `
interface ServiceDependencies {
  logger: Logger;
  database: Database;
  cache: Cache;
}

class UserService {
  constructor(private deps: ServiceDependencies) {}
}
`;

/**
 * Dependency bundling violation using *Deps interface suffix.
 *
 * This pattern has the same problems as *Dependencies - it bundles multiple
 * dependencies into a single parameter. Using "Deps" instead of "Dependencies"
 * doesn't make the pattern any better. Individual parameters make dependencies
 * explicit and allow selective mocking in tests.
 */
export const depsInterfaceViolation = `
interface ServiceDeps {
  logger: Logger;
  database: Database;
}

function createService(deps: ServiceDeps) {
  return new Service(deps.logger, deps.database);
}
`;

/**
 * Dependency bundling violation using type alias with Dependencies suffix.
 *
 * This pattern is discouraged for the same reason as interface dependencies -
 * using a type alias instead of an interface doesn't change the fundamental
 * problem of bundling dependencies. The implementation details (interface vs
 * type alias) don't affect the architectural issue.
 */
export const dependenciesTypeAliasViolation = `
type AuthDependencies = {
  apiKeyService: ApiKeyService;
  tokenService: TokenService;
};

function initializeAuth(deps: AuthDependencies) {
  // Implementation
}
`;

/**
 * Correct dependency injection using individual constructor parameters.
 *
 * This pattern makes dependencies explicit in the constructor signature.
 * Each dependency is a separate parameter, making it immediately clear what
 * the service needs. Tests can mock individual dependencies without creating
 * a full bundle object, and TypeScript enforces that all required dependencies
 * are provided at construction time.
 */
export const individualParametersCorrect = `
class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly cache: Cache,
  ) {}
}
`;

/**
 * Correct usage of Config and Options interfaces for configuration data.
 *
 * Config and Options interfaces are allowed because they represent
 * configuration data (settings, flags, values), not service dependencies.
 * Configuration is fundamentally different from dependencies - it's data
 * that parameterizes behavior, not collaborating services. Bundling config
 * values into an object is appropriate and doesn't create the same testing
 * or clarity problems as bundling dependencies.
 */
export const configInterfaceCorrect = `
interface ServiceConfig {
  apiKey: string;
  timeout: number;
  retryCount: number;
}

interface ServiceOptions {
  enableCaching: boolean;
  logLevel: string;
}

class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly config: ServiceConfig,
    private readonly options?: ServiceOptions,
  ) {}
}
`;
