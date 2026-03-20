import { NextRequest, NextResponse } from "next/server";
import { generateDigest } from "@/lib/digest-generator";

export const maxDuration = 120;

// POST: Generate weekly or monthly digest
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type } = await request.json().catch(() => ({ type: "weekly" }));

    if (type !== "weekly" && type !== "monthly") {
      return NextResponse.json({ error: "Type must be 'weekly' or 'monthly'" }, { status: 400 });
    }

    const edition = await generateDigest(type);

    if (!edition) {
      return NextResponse.json({ error: "No editions available for digest" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      edition: {
        id: edition.id,
        dateLabel: edition.dateLabel,
        headline: edition.headline,
        articleCount: edition.articleCount,
        sections: edition.sections.length,
      },
    });
  } catch (error) {
    console.error("[DIGEST] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate digest", details: String(error) },
      { status: 500 }
    );
  }
}
