import { NextRequest, NextResponse } from "next/server";
import { getEdition, getAllEditions } from "@/lib/edition-store";
import { sendNewsletterToSubscribers } from "@/lib/email-sender";

export async function POST(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const editionId = body.editionId as string | undefined;

  // If no ID provided, use today's edition
  const targetId = editionId || new Date().toISOString().slice(0, 10);

  const edition = await getEdition(targetId);
  if (!edition) {
    // List available editions for convenience
    const all = await getAllEditions();
    const ids = all.slice(0, 10).map((e) => e.id);
    return NextResponse.json(
      { error: `Edition "${targetId}" not found`, available: ids },
      { status: 404 }
    );
  }

  const result = await sendNewsletterToSubscribers(edition);

  return NextResponse.json({
    editionId: edition.id,
    headline: edition.headline,
    articleCount: edition.articleCount,
    email: result,
  });
}
