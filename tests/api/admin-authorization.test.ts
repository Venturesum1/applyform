import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createChainableQuery } from "./helpers/chainable-query";
import { CSRF_COOKIE_NAME } from "@/lib/constants";
import { CSRF_HEADER_NAME } from "@/lib/auth/csrf";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn(async () => undefined),
}));

const requireAdminSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  requireAdminSession: (...args: unknown[]) => requireAdminSession(...args),
}));

const applicationFind = vi.fn();
const applicationFindById = vi.fn();
const applicationFindByIdAndUpdate = vi.fn();
const applicationCountDocuments = vi.fn();

vi.mock("@/models/Application", () => ({
  Application: {
    find: (...args: unknown[]) => applicationFind(...args),
    findById: (...args: unknown[]) => applicationFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => applicationFindByIdAndUpdate(...args),
    countDocuments: (...args: unknown[]) => applicationCountDocuments(...args),
    aggregate: vi.fn(async () => []),
  },
}));

const storageRead = vi.fn(async () => Buffer.from("%PDF-1.4 fake"));
vi.mock("@/lib/storage", () => ({
  getFileStorage: () => ({ read: storageRead }),
}));

const { GET: listApplications } = await import("@/app/api/admin/applications/route");
const { GET: getApplication } = await import("@/app/api/admin/applications/[id]/route");
const { PATCH: patchStatus } = await import("@/app/api/admin/applications/[id]/status/route");
const { GET: getResume } = await import("@/app/api/admin/applications/[id]/resume/route");

const VALID_ID = "507f1f77bcf86cd799439011";
const FAKE_ADMIN_SESSION = { isAdmin: true, email: "admin@example.com", loggedInAt: Date.now() };

function csrfHeaders(token = "matching-token") {
  return {
    cookie: `${CSRF_COOKIE_NAME}=${token}`,
    [CSRF_HEADER_NAME]: token,
  };
}

describe("Admin API authorization", () => {
  beforeEach(() => {
    requireAdminSession.mockReset();
    applicationFind.mockReset();
    applicationFindById.mockReset();
    applicationFindByIdAndUpdate.mockReset();
    applicationCountDocuments.mockReset();
    storageRead.mockClear();
  });

  describe("when there is no authenticated admin session (e.g. a candidate or anonymous visitor)", () => {
    beforeEach(() => {
      requireAdminSession.mockResolvedValue(null);
    });

    it("rejects listing applications", async () => {
      const response = await listApplications(
        new NextRequest("https://example.com/api/admin/applications"),
      );
      expect(response.status).toBe(401);
    });

    it("rejects reading a single application", async () => {
      const response = await getApplication(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}`),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(401);
    });

    it("rejects changing an application's status", async () => {
      const response = await patchStatus(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "Hired" }),
        }),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(401);
    });

    it("rejects downloading a resume", async () => {
      const response = await getResume(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/resume`),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(401);
      expect(storageRead).not.toHaveBeenCalled();
    });
  });

  describe("when authenticated as admin", () => {
    beforeEach(() => {
      requireAdminSession.mockResolvedValue(FAKE_ADMIN_SESSION);
    });

    it("rejects a malformed id instead of passing it to the database (blocks injection/traversal attempts)", async () => {
      const response = await getApplication(
        new NextRequest("https://example.com/api/admin/applications/../../etc/passwd"),
        { params: Promise.resolve({ id: "../../etc/passwd" }) },
      );
      expect(response.status).toBe(404);
      expect(applicationFindById).not.toHaveBeenCalled();
    });

    it("returns 404 for a well-formed id that does not exist", async () => {
      applicationFindById.mockReturnValue(createChainableQuery(null));
      const response = await getApplication(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}`),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(404);
    });

    it("lists applications for a valid session", async () => {
      applicationCountDocuments.mockResolvedValue(1);
      applicationFind.mockReturnValue(
        createChainableQuery([
          {
            _id: VALID_ID,
            fullName: "Jane Doe",
            email: "jane@example.com",
            totalExperience: "2-4 years",
            primarySkills: "React",
            status: "New",
            createdAt: new Date(),
          },
        ]),
      );
      const response = await listApplications(
        new NextRequest("https://example.com/api/admin/applications"),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.items).toHaveLength(1);
    });

    it("rejects a status update without a CSRF token", async () => {
      const response = await patchStatus(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "Hired" }),
        }),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(403);
      expect(applicationFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("rejects an invalid status value", async () => {
      const response = await patchStatus(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json", ...csrfHeaders() },
          body: JSON.stringify({ status: "NotARealStatus" }),
        }),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(400);
      expect(applicationFindByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("updates status with a valid session, CSRF token, and status value", async () => {
      applicationFindByIdAndUpdate.mockReturnValue(
        createChainableQuery({ status: "Hired", updatedAt: new Date() }),
      );
      const response = await patchStatus(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json", ...csrfHeaders() },
          body: JSON.stringify({ status: "Hired" }),
        }),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(200);
      expect(applicationFindByIdAndUpdate).toHaveBeenCalled();
    });

    it("streams a resume for a valid, existing application", async () => {
      applicationFindById.mockReturnValue(
        createChainableQuery({
          resume: {
            storageKey: "11111111-1111-1111-1111-111111111111.pdf",
            originalFilename: "resume.pdf",
            mimeType: "application/pdf",
            sizeBytes: 100,
          },
        }),
      );
      const response = await getResume(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/resume`),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
    });

    it("returns 404 instead of leaking a filesystem error when the stored file is missing", async () => {
      applicationFindById.mockReturnValue(
        createChainableQuery({
          resume: {
            storageKey: "22222222-2222-2222-2222-222222222222.pdf",
            originalFilename: "resume.pdf",
            mimeType: "application/pdf",
            sizeBytes: 100,
          },
        }),
      );
      storageRead.mockRejectedValueOnce(new Error("ENOENT"));
      const response = await getResume(
        new NextRequest(`https://example.com/api/admin/applications/${VALID_ID}/resume`),
        { params: Promise.resolve({ id: VALID_ID }) },
      );
      expect(response.status).toBe(404);
    });
  });
});
