import { NextRequest, NextResponse } from "next/server";
import { getDeliveryReport, getRecentReports } from "@/lib/email-log";

export async function GET(request: NextRequest) {
  const editionId = request.nextUrl.searchParams.get("editionId");

  // If no editionId, return summary of recent editions
  if (!editionId) {
    const reports = await getRecentReports(7);
    return NextResponse.json({ reports });
  }

  const report = await getDeliveryReport(editionId);
  return NextResponse.json(report);
}
