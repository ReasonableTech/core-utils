import { vi } from "vitest";

import { TEST_FIXTURES } from "../fixtures/common.js";

/**
 * Mock Date constructor for consistent testing.
 * @param isoString - ISO string to use as mock date
 * @returns Mocked date
 */
export function mockDate(
  isoString: string = TEST_FIXTURES.DATES.VALID_ISO,
): Date {
  const fixedDate = new Date(isoString);
  vi.spyOn(global, "Date").mockImplementation((...args: unknown[]) => {
    if (args.length === 0) {
      return fixedDate;
    }
    return new Date(...(args as ConstructorParameters<typeof Date>));
  });
  return fixedDate;
}
