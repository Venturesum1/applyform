import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { requireAdminSession } from "@/lib/auth/session";
import { errorResponse, handleUnexpectedError } from "@/lib/http";
import { APPLICATION_STATUSES } from "@/types/application";
import type { DashboardStats } from "@/types/application";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return errorResponse(401, "Not authenticated.");
  }

  try {
    await connectToDatabase();

    const results = await Application.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats: DashboardStats = {
      total: 0,
      New: 0,
      Reviewing: 0,
      Shortlisted: 0,
      Interview: 0,
      Rejected: 0,
      Hired: 0,
    };

    for (const row of results) {
      if ((APPLICATION_STATUSES as readonly string[]).includes(row._id)) {
        stats[row._id as keyof DashboardStats] = row.count;
        stats.total += row.count;
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    return handleUnexpectedError(error, "GET /api/admin/stats");
  }
}
