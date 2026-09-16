import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { requireAdminSession } from "@/lib/auth/session";
import { errorResponse, handleUnexpectedError } from "@/lib/http";
import { isValidObjectId } from "@/lib/utils/sanitize";
import { toApplicationDetail } from "@/lib/mappers/application";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse(401, "Not authenticated.");
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return errorResponse(404, "Candidate not found.");
  }

  try {
    await connectToDatabase();
    const doc = await Application.findById(id).lean();
    if (!doc) {
      return errorResponse(404, "Candidate not found.");
    }
    return NextResponse.json(toApplicationDetail(doc as never));
  } catch (error) {
    return handleUnexpectedError(error, "GET /api/admin/applications/[id]");
  }
}
