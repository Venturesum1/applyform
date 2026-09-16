import { randomUUID } from "crypto";
import { del, get, put } from "@vercel/blob";
import type { FileStorage, StoredFileHandle } from "./types";

/**
 * Stores resumes in Vercel Blob with `access: "private"` — reads require the
 * store's read-write token (server-side only), so the blob is never fetchable
 * by a bare URL the way a "public" blob would be. The client still never sees
 * this pathname: every resume request is proxied through our own
 * authenticated API route (see /api/admin/applications/[id]/resume), exactly
 * as with the local filesystem provider.
 */
export class VercelBlobFileStorage implements FileStorage {
  async save(bytes: Buffer, extension: string): Promise<StoredFileHandle> {
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const pathname = `resumes/${randomUUID()}.${safeExtension}`;

    const result = await put(pathname, bytes, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });

    return { storageKey: result.pathname };
  }

  async read(storageKey: string): Promise<Buffer> {
    const result = await get(storageKey, { access: "private" });
    if (!result?.stream) {
      throw new Error("Resume not found in blob storage");
    }
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(storageKey: string): Promise<void> {
    await del(storageKey).catch(() => undefined);
  }
}
