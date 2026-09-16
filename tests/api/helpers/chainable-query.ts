import { vi } from "vitest";

/** Mimics a chainable Mongoose Query (.sort().skip().limit().select().lean()) resolving to `result`. */
export function createChainableQuery<T>(result: T) {
  const query = {
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    select: vi.fn(() => query),
    lean: vi.fn(async () => result),
  };
  return query;
}
