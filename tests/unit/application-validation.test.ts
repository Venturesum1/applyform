import { describe, expect, it } from "vitest";
import { applicationFormSchema } from "@/lib/validation/application";

const validInput = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555-123-4567",
  currentLocation: "Bengaluru, India",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  currentJobTitle: "",
  totalExperience: "2-4 years",
  currentCtc: "",
  expectedCtc: "",
  noticePeriod: "",
  highestQualification: "",
  primarySkills: "React, Node.js",
  programmingLanguages: "",
  mlAiExperience: "",
  computerVisionExperience: "",
  relevantProjects: "",
  coverLetter: "",
};

describe("applicationFormSchema", () => {
  it("accepts a fully valid application", () => {
    const result = applicationFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing full name", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing phone number", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, phone: "call-me-maybe" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing total experience", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, totalExperience: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing primary skills field", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, primarySkills: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an unsafe LinkedIn URL scheme", () => {
    const result = applicationFormSchema.safeParse({
      ...validInput,
      linkedinUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty optional URL", () => {
    const result = applicationFormSchema.safeParse({ ...validInput, portfolioUrl: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid https portfolio URL", () => {
    const result = applicationFormSchema.safeParse({
      ...validInput,
      portfolioUrl: "https://example.dev",
    });
    expect(result.success).toBe(true);
  });
});
