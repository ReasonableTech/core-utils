import { describe, it, expect } from "vitest";
import {
  capitalize,
  truncateString,
  isEmptyString,
  isNonEmptyString,
  encodeBase64Url,
  decodeBase64Url,
  isValidBase64Url,
  getErrorMessage,
} from "../../src/string.js";

describe("capitalize", () => {
  it("should capitalize the first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("should handle single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("should not affect already capitalized strings", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });
});

describe("truncateString", () => {
  it("should truncate strings longer than maxLength", () => {
    expect(truncateString("hello world", 8)).toBe("hello...");
  });

  it("should not truncate strings shorter than maxLength", () => {
    expect(truncateString("hello", 10)).toBe("hello");
  });

  it("should handle exact length strings", () => {
    expect(truncateString("hello", 5)).toBe("hello");
  });
});

describe("isEmptyString", () => {
  it("should return true for null", () => {
    expect(isEmptyString(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isEmptyString(undefined)).toBe(true);
  });

  it("should return true for empty string", () => {
    expect(isEmptyString("")).toBe(true);
  });

  it("should return true for whitespace only", () => {
    expect(isEmptyString("   ")).toBe(true);
  });

  it("should return false for non-empty string", () => {
    expect(isEmptyString("hello")).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  it("should return false for null", () => {
    expect(isNonEmptyString(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  it("should return false for whitespace only", () => {
    expect(isNonEmptyString("   ")).toBe(false);
  });

  it("should return true for non-empty string", () => {
    expect(isNonEmptyString("hello")).toBe(true);
  });
});

describe("base64url", () => {
  describe("encodeBase64Url", () => {
    it("should encode strings to base64url", () => {
      const encoded = encodeBase64Url("hello world");
      expect(isValidBase64Url(encoded)).toBe(true);
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    });

    it("should encode buffers to base64url", () => {
      const buffer = Buffer.from("hello world");
      const encoded = encodeBase64Url(buffer);
      expect(isValidBase64Url(encoded)).toBe(true);
    });
  });

  describe("decodeBase64Url", () => {
    it("should decode base64url strings", () => {
      const original = "hello world";
      const encoded = encodeBase64Url(original);
      const decoded = decodeBase64Url(encoded);
      expect(decoded.toString("utf8")).toBe(original);
    });

    it("should handle strings without padding", () => {
      const encoded = "aGVsbG8gd29ybGQ"; // "hello world" without padding
      const decoded = decodeBase64Url(encoded);
      expect(decoded.toString("utf8")).toBe("hello world");
    });
  });

  describe("isValidBase64Url", () => {
    it("should return true for valid base64url", () => {
      expect(isValidBase64Url("aGVsbG8gd29ybGQ")).toBe(true);
      expect(isValidBase64Url("abc123-_")).toBe(true);
    });

    it("should return false for invalid base64url", () => {
      expect(isValidBase64Url("hello+world")).toBe(false);
      expect(isValidBase64Url("hello/world")).toBe(false);
      expect(isValidBase64Url("hello=world")).toBe(false);
    });
  });
});

describe("getErrorMessage", () => {
  it("should extract message from Error objects", () => {
    const error = new Error("Something went wrong");
    expect(getErrorMessage(error)).toBe("Something went wrong");
  });

  it("should return string errors directly", () => {
    expect(getErrorMessage("Error message")).toBe("Error message");
  });

  it("should extract message from error-like objects", () => {
    const errorLike = { message: "Custom error" };
    expect(getErrorMessage(errorLike)).toBe("Custom error");
  });

  it("should handle objects with non-string message property", () => {
    const errorObj = { message: 123 };
    expect(getErrorMessage(errorObj)).toBe("[object Object]");
  });

  it("should convert numbers to strings", () => {
    expect(getErrorMessage(42)).toBe("42");
  });

  it("should convert boolean to strings", () => {
    expect(getErrorMessage(true)).toBe("true");
    expect(getErrorMessage(false)).toBe("false");
  });

  it("should handle null", () => {
    expect(getErrorMessage(null)).toBe("null");
  });

  it("should handle undefined", () => {
    expect(getErrorMessage(undefined)).toBe("undefined");
  });

  it("should handle objects without message property", () => {
    const obj = { code: "ERR_123" };
    expect(getErrorMessage(obj)).toBe("[object Object]");
  });

  it("should handle TypeError with message", () => {
    const error = new TypeError("Type error occurred");
    expect(getErrorMessage(error)).toBe("Type error occurred");
  });

  it("should handle custom Error subclasses", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("Custom error message");
    expect(getErrorMessage(error)).toBe("Custom error message");
  });
});
