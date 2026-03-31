import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, getAllSubscribers } from "@/lib/subscriber-store";

/**
 * Bulk-import subscribers.
 * POST { emails: ["a@b.com", "c@d.com", ...] }
 * Auth: CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const emails = body.emails as string[] | undefined;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "Provide { emails: [...] }" }, { status: 400 });
  }

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await addSubscriber(email);
    if (result.success) added++;
    else if (result.message.includes("já está")) skipped++;
    else failed++;
  }

  const total = await getAllSubscribers();

  return NextResponse.json({
    imported: added,
    skipped,
    failed,
    totalSubscribers: total.length,
  });
}
