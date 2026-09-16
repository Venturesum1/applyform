import { NextResponse } from "next/server";

export function errorResponse(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Logs the real error server-side only, and returns a generic message to the client. */
export function handleUnexpectedError(error: unknown, context: string) {
  console.error(`[${context}]`, error instanceof Error ? error.stack ?? error.message : error);
  return errorResponse(500, "Something went wrong. Please try again.");
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
