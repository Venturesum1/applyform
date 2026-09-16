export interface StoredFileHandle {
  /** Opaque key used to retrieve the file later. Never a raw filesystem path derived from user input. */
  storageKey: string;
}

export interface FileStorage {
  /** Persists a file's bytes under a newly generated, safe storage key and returns that key. */
  save(bytes: Buffer, extension: string): Promise<StoredFileHandle>;
  /** Reads back a previously stored file. Throws if the key does not exist. */
  read(storageKey: string): Promise<Buffer>;
  /** Deletes a previously stored file. Safe to call even if the file is already gone. */
  delete(storageKey: string): Promise<void>;
}
