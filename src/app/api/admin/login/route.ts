import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getAdminPasswordHash } from "@/lib/auth/admin-credentials";
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginRateLimit } from "@/lib/auth/rate-limit";
import { csrfCookieOptions, CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/auth/csrf";
import { errorResponse, getClientIp, handleUnexpectedError } from "@/lib/http";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    return errorResponse(429, "Too many login attempts. Please try again later.", {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid request.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Please enter your email and password.");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = getAdminPasswordHash();

  if (!adminEmail || !adminPasswordHash) {
    return handleUnexpectedError(new Error("Admin credentials are not configured"), "POST /api/admin/login");
  }

  try {
    const { email, password } = parsed.data;

    // Always run the hash comparison, even on an email mismatch, so failed
    // logins take a consistent amount of time regardless of which check failed.
    const passwordMatches = await verifyPassword(password, adminPasswordHash);
    const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    if (!emailMatches || !passwordMatches) {
      recordFailedLoginAttempt(ip);
      return errorResponse(401, "Invalid email or password.");
    }

    resetLoginRateLimit(ip);

    const session = await getAdminSession();
    session.isAdmin = true;
    session.email = adminEmail;
    session.loggedInAt = Date.now();
    await session.save();

    const cookieStore = await cookies();
    cookieStore.set(CSRF_COOKIE_NAME, generateCsrfToken(), csrfCookieOptions());

    return NextResponse.json({ success: true, email: adminEmail });
  } catch (error) {
    return handleUnexpectedError(error, "POST /api/admin/login");
  }
}
