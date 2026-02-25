/**
 * Date/Time Utility Functions
 *
 * This module provides standardized date/time handling utilities for the `@reasonabletech` platform.
 * It ensures consistent use of Date objects internally while providing standard conversions
 * when required by specifications or APIs.
 *
 * Key principles:
 * - Use Date objects for all internal date/time representations
 * - Only convert to strings/numbers when required by external specs/APIs
 * - Provide clear, descriptive function names
 * - Handle edge cases gracefully
 */

/**
 * Converts a Date object to Unix timestamp (seconds since epoch)
 * @param date - The Date object to convert
 * @returns Unix timestamp in seconds
 */
export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Converts a Unix timestamp (seconds since epoch) to a Date object
 * @param timestamp - Unix timestamp in seconds
 * @returns Date object
 */
export function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Converts a Date object to ISO string
 * @param date - The Date object to convert
 * @returns ISO string representation
 */
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Converts an ISO string to a Date object
 * @param isoString - ISO string representation
 * @returns Date object
 */
export function isoStringToDate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Checks if a Date object represents a time in the past
 * @param date - The Date object to check
 * @returns true if the date is in the past
 */
export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Checks if a Date object represents a time in the future
 * @param date - The Date object to check
 * @returns true if the date is in the future
 */
export function isDateInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Adds seconds to a Date object
 * @param date - The base Date object
 * @param seconds - Number of seconds to add
 * @returns New Date object with added seconds
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + (seconds * 1000));
}

/**
 * Subtracts seconds from a Date object
 * @param date - The base Date object
 * @param seconds - Number of seconds to subtract
 * @returns New Date object with subtracted seconds
 */
export function subtractSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() - (seconds * 1000));
}

/**
 * Adds minutes to a Date object
 * @param date - The base Date object
 * @param minutes - Number of minutes to add
 * @returns New Date object with added minutes
 */
export function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60);
}

/**
 * Subtracts minutes from a Date object
 * @param date - The base Date object
 * @param minutes - Number of minutes to subtract
 * @returns New Date object with subtracted minutes
 */
export function subtractMinutes(date: Date, minutes: number): Date {
  return subtractSeconds(date, minutes * 60);
}

/**
 * Adds hours to a Date object
 * @param date - The base Date object
 * @param hours - Number of hours to add
 * @returns New Date object with added hours
 */
export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

/**
 * Subtracts hours from a Date object
 * @param date - The base Date object
 * @param hours - Number of hours to subtract
 * @returns New Date object with subtracted hours
 */
export function subtractHours(date: Date, hours: number): Date {
  return subtractMinutes(date, hours * 60);
}

/**
 * Adds days to a Date object
 * @param date - The base Date object
 * @param days - Number of days to add
 * @returns New Date object with added days
 */
export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

/**
 * Subtracts days from a Date object
 * @param date - The base Date object
 * @param days - Number of days to subtract
 * @returns New Date object with subtracted days
 */
export function subtractDays(date: Date, days: number): Date {
  return subtractHours(date, days * 24);
}

/**
 * Gets the current Date object
 * @returns Current Date object
 */
export function now(): Date {
  return new Date();
}

/**
 * Converts a Date | string union to a Date object
 * This is a utility to help with migration from Date | string patterns
 * @param dateOrString - Date object or ISO string
 * @returns Date object
 */
export function normalizeToDate(dateOrString: Date | string): Date {
  if (dateOrString instanceof Date) {
    return dateOrString;
  }
  return isoStringToDate(dateOrString);
}

/**
 * Calculates the difference between two dates in seconds
 * @param laterDate - The later date
 * @param earlierDate - The earlier date
 * @returns Difference in seconds (positive if laterDate is after earlierDate)
 */
export function diffInSeconds(laterDate: Date, earlierDate: Date): number {
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / 1000);
}

/**
 * Calculates the difference between two dates in minutes
 * @param laterDate - The later date
 * @param earlierDate - The earlier date
 * @returns Difference in minutes (positive if laterDate is after earlierDate)
 */
export function diffInMinutes(laterDate: Date, earlierDate: Date): number {
  return Math.floor(diffInSeconds(laterDate, earlierDate) / 60);
}

/**
 * Calculates the difference between two dates in hours
 * @param laterDate - The later date
 * @param earlierDate - The earlier date
 * @returns Difference in hours (positive if laterDate is after earlierDate)
 */
export function diffInHours(laterDate: Date, earlierDate: Date): number {
  return Math.floor(diffInMinutes(laterDate, earlierDate) / 60);
}

/**
 * Calculates the difference between two dates in days
 * @param laterDate - The later date
 * @param earlierDate - The earlier date
 * @returns Difference in days (positive if laterDate is after earlierDate)
 */
export function diffInDays(laterDate: Date, earlierDate: Date): number {
  return Math.floor(diffInHours(laterDate, earlierDate) / 24);
}

/**
 * Checks if two dates represent the same day (ignoring time)
 * Uses UTC to avoid timezone issues
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if both dates represent the same calendar day in UTC
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Formats a date as YYYY-MM-DD
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateISO(date: Date): string {
  const parts = date.toISOString().split("T");
  return parts[0] ?? "";
}

/**
 * Formats a date as HH:MM:SS
 * @param date - The date to format
 * @returns Time string in HH:MM:SS format
 */
export function formatTimeISO(date: Date): string {
  const parts = date.toISOString().split("T");
  const timePart = parts[1];
  const timeOnly = timePart.split(".")[0];
  return timeOnly;
}
