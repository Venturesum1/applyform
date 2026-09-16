import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { resetLoginRateLimit } from "@/lib/auth/rate-limit";
import { LOGIN_RATE_LIMIT } from "@/lib/constants";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "correct horse battery staple";

const fakeCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: async () => fakeCookieStore,
}));

const fakeSession = {
  isAdmin: false,
  email: "",
  loggedInAt: 0,
  save: vi.fn(async () => undefined),
  destroy: vi.fn(),
};

vi.mock("@/lib/auth/session", () => ({
  getAdminSession: async () => fakeSession,
}));

const { POST: login } = await import("@/app/api/admin/login/route");

function buildLoginRequest(body: unknown, ip = "203.0.113.5") {
  return new NextRequest("https://example.com/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(async () => {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    process.env.ADMIN_PASSWORD_HASH_BASE64 = Buffer.from(hash, "utf8").toString("base64");
    fakeSession.isAdmin = false;
    fakeSession.email = "";
    fakeSession.save.mockClear();
    fakeCookieStore.set.mockClear();
    resetLoginRateLimit("203.0.113.5");
    resetLoginRateLimit("203.0.113.6");
  });

  it("logs in successfully with correct credentials", async () => {
    const response = await login(buildLoginRequest({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }));
    expect(response.status).toBe(200);
    expect(fakeSession.isAdmin).toBe(true);
    expect(fakeSession.save).toHaveBeenCalled();
    expect(fakeCookieStore.set).toHaveBeenCalled();
  });

  it("rejects an incorrect password without authenticating", async () => {
    const response = await login(buildLoginRequest({ email: ADMIN_EMAIL, password: "wrong" }));
    expect(response.status).toBe(401);
    expect(fakeSession.save).not.toHaveBeenCalled();
  });

  it("rejects a correct password paired with the wrong email", async () => {
    const response = await login(
      buildLoginRequest({ email: "someone-else@example.com", password: ADMIN_PASSWORD }),
    );
    expect(response.status).toBe(401);
    expect(fakeSession.save).not.toHaveBeenCalled();
  });

  it("does not leak whether the failure was the email or the password", async () => {
    const wrongEmail = await login(
      buildLoginRequest({ email: "nope@example.com", password: ADMIN_PASSWORD }, "203.0.113.6"),
    );
    resetLoginRateLimit("203.0.113.6");
    const wrongPassword = await login(
      buildLoginRequest({ email: ADMIN_EMAIL, password: "nope" }, "203.0.113.6"),
    );
    const [bodyA, bodyB] = await Promise.all([wrongEmail.json(), wrongPassword.json()]);
    expect(bodyA.error).toBe(bodyB.error);
  });

  it("locks out further attempts after repeated failures from the same client", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i += 1) {
      await login(buildLoginRequest({ email: ADMIN_EMAIL, password: "wrong" }));
    }
    const response = await login(buildLoginRequest({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }));
    expect(response.status).toBe(429);
    expect(fakeSession.save).not.toHaveBeenCalled();
  });
});
