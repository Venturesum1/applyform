import { randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Cookie attributes for the CSRF token. Deliberately NOT httpOnly — the
 * admin dashboard client needs to read it and echo it back as a header
 * (double-submit cookie pattern) on every state-changing request.
 */
export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

export { CSRF_COOKIE_NAME };

/** Verifies the double-submit CSRF token for state-changing admin requests. */
export function verifyCsrfToken(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerValue = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieValue || !headerValue) {
    return false;
  }

  const cookieBuffer = Buffer.from(cookieValue);
  const headerBuffer = Buffer.from(headerValue);

  if (cookieBuffer.length !== headerBuffer.length) {
    return false;
  }

  return timingSafeEqual(cookieBuffer, headerBuffer);
}
