/**
 * Architecture Pattern Rules Examples
 *
 * This file demonstrates the architecture pattern rules and shows both
 * forbidden patterns and correct alternatives.
 */

// ❌ FORBIDDEN: Bundling dependencies into god objects
// This will trigger the "no-restricted-syntax" error
/*
interface ServiceDependencies {
  logger: Logger;
  database: Database;
  cache: CacheService;
  config: ServiceConfig;
}

class UserService {
  constructor(private deps: ServiceDependencies) {}

  async createUser(data: UserData) {
    this.deps.logger.info("Creating user");
    await this.deps.database.save(data);
  }
}
*/

// ❌ ALSO FORBIDDEN: Type alias with Dependencies suffix
/*
type DatabaseDependencies = {
  connection: Connection;
  pool: ConnectionPool;
  logger: Logger;
};
*/

// ✅ CORRECT: Individual dependency injection
interface Logger {
  info(message: string): void;
  error(message: string, error: Error): void;
}

interface Database {
  save(data: unknown): Promise<void>;
  find(id: string): Promise<unknown>;
}

interface CacheService {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

interface ServiceConfig {
  maxRetries: number;
  timeout: number;
}

interface UserData {
  name: string;
  email: string;
}

/**
 * ✅ CORRECT: Service with individual dependencies
 *
 * Benefits:
 * - Clear dependency requirements
 * - Easy to test (mock individual dependencies)
 * - No god objects
 * - Follows single responsibility principle
 */
class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database,
    private readonly cache: CacheService,
    private readonly config: ServiceConfig,
  ) {}

  async createUser(data: UserData): Promise<void> {
    this.logger.info("Creating user");
    await this.database.save(data);
    await this.cache.set(`user:${data.email}`, data);
  }

  async getUser(id: string): Promise<unknown> {
    // Try cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const user = await this.database.find(id);
    await this.cache.set(`user:${id}`, user);
    return user;
  }
}

/**
 * ✅ CORRECT: Optional configuration is OK as optional parameter
 *
 * Optional dependencies can be optional constructor parameters.
 * Only required dependencies should be required parameters.
 */
class EmailService {
  constructor(
    private readonly logger: Logger,
    private readonly config: ServiceConfig = { maxRetries: 3, timeout: 5000 },
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.info(`Sending email to ${to}`);
    // Implementation...
  }
}

// ✅ CORRECT: Factory pattern for complex initialization
class ServiceFactory {
  static createUserService(
    logger: Logger,
    database: Database,
    cache: CacheService,
    config: ServiceConfig,
  ): UserService {
    return new UserService(logger, database, cache, config);
  }

  static createEmailService(logger: Logger): EmailService {
    return new EmailService(logger);
  }
}

// Example usage
const logger: Logger = {
  info: (msg) => console.log(msg),
  error: (msg, err) => console.error(msg, err),
};

const database: Database = {
  save: async (data) => {
    console.log("Saved:", data);
  },
  find: async (id) => ({ id, name: "Test User" }),
};

const cache: CacheService = {
  get: async (key) => null,
  set: async (key, value) => {
    console.log("Cached:", key, value);
  },
};

const config: ServiceConfig = {
  maxRetries: 3,
  timeout: 5000,
};

// ✅ CORRECT: Explicit dependency injection
const userService = new UserService(logger, database, cache, config);
const emailService = new EmailService(logger);

// ✅ CORRECT: Using factory
const factoryUserService = ServiceFactory.createUserService(
  logger,
  database,
  cache,
  config,
);
