import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { requireAdminSession } from "@/lib/auth/session";
import { verifyCsrfToken } from "@/lib/auth/csrf";
import { errorResponse, handleUnexpectedError } from "@/lib/http";
import { isValidObjectId } from "@/lib/utils/sanitize";
import { APPLICATION_STATUSES } from "@/types/application";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse(401, "Not authenticated.");
  }

  if (!verifyCsrfToken(request)) {
    return errorResponse(403, "Invalid request. Please refresh and try again.");
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return errorResponse(404, "Candidate not found.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Invalid request.");
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Please choose a valid status.");
  }

  try {
    await connectToDatabase();
    const updated = await Application.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return errorResponse(404, "Candidate not found.");
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      updatedAt: new Date(updated.updatedAt).toISOString(),
    });
  } catch (error) {
    return handleUnexpectedError(error, "PATCH /api/admin/applications/[id]/status");
  }
}
