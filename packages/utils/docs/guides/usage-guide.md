# @reasonabletech/utils Usage Guide

This guide covers canonical usage patterns for shared utility helpers in greenfield packages and applications.

## Installation

```bash
pnpm add @reasonabletech/utils
```

## Quick Start

```ts
import { err, ok, type Result } from "@reasonabletech/utils";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}
```

## Core Use Cases

### Result-Based Error Handling

```ts
import { andThen, err, ok, type Result } from "@reasonabletech/utils";

function parseId(input: string): Result<number, string> {
  const parsed = Number(input);
  return Number.isInteger(parsed) ? ok(parsed) : err("Invalid ID");
}

const result = andThen(parseId("42"), (id) => ok({ id }));
```

### Retry Helpers

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

## Subpath Imports

Use subpaths when you want narrower imports:

- `@reasonabletech/utils/result`
- `@reasonabletech/utils/datetime`
- `@reasonabletech/utils/object`
- `@reasonabletech/utils/string`
- `@reasonabletech/utils/retry`

## Troubleshooting

### `Result` shape confusion

The shared `Result` type uses `success` + `value`/`error` fields. Prefer helper functions (`ok`, `err`, `isSuccess`, `isFailure`) instead of creating objects manually.

## Related Documentation

- [Package Docs Index](../README.md)
- [Utility Function Reference](../utility-functions.md)
- [Package README](../../README.md)
