import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn(async () => undefined),
}));

const applicationExists = vi.fn();
const applicationCreate = vi.fn();

vi.mock("@/models/Application", () => ({
  Application: {
    exists: (...args: unknown[]) => applicationExists(...args),
    create: (...args: unknown[]) => applicationCreate(...args),
  },
}));

const storageSave = vi.fn(async () => ({ storageKey: "11111111-1111-1111-1111-111111111111.pdf" }));
const storageDelete = vi.fn(async () => undefined);

vi.mock("@/lib/storage", () => ({
  getFileStorage: () => ({ save: storageSave, delete: storageDelete }),
}));

const { POST } = await import("@/app/api/applications/route");

const validFields: Record<string, string> = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555-123-4567",
  currentLocation: "Bengaluru, India",
  totalExperience: "2-4 years",
  primarySkills: "React, Node.js",
};

function buildFormData(overrides: Record<string, string> = {}, includeResume = true): FormData {
  const formData = new FormData();
  const fields = { ...validFields, ...overrides };
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  if (includeResume) {
    const bytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(50)]);
    formData.append("resume", new File([bytes], "resume.pdf", { type: "application/pdf" }));
  }
  return formData;
}

function buildRequest(formData: FormData): NextRequest {
  return new NextRequest("https://example.com/api/applications", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/applications", () => {
  beforeEach(() => {
    applicationExists.mockReset();
    applicationCreate.mockReset();
    storageSave.mockClear();
    storageDelete.mockClear();
    applicationExists.mockResolvedValue(null);
    applicationCreate.mockResolvedValue({ _id: "abc123" });
  });

  it("accepts a fully valid submission", async () => {
    const response = await POST(buildRequest(buildFormData()));
    expect(response.status).toBe(201);
    expect(applicationCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects a submission missing a required field", async () => {
    const response = await POST(buildRequest(buildFormData({ fullName: "" })));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.fieldErrors).toHaveProperty("fullName");
    expect(applicationCreate).not.toHaveBeenCalled();
  });

  it("rejects a submission with an invalid email address", async () => {
    const response = await POST(buildRequest(buildFormData({ email: "not-an-email" })));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.fieldErrors).toHaveProperty("email");
  });

  it("rejects a submission with no resume file", async () => {
    const response = await POST(buildRequest(buildFormData({}, false)));
    expect(response.status).toBe(400);
    expect(applicationCreate).not.toHaveBeenCalled();
  });

  it("rejects a resume that is not actually a PDF (bad magic bytes)", async () => {
    const formData = buildFormData({}, false);
    const fakeBytes = Buffer.from("this is not a pdf at all");
    formData.append("resume", new File([fakeBytes], "resume.pdf", { type: "application/pdf" }));
    const response = await POST(buildRequest(formData));
    expect(response.status).toBe(400);
    expect(applicationCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-PDF file extension even with a spoofed mime type", async () => {
    const formData = buildFormData({}, false);
    formData.append(
      "resume",
      new File([Buffer.from("data")], "resume.exe", { type: "application/pdf" }),
    );
    const response = await POST(buildRequest(formData));
    expect(response.status).toBe(400);
  });

  it("prevents a duplicate application for an email that already applied", async () => {
    applicationExists.mockResolvedValue({ _id: "existing" });
    const response = await POST(buildRequest(buildFormData()));
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toMatch(/already been submitted/i);
    expect(applicationCreate).not.toHaveBeenCalled();
  });

  it("handles a race-condition duplicate caught by the unique index and cleans up the orphaned file", async () => {
    applicationExists.mockResolvedValue(null);
    const duplicateKeyError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    applicationCreate.mockRejectedValue(duplicateKeyError);

    const response = await POST(buildRequest(buildFormData()));

    expect(response.status).toBe(409);
    expect(storageDelete).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111.pdf");
  });
});
