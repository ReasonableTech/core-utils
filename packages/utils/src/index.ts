/**
 * Shared utility functions and types for the `@reasonabletech` platform
 */

export type { Result, Success, Failure } from "./result.js";
export {
  ok,
  err,
  isSuccess,
  isFailure,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  map,
  mapErr,
  andThen,
  orElse,
  combine,
  fromPromise,
} from "./result.js";

export {
  now,
  dateToISOString,
  dateToUnixTimestamp,
  unixTimestampToDate,
  isoStringToDate,
  normalizeToDate,
  formatDateISO,
  formatTimeISO,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  subtractSeconds,
  subtractMinutes,
  subtractHours,
  subtractDays,
  diffInSeconds,
  diffInMinutes,
  diffInHours,
  diffInDays,
  isSameDay,
  isDateInPast,
  isDateInFuture,
} from "./datetime.js";

export {
  pick,
  omit,
  omitUndefined,
  conditionalProps,
  includeIf,
  includeIfDefined,
} from "./object.js";

export {
  capitalize,
  truncateString,
  isEmptyString,
  isNonEmptyString,
  encodeBase64Url,
  decodeBase64Url,
  isValidBase64Url,
  getErrorMessage,
} from "./string.js";

export type { RetryOptions, RetryResult } from "./retry.js";
export { sleep, retry, retryWithBackoff, retryWithPolling } from "./retry.js";

export { pipeAsync, runSequentially } from "./async.js";

export { isPresent } from "./type-guards.js";
