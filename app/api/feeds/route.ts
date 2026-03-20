import { NextRequest, NextResponse } from "next/server";
import { parseAllFeeds } from "@/lib/feed-parser";
import { FeedSource, FeedResponse } from "@/lib/types";
import { defaultFeeds } from "@/lib/default-feeds";

// In-memory cache
let cachedResponse: FeedResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const now = Date.now();

  // Return cached if fresh
  if (cachedResponse && now - cacheTimestamp < CACHE_DURATION) {
    return NextResponse.json(cachedResponse);
  }

  try {
    const { articles, healthMap } = await parseAllFeeds(defaultFeeds);

    const errorCount = Object.values(healthMap).filter(
      (h) => h.lastError !== null
    ).length;

    const response: FeedResponse = {
      articles,
      health: healthMap,
      fetchedAt: new Date().toISOString(),
      sourceCount: defaultFeeds.filter((s) => s.enabled).length,
      errorCount,
    };

    // Update cache
    cachedResponse = response;
    cacheTimestamp = now;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      {
        articles: [],
        health: {},
        fetchedAt: new Date().toISOString(),
        sourceCount: 0,
        errorCount: 1,
      } as FeedResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sources } = (await request.json()) as { sources: FeedSource[] };

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: "sources must be an array" },
        { status: 400 }
      );
    }

    const { articles, healthMap } = await parseAllFeeds(sources);

    const errorCount = Object.values(healthMap).filter(
      (h) => h.lastError !== null
    ).length;

    const response: FeedResponse = {
      articles,
      health: healthMap,
      fetchedAt: new Date().toISOString(),
      sourceCount: sources.filter((s) => s.enabled).length,
      errorCount,
    };

    // Update cache with custom sources
    cachedResponse = response;
    cacheTimestamp = Date.now();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeds" },
      { status: 500 }
    );
  }
}
