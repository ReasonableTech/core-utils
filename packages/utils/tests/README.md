# @reasonabletech/utils Test Suite

## Test Structure

- `unit/` - Component isolation tests
- `integration/` - Component interaction tests
- `e2e/` - Complete workflow tests

## Running Tests

```bash
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests only
pnpm test:e2e         # E2E tests only
pnpm test             # All tests
```

## Test Categories

### Unit Tests

Tests that verify individual components in complete isolation:

- Services: Business logic, data transformations
- Repositories: Database operations, CRUD functionality
- Controllers: Request handling, response formatting
- Utilities: Pure functions, helper methods

### Integration Tests

Tests that verify interactions between multiple components:

- API Routes: HTTP endpoints with middleware
- Service Integration: Cross-service communication
- Database Integration: Repository + service interactions
- External APIs: Third-party service integrations

### E2E Tests

Tests that verify complete user workflows:

- User Journeys: Full feature workflows
- System Workflows: Complete business processes
- API Workflows: Multi-endpoint interactions

## Adding New Tests

1. Place tests in the appropriate tier directory (`unit/`, `integration/`, `e2e/`)
2. Use package import aliases, not relative paths
3. Follow the naming convention: `{component-name}.test.ts`
4. Include proper setup and teardown in test files
5. Ensure tests meet coverage requirements for the component type
