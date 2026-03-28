import { NextRequest, NextResponse } from "next/server";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event: AnalyticsEvent = {
      type: body.type || "page_view",
      timestamp: new Date().toISOString(),
      path: body.path || "/",
      referrer: body.referrer || request.headers.get("referer") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      visitorId: body.visitorId || "anonymous",
      screenWidth: body.screenWidth || undefined,
      metadata: body.metadata || undefined,
    };

    trackEvent(event);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

// Tracking pixel for newsletter opens (1x1 transparent GIF)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const editionId = searchParams.get("eid");

  if (editionId) {
    const event: AnalyticsEvent = {
      type: "newsletter_open",
      timestamp: new Date().toISOString(),
      path: `/newsletter/${editionId}`,
      userAgent: request.headers.get("user-agent") || undefined,
      visitorId: hashString(request.headers.get("user-agent") || "unknown"),
      metadata: { editionId },
    };
    trackEvent(event);
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
