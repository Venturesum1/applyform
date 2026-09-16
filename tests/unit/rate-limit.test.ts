import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from "@/lib/auth/rate-limit";
import { LOGIN_RATE_LIMIT } from "@/lib/constants";

describe("login rate limiting", () => {
  const key = "203.0.113.1";

  beforeEach(() => {
    resetLoginRateLimit(key);
    vi.useRealTimers();
  });

  it("allows attempts under the threshold", () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts - 1; i += 1) {
      expect(checkLoginRateLimit(key).allowed).toBe(true);
      recordFailedLoginAttempt(key);
    }
  });

  it("blocks further attempts once the threshold is exceeded", () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i += 1) {
      recordFailedLoginAttempt(key);
    }
    const status = checkLoginRateLimit(key);
    expect(status.allowed).toBe(false);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the limit after a successful login", () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i += 1) {
      recordFailedLoginAttempt(key);
    }
    expect(checkLoginRateLimit(key).allowed).toBe(false);
    resetLoginRateLimit(key);
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });

  it("tracks separate clients independently", () => {
    const otherKey = "198.51.100.7";
    resetLoginRateLimit(otherKey);
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i += 1) {
      recordFailedLoginAttempt(key);
    }
    expect(checkLoginRateLimit(key).allowed).toBe(false);
    expect(checkLoginRateLimit(otherKey).allowed).toBe(true);
  });
});
