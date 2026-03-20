import { NextRequest, NextResponse } from "next/server";
import { fetchMarketData } from "@/lib/market-data";

// Cache market data for 1 hour
let cachedData: { quotes: any[]; fetchedAt: string } | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const now = Date.now();
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (!forceRefresh && cachedData && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }

  try {
    const quotes = await fetchMarketData();
    cachedData = {
      quotes,
      fetchedAt: new Date().toISOString(),
    };
    cacheTime = now;

    return NextResponse.json(cachedData);
  } catch {
    // Return cache even if stale
    if (cachedData) return NextResponse.json(cachedData);

    return NextResponse.json({
      quotes: [],
      fetchedAt: new Date().toISOString(),
    });
  }
}
