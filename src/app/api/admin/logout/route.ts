import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSession } from "@/lib/auth/session";
import { CSRF_COOKIE_NAME, verifyCsrfToken } from "@/lib/auth/csrf";
import { errorResponse, handleUnexpectedError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAdmin) {
      return errorResponse(401, "Not authenticated.");
    }

    if (!verifyCsrfToken(request)) {
      return errorResponse(403, "Invalid request. Please refresh and try again.");
    }

    session.destroy();

    const cookieStore = await cookies();
    cookieStore.delete(CSRF_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error, "POST /api/admin/logout");
  }
}
