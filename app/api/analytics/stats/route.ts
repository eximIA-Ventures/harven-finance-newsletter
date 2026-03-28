import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/analytics-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const period = Math.min(Math.max(days, 1), 90); // Clamp 1-90 days

  const stats = getStats(period);

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
