import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { FileStorage, StoredFileHandle } from "./types";

/** Storage keys are always generated server-side as `<uuid>.<ext>` — never derived from user input. */
const STORAGE_KEY_PATTERN = /^[0-9a-f-]{36}\.[a-z0-9]{1,10}$/i;

export class LocalFileStorage implements FileStorage {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveSafePath(storageKey: string): string {
    if (!STORAGE_KEY_PATTERN.test(storageKey)) {
      throw new Error("Invalid storage key");
    }
    // path.basename strips any path separators as a second layer of defense against traversal.
    const safeName = path.basename(storageKey);
    const fullPath = path.join(this.rootDir, safeName);
    if (path.dirname(fullPath) !== this.rootDir) {
      throw new Error("Invalid storage key");
    }
    return fullPath;
  }

  async save(bytes: Buffer, extension: string): Promise<StoredFileHandle> {
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const storageKey = `${randomUUID()}.${safeExtension}`;
    await mkdir(this.rootDir, { recursive: true });
    const fullPath = this.resolveSafePath(storageKey);
    await writeFile(fullPath, bytes, { mode: 0o600 });
    return { storageKey };
  }

  async read(storageKey: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(storageKey);
    return readFile(fullPath);
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = this.resolveSafePath(storageKey);
    await rm(fullPath, { force: true });
  }
}
