import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  dateToUnixTimestamp,
  unixTimestampToDate,
  dateToISOString,
  isoStringToDate,
  isDateInPast,
  isDateInFuture,
  addSeconds,
  subtractSeconds,
  addMinutes,
  subtractMinutes,
  addHours,
  subtractHours,
  addDays,
  subtractDays,
  now,
  normalizeToDate,
  diffInSeconds,
  diffInMinutes,
  diffInHours,
  diffInDays,
  isSameDay,
  formatDateISO,
  formatTimeISO,
} from "../../src/index.js";

describe("datetime utilities", () => {
  describe("Unix timestamp conversion", () => {
    it("should convert Date to Unix timestamp", () => {
      const date = new Date("2023-01-01T00:00:00.000Z");
      const timestamp = dateToUnixTimestamp(date);
      expect(timestamp).toBe(1672531200); // 2023-01-01 00:00:00 UTC in seconds
    });

    it("should convert Unix timestamp to Date", () => {
      const timestamp = 1672531200; // 2023-01-01 00:00:00 UTC
      const date = unixTimestampToDate(timestamp);
      expect(date.toISOString()).toBe("2023-01-01T00:00:00.000Z");
    });

    it("should be reversible", () => {
      const originalDate = new Date("2023-06-15T12:30:45.123Z");
      const timestamp = dateToUnixTimestamp(originalDate);
      const convertedDate = unixTimestampToDate(timestamp);

      // Should be the same to the second (milliseconds are lost in Unix timestamp)
      expect(Math.floor(convertedDate.getTime() / 1000)).toBe(
        Math.floor(originalDate.getTime() / 1000),
      );
    });
  });

  describe("ISO string conversion", () => {
    it("should convert Date to ISO string", () => {
      const date = new Date("2023-01-01T12:30:45.123Z");
      const isoString = dateToISOString(date);
      expect(isoString).toBe("2023-01-01T12:30:45.123Z");
    });

    it("should convert ISO string to Date", () => {
      const isoString = "2023-01-01T12:30:45.123Z";
      const date = isoStringToDate(isoString);
      expect(date.toISOString()).toBe(isoString);
    });
  });

  describe("Date validation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-15T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should identify dates in the past", () => {
      const pastDate = new Date("2023-06-15T11:59:59.999Z");
      expect(isDateInPast(pastDate)).toBe(true);
    });

    it("should identify dates in the future", () => {
      const futureDate = new Date("2023-06-15T12:00:00.001Z");
      expect(isDateInFuture(futureDate)).toBe(true);
    });

    it("should handle current time correctly", () => {
      const currentDate = new Date("2023-06-15T12:00:00.000Z");
      expect(isDateInPast(currentDate)).toBe(false);
      expect(isDateInFuture(currentDate)).toBe(false);
    });
  });

  describe("Date arithmetic", () => {
    const baseDate = new Date("2023-01-01T12:00:00.000Z");

    it("should add seconds", () => {
      const result = addSeconds(baseDate, 30);
      expect(result.toISOString()).toBe("2023-01-01T12:00:30.000Z");
    });

    it("should subtract seconds", () => {
      const result = subtractSeconds(baseDate, 30);
      expect(result.toISOString()).toBe("2023-01-01T11:59:30.000Z");
    });

    it("should add minutes", () => {
      const result = addMinutes(baseDate, 15);
      expect(result.toISOString()).toBe("2023-01-01T12:15:00.000Z");
    });

    it("should subtract minutes", () => {
      const result = subtractMinutes(baseDate, 15);
      expect(result.toISOString()).toBe("2023-01-01T11:45:00.000Z");
    });

    it("should add hours", () => {
      const result = addHours(baseDate, 3);
      expect(result.toISOString()).toBe("2023-01-01T15:00:00.000Z");
    });

    it("should subtract hours", () => {
      const result = subtractHours(baseDate, 3);
      expect(result.toISOString()).toBe("2023-01-01T09:00:00.000Z");
    });

    it("should add days", () => {
      const result = addDays(baseDate, 2);
      expect(result.toISOString()).toBe("2023-01-03T12:00:00.000Z");
    });

    it("should subtract days", () => {
      const result = subtractDays(baseDate, 2);
      expect(result.toISOString()).toBe("2022-12-30T12:00:00.000Z");
    });
  });

  describe("now function", () => {
    it("should return current date", () => {
      const before = Date.now();
      const nowDate = now();
      const after = Date.now();

      expect(nowDate.getTime()).toBeGreaterThanOrEqual(before);
      expect(nowDate.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("normalizeToDate", () => {
    it("should return Date objects unchanged", () => {
      const date = new Date("2023-01-01T12:00:00.000Z");
      const result = normalizeToDate(date);
      expect(result).toBe(date); // Should be the same reference
    });

    it("should convert ISO strings to Date objects", () => {
      const isoString = "2023-01-01T12:00:00.000Z";
      const result = normalizeToDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });
  });

  describe("Date differences", () => {
    const date1 = new Date("2023-01-01T12:00:00.000Z");
    const date2 = new Date("2023-01-01T12:01:30.000Z"); // 90 seconds later

    it("should calculate difference in seconds", () => {
      expect(diffInSeconds(date2, date1)).toBe(90);
      expect(diffInSeconds(date1, date2)).toBe(-90);
    });

    it("should calculate difference in minutes", () => {
      expect(diffInMinutes(date2, date1)).toBe(1); // Floor of 1.5 minutes
      expect(diffInMinutes(date1, date2)).toBe(-2); // Floor of -1.5 is -2
    });

    it("should calculate difference in hours", () => {
      const date3 = new Date("2023-01-01T15:30:00.000Z"); // 3.5 hours later
      expect(diffInHours(date3, date1)).toBe(3); // Floor of 3.5 hours
      expect(diffInHours(date1, date3)).toBe(-4); // Floor of -3.5 is -4
    });

    it("should calculate difference in days", () => {
      const date3 = new Date("2023-01-03T06:00:00.000Z"); // 1.75 days later
      expect(diffInDays(date3, date1)).toBe(1); // Floor of 1.75 days
      expect(diffInDays(date1, date3)).toBe(-2); // Floor of -1.75 is -2
    });
  });

  describe("isSameDay", () => {
    it("should identify same calendar day", () => {
      const date1 = new Date("2023-01-01T08:00:00.000Z");
      const date2 = new Date("2023-01-01T20:00:00.000Z");
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it("should identify different calendar days", () => {
      const date1 = new Date("2023-01-01T23:59:59.999Z");
      const date2 = new Date("2023-01-02T00:00:00.000Z");
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it("should handle different years", () => {
      const date1 = new Date("2022-12-31T12:00:00.000Z");
      const date2 = new Date("2023-01-01T12:00:00.000Z");
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe("Formatting functions", () => {
    const testDate = new Date("2023-01-15T09:30:45.123Z");

    it("should format date as ISO date string", () => {
      expect(formatDateISO(testDate)).toBe("2023-01-15");
    });

    it("should return empty string when date split has no date segment", () => {
      const weirdDate = {
        toISOString: () =>
          ({
            split: () => [],
          }) as unknown as string,
      } as Date;

      expect(formatDateISO(weirdDate)).toBe("");
    });

    it("should format time as ISO time string", () => {
      expect(formatTimeISO(testDate)).toBe("09:30:45");
    });
  });
});
