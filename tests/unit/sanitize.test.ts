import { describe, expect, it } from "vitest";
import { escapeRegExp, isValidObjectId, sanitizeDisplayFilename } from "@/lib/utils/sanitize";

describe("sanitizeDisplayFilename", () => {
  it("strips path traversal segments from a filename", () => {
    expect(sanitizeDisplayFilename("../../etc/passwd")).toBe("passwd");
  });

  it("strips Windows-style path separators", () => {
    expect(sanitizeDisplayFilename("C:\\Users\\evil\\resume.pdf")).toBe("resume.pdf");
  });

  it("strips control characters", () => {
    expect(sanitizeDisplayFilename("resume\x00.pdf")).toBe("resume.pdf");
  });

  it("falls back to a default name when nothing is left", () => {
    expect(sanitizeDisplayFilename("")).toBe("resume.pdf");
  });

  it("truncates excessively long filenames", () => {
    const long = "a".repeat(500) + ".pdf";
    expect(sanitizeDisplayFilename(long).length).toBeLessThanOrEqual(200);
  });
});

describe("escapeRegExp", () => {
  it("escapes regex special characters used in a MongoDB $regex search", () => {
    const malicious = ".*";
    const escaped = escapeRegExp(malicious);
    expect(new RegExp(escaped).test("anything")).toBe(false);
    expect(new RegExp(escaped).test(".*")).toBe(true);
  });
});

describe("isValidObjectId", () => {
  it("accepts a valid 24-character hex ObjectId", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("rejects a path traversal attempt", () => {
    expect(isValidObjectId("../../etc/passwd")).toBe(false);
  });

  it("rejects a MongoDB operator injection attempt", () => {
    expect(isValidObjectId('{"$ne": null}')).toBe(false);
  });

  it("rejects a short or malformed id", () => {
    expect(isValidObjectId("123")).toBe(false);
  });
});
