import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalFileStorage } from "@/lib/storage/local-storage";

describe("LocalFileStorage", () => {
  let dir: string;
  let storage: LocalFileStorage;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "resume-storage-"));
    storage = new LocalFileStorage(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("saves and reads back the same bytes", async () => {
    const bytes = Buffer.from("%PDF-1.7 fake content");
    const { storageKey } = await storage.save(bytes, "pdf");
    const readBack = await storage.read(storageKey);
    expect(readBack.equals(bytes)).toBe(true);
  });

  it("generates a storage key unrelated to any user input", async () => {
    const { storageKey } = await storage.save(Buffer.from("data"), "pdf");
    expect(storageKey).toMatch(/^[0-9a-f-]{36}\.pdf$/i);
  });

  it("rejects a path traversal attempt on read", async () => {
    await expect(storage.read("../../../../etc/passwd")).rejects.toThrow();
  });

  it("rejects a path traversal attempt disguised with a valid-looking suffix", async () => {
    await expect(storage.read("../../etc/passwd.pdf")).rejects.toThrow();
  });

  it("rejects an absolute path passed as a storage key", async () => {
    await expect(storage.read("/etc/passwd")).rejects.toThrow();
  });

  it("deletes a stored file", async () => {
    const { storageKey } = await storage.save(Buffer.from("data"), "pdf");
    await storage.delete(storageKey);
    await expect(storage.read(storageKey)).rejects.toThrow();
  });

  it("does not throw when deleting a file that no longer exists", async () => {
    await expect(storage.delete("00000000-0000-0000-0000-000000000000.pdf")).resolves.not.toThrow();
  });
});
