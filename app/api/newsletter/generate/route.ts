import { NextRequest, NextResponse } from "next/server";
import { generateNewsletter } from "@/lib/newsletter-generator";

// Cache the latest edition
let latestEdition: {
  html: string;
  date: string;
  articleCount: number;
  sourceCount: number;
  headline: string;
} | null = null;

// GET: Retrieve latest generated newsletter
export async function GET() {
  if (!latestEdition) {
    return NextResponse.json(
      { error: "No newsletter generated yet. POST to generate." },
      { status: 404 }
    );
  }

  return NextResponse.json(latestEdition);
}

// POST: Generate a new newsletter edition
export async function POST(request: NextRequest) {
  // Optional: verify with a secret key for cron security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const edition = await generateNewsletter();

    latestEdition = {
      html: edition.html,
      date: edition.date,
      articleCount: edition.articleCount,
      sourceCount: edition.sourceCount,
      headline: edition.headline,
    };

    return NextResponse.json({
      success: true,
      date: edition.date,
      dateLabel: edition.dateLabel,
      headline: edition.headline,
      articleCount: edition.articleCount,
      sourceCount: edition.sourceCount,
      sections: edition.sections.map((s) => ({
        topic: s.topicLabel,
        items: s.items.length,
      })),
    });
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate newsletter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
