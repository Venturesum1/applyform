import { describe, expect, it } from "vitest";
import { validateResumeContent, validateResumeMetadata } from "@/lib/validation/resume";
import { MAX_RESUME_SIZE_BYTES } from "@/lib/constants";

describe("validateResumeMetadata", () => {
  it("accepts a valid PDF file", () => {
    const result = validateResumeMetadata({ name: "resume.pdf", type: "application/pdf", size: 1024 });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-PDF mime type", () => {
    const result = validateResumeMetadata({ name: "resume.docx", type: "application/msword", size: 1024 });
    expect(result.valid).toBe(false);
  });

  it("rejects a file with a spoofed PDF mime type but wrong extension", () => {
    const result = validateResumeMetadata({ name: "resume.exe", type: "application/pdf", size: 1024 });
    expect(result.valid).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = validateResumeMetadata({ name: "resume.pdf", type: "application/pdf", size: 0 });
    expect(result.valid).toBe(false);
  });

  it("rejects a file larger than the maximum allowed size", () => {
    const result = validateResumeMetadata({
      name: "resume.pdf",
      type: "application/pdf",
      size: MAX_RESUME_SIZE_BYTES + 1,
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateResumeContent", () => {
  it("accepts bytes starting with the PDF magic number", () => {
    const bytes = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(100)]);
    const result = validateResumeContent(bytes);
    expect(result.valid).toBe(true);
  });

  it("rejects bytes that are not actually a PDF, regardless of claimed mime type", () => {
    const bytes = Buffer.from("MZ\x90\x00this is actually an executable");
    const result = validateResumeContent(bytes);
    expect(result.valid).toBe(false);
  });

  it("rejects an empty buffer", () => {
    const result = validateResumeContent(Buffer.alloc(0));
    expect(result.valid).toBe(false);
  });

  it("rejects a buffer larger than the maximum allowed size", () => {
    const bytes = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(MAX_RESUME_SIZE_BYTES)]);
    const result = validateResumeContent(bytes);
    expect(result.valid).toBe(false);
  });
});
