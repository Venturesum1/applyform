import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, generateCsrfToken, verifyCsrfToken } from "@/lib/auth/csrf";

function buildRequest({ cookie, header }: { cookie?: string; header?: string }): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `${CSRF_COOKIE_NAME}=${cookie}`);
  if (header) headers.set(CSRF_HEADER_NAME, header);
  return new NextRequest("https://example.com/api/admin/applications/x/status", {
    method: "PATCH",
    headers,
  });
}

describe("CSRF double-submit token", () => {
  it("generates tokens of sufficient length", () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("accepts a request where the header matches the cookie", () => {
    const token = generateCsrfToken();
    const request = buildRequest({ cookie: token, header: token });
    expect(verifyCsrfToken(request)).toBe(true);
  });

  it("rejects a request with no CSRF cookie at all", () => {
    const request = buildRequest({ header: generateCsrfToken() });
    expect(verifyCsrfToken(request)).toBe(false);
  });

  it("rejects a request with no CSRF header (typical forged cross-site request)", () => {
    const request = buildRequest({ cookie: generateCsrfToken() });
    expect(verifyCsrfToken(request)).toBe(false);
  });

  it("rejects a request where the header does not match the cookie", () => {
    const request = buildRequest({ cookie: generateCsrfToken(), header: generateCsrfToken() });
    expect(verifyCsrfToken(request)).toBe(false);
  });
});
