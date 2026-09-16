import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { requireAdminSession } from "@/lib/auth/session";
import { getFileStorage } from "@/lib/storage";
import { errorResponse, handleUnexpectedError } from "@/lib/http";
import { isValidObjectId } from "@/lib/utils/sanitize";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse(401, "Not authenticated.");
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return errorResponse(404, "Resume not found.");
  }

  const mode = request.nextUrl.searchParams.get("mode") === "download" ? "download" : "inline";

  try {
    await connectToDatabase();
    const doc = await Application.findById(id).select("resume").lean();
    if (!doc) {
      return errorResponse(404, "Resume not found.");
    }

    const storage = getFileStorage();
    let bytes: Buffer;
    try {
      bytes = await storage.read(doc.resume.storageKey);
    } catch {
      return errorResponse(404, "Resume not found.");
    }

    const disposition = mode === "download" ? "attachment" : "inline";
    const asciiFallback = doc.resume.originalFilename.replace(/[^\x20-\x7e]/g, "_");
    const encodedName = encodeURIComponent(doc.resume.originalFilename);

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "GET /api/admin/applications/[id]/resume");
  }
}
