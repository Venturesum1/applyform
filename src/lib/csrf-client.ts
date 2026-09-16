import { CSRF_COOKIE_NAME } from "@/lib/constants";

/** Reads the (non-HttpOnly) CSRF cookie so the client can echo it back as a header on mutating requests. */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
