import { LOGIN_RATE_LIMIT } from "@/lib/constants";

interface AttemptRecord {
  count: number;
  windowStart: number;
}

declare global {
  var __loginAttempts: Map<string, AttemptRecord> | undefined;
}

/**
 * Simple in-memory fixed-window rate limiter for the login endpoint, keyed by
 * client IP. Sufficient for a single-instance deployment of this small app;
 * a multi-instance production deployment should swap this for a shared store
 * (e.g. Redis) behind the same function signature.
 */
const attempts = global.__loginAttempts ?? new Map<string, AttemptRecord>();
global.__loginAttempts = attempts;

export interface RateLimitStatus {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkLoginRateLimit(key: string): RateLimitStatus {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStart > LOGIN_RATE_LIMIT.windowMs) {
    return { allowed: true };
  }

  if (record.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    const retryAfterSeconds = Math.ceil(
      (record.windowStart + LOGIN_RATE_LIMIT.windowMs - now) / 1000,
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStart > LOGIN_RATE_LIMIT.windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  record.count += 1;
}

export function resetLoginRateLimit(key: string): void {
  attempts.delete(key);
}
