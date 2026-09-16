import { beforeEach, describe, expect, it, vi } from "vitest";

const blobPut = vi.fn();
const blobGet = vi.fn();
const blobDel = vi.fn();

vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => blobPut(...args),
  get: (...args: unknown[]) => blobGet(...args),
  del: (...args: unknown[]) => blobDel(...args),
}));

const { VercelBlobFileStorage } = await import("@/lib/storage/vercel-blob-storage");

function streamFrom(bytes: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  });
}

describe("VercelBlobFileStorage", () => {
  beforeEach(() => {
    blobPut.mockReset();
    blobGet.mockReset();
    blobDel.mockReset();
  });

  it("uploads with private access and returns the resulting pathname as the storage key", async () => {
    blobPut.mockResolvedValue({ pathname: "resumes/generated-id.pdf", url: "https://example.blob/x" });
    const storage = new VercelBlobFileStorage();

    const { storageKey } = await storage.save(Buffer.from("%PDF-1.4 fake"), "pdf");

    expect(storageKey).toBe("resumes/generated-id.pdf");
    expect(blobPut).toHaveBeenCalledTimes(1);
    const [pathname, , options] = blobPut.mock.calls[0];
    expect(pathname).toMatch(/^resumes\/.+\.pdf$/);
    expect(options).toMatchObject({ access: "private" });
  });

  it("reads back the same bytes that were uploaded", async () => {
    const bytes = Buffer.from("%PDF-1.4 fake content");
    blobGet.mockResolvedValue({ stream: streamFrom(bytes) });
    const storage = new VercelBlobFileStorage();

    const result = await storage.read("resumes/generated-id.pdf");

    expect(result.equals(bytes)).toBe(true);
    expect(blobGet).toHaveBeenCalledWith("resumes/generated-id.pdf", { access: "private" });
  });

  it("throws instead of returning empty/undefined data when the blob is missing", async () => {
    blobGet.mockResolvedValue(null);
    const storage = new VercelBlobFileStorage();

    await expect(storage.read("resumes/does-not-exist.pdf")).rejects.toThrow();
  });

  it("deletes a stored blob", async () => {
    blobDel.mockResolvedValue(undefined);
    const storage = new VercelBlobFileStorage();

    await storage.delete("resumes/generated-id.pdf");

    expect(blobDel).toHaveBeenCalledWith("resumes/generated-id.pdf");
  });

  it("does not throw when deleting fails (e.g. already gone)", async () => {
    blobDel.mockRejectedValue(new Error("not found"));
    const storage = new VercelBlobFileStorage();

    await expect(storage.delete("resumes/already-gone.pdf")).resolves.not.toThrow();
  });
});
