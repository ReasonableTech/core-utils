# @reasonabletech/utils Documentation

Reference documentation for shared runtime utility helpers in the core-utils monorepo.

## Start Here

- [Usage Guide](./guides/usage-guide.md)
- [Utility Function Reference](./utility-functions.md)

## Quick Example

```ts
import { err, ok, type Result } from "@reasonabletech/utils";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

const result = divide(10, 2);
if (result.success) {
  console.log("Result:", result.value);
} else {
  console.error("Error:", result.error);
}
```

## Monorepo Context

- [Package README](../README.md)
- [Architecture](../../../docs/architecture.md) — How packages relate
- [Tooling](../../../docs/tooling.md) — Turbo, Changesets details
- [Contributing](../../../CONTRIBUTING.md)
