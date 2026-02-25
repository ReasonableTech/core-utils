# Code Architecture & Structure Principles

## Dependency Lifecycle Management

**Different application types require different dependency lifetime patterns:**

### Long-running Services (Web servers, desktop apps)

Create **application-scoped instances** that live for the entire application lifetime:

```typescript
class Application {
  private readonly services: {
    database: DatabaseService;
    cache: CacheService;
    logger: Logger;
  };

  constructor() {
    this.services = {
      logger: createLogger(LogLevel.INFO),
      database: new DatabaseService(),
      cache: new CacheService(),
    };
  }

  async start(): Promise<void> {
    await this.services.database.connect();
    const userController = new UserController(
      this.services.database,
      this.services.logger,
    );
    this.setupRoutes(userController);
  }
}
```

### Short-lived CLI Commands

Create **command-scoped instances** that are created, used, and disposed per execution:

```typescript
class CLIApplication {
  async executeCommand(commandName: string, args: string[]): Promise<void> {
    // Create fresh instances for this command execution
    const logger = createLogger(LogLevel.ERROR);
    const fileProcessor = new FileProcessor(logger);

    const command = this.createCommand(commandName, fileProcessor, logger);

    try {
      await command.execute(args);
    } finally {
      await fileProcessor.cleanup();
    }
  }
}
```

### Key Principles

- **Application-scoped:** Database connections, cache managers, configuration, shared loggers
- **Command-scoped:** File processors, validation services, HTTP clients, temporary stores
- **Testing:** Always inject mock dependencies using the same pattern as production

## Service Architecture Requirements

Services should be fully typed with branded types for domain IDs, Result types for error handling, readonly properties, and proper generic constraints.

**MANDATORY**: All service interfaces must be fully typed with:

- Branded types for domain IDs
- Result types for error handling
- Readonly properties where appropriate
- Proper generic constraints

When creating new services, update the README in the `services` directory to document the service's purpose and functionality.

**See [ESLint Rule Antipatterns](./eslint-rule-antipatterns.md#antipattern-6-dependency-bundling-god-objects) for detailed examples and migration guides on dependency injection patterns.**

## Build vs Typecheck Boundaries

- Build outputs must be reproducible in CI; never depend on `dist` for typechecking.
- Keep build tsconfigs source-only; tests and tool configs belong to separate typecheck flows.
- Use `tsup` for bundling, then emit declarations with `tsc --emitDeclarationOnly`.

## Logging

Use structured logging for all log output in your application:

> **Note**: Use a structured logging library appropriate for your application. Avoid `console.log()` or other console methods directly except for quick debugging.

```typescript
// Basic logging - use your application's structured logger
logger.debug("Debug information");
logger.info("Informational message");
logger.warn("Warning message");
logger.error("Error message");

// Tagged logging (recommended)
logger.debug("auth", "User authentication started");
logger.info("database", "Connection established");
logger.warn("api", "Rate limit approaching");
logger.error("network", "Connection failed");

// Context logging (preferred for debugging)
logger.info("auth", "User logged in successfully", {
  userId: "user123",
  loginMethod: "oauth",
  timestamp: Date.now(),
});

logger.error("database", "Query execution failed", {
  query: "SELECT * FROM users",
  duration: 5000,
  connectionId: "conn_456",
});
```

## Documentation

Every single API must be documented. No exceptions. Use TSDoc comments. To the best of your ability, do not write redundant doc comments. Consider the implications of an API and the hidden preconditions that may not be immediately obvious to the user of the API.

When documenting APIs, include:

- A brief description of what the API does.
- Parameters with their types and descriptions.
- Return types with descriptions.
- Examples of usage when applicable.
