# @reasonabletech/utils

[![npm version](https://img.shields.io/npm/v/@reasonabletech/utils.svg)](https://www.npmjs.com/package/@reasonabletech/utils)
[![npm downloads](https://img.shields.io/npm/dm/@reasonabletech/utils.svg)](https://www.npmjs.com/package/@reasonabletech/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`@reasonabletech/utils` provides runtime helpers for Result-based error handling, datetime operations, object construction, string utilities, retries, and async pipelines. It has no external runtime dependencies.

## Installation

```bash
pnpm add @reasonabletech/utils
```

## Requirements

This package has **no peer dependencies** and no external runtime dependencies. It works with any modern JavaScript/TypeScript environment (Node.js >= 22, modern browsers).

## Exported Entry Points

| Import Path                      | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| `@reasonabletech/utils`          | Combined exports for all utility modules           |
| `@reasonabletech/utils/result`   | Result types and combinators                       |
| `@reasonabletech/utils/datetime` | Date and time helpers                              |
| `@reasonabletech/utils/object`   | Object construction and property filtering helpers |
| `@reasonabletech/utils/string`   | String and base64url helpers                       |
| `@reasonabletech/utils/retry`    | Retry and backoff helpers                          |

## Usage

### Result Helpers

`Result<T, E>` represents either a successful value (`ok`) or a typed error (`err`). It avoids thrown exceptions for expected failure cases, making error handling explicit and composable. `andThen` chains operations that may themselves fail.

```ts
import { andThen, err, ok, type Result } from "@reasonabletech/utils";

function parsePort(value: string): Result<number, string> {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? ok(parsed)
    : err("Invalid port");
}

const result = andThen(parsePort("3000"), (port) => ok({ port }));
```

### Retry Helpers

`retryWithBackoff` re-attempts an async operation up to a maximum number of tries, waiting an increasing delay between each attempt. Useful for network calls or external services that may transiently fail.

```ts
import { retryWithBackoff } from "@reasonabletech/utils";

const response = await retryWithBackoff(
  async () => await fetch("https://api.example.com/health"),
  3,
  500,
);
```

### Object Construction Helpers

```ts
import { includeIf, includeIfDefined } from "@reasonabletech/utils";

const payload = {
  name: "core-utils",
  ...includeIf("description", process.env.PKG_DESCRIPTION),
  ...includeIfDefined({
    homepage: process.env.PKG_HOMEPAGE,
    repository: process.env.PKG_REPOSITORY,
  }),
};
```

### Datetime + Async Helpers

```ts
import { addDays, now, pipeAsync } from "@reasonabletech/utils";

const nextWeek = addDays(now(), 7);

const normalized = await pipeAsync(" core-utils ", [
  async (value) => value.trim(),
  async (value) => value.toUpperCase(),
]);
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are documented with migration guides when applicable.

## Additional References

- [Usage Guide](./docs/guides/usage-guide.md)
- [Package Docs](./docs/README.md)
- [Utility Function Docs](./docs/utility-functions.md)
