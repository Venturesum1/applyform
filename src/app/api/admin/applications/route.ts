import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { requireAdminSession } from "@/lib/auth/session";
import { errorResponse, handleUnexpectedError } from "@/lib/http";
import { escapeRegExp } from "@/lib/utils/sanitize";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/types/application";
import { APPLICATIONS_PAGE_SIZE } from "@/lib/constants";
import { toApplicationSummary } from "@/lib/mappers/application";

export const runtime = "nodejs";

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse(401, "Not authenticated.");
  }

  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim().slice(0, 200) ?? "";
    const statusParam = searchParams.get("status")?.trim() ?? "";
    const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

    const filter: Record<string, unknown> = {};

    if (statusParam && isApplicationStatus(statusParam)) {
      filter.status = statusParam;
    }

    if (q) {
      const escaped = escapeRegExp(q);
      filter.$or = [
        { fullName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const pageSize = APPLICATIONS_PAGE_SIZE;
    const [total, docs] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    return NextResponse.json({
      items: docs.map((doc) => toApplicationSummary(doc as never)),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleUnexpectedError(error, "GET /api/admin/applications");
  }
}
