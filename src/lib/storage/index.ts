import { LocalFileStorage } from "./local-storage";
import { VercelBlobFileStorage } from "./vercel-blob-storage";
import type { FileStorage } from "./types";

let storage: FileStorage | null = null;

/**
 * Storage provider factory. "local" is for development only — it does not
 * survive across serverless instances/deploys (e.g. on Vercel) and should
 * never be used in production. "vercel-blob" is the recommended production
 * provider when hosting on Vercel. To use a different provider (S3, GCS,
 * etc.), implement `FileStorage` (see ./types.ts) and add a branch here —
 * nothing else in the app needs to change.
 */
export function getFileStorage(): FileStorage {
  if (storage) return storage;

  const provider = process.env.FILE_STORAGE_PROVIDER ?? "local";

  if (provider === "local") {
    const dir = process.env.RESUME_STORAGE_DIR ?? "./storage/resumes";
    storage = new LocalFileStorage(dir);
    return storage;
  }

  if (provider === "vercel-blob") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set");
    }
    storage = new VercelBlobFileStorage();
    return storage;
  }

  throw new Error(`Unsupported FILE_STORAGE_PROVIDER: ${provider}`);
}

export type { FileStorage, StoredFileHandle } from "./types";
