import { NextRequest, NextResponse } from "next/server";
import { updateEmailStatus, type EmailStatus } from "@/lib/email-log";

// Resend webhook event types → our status
const STATUS_MAP: Record<string, EmailStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "sent", // keep as sent, not a final state
};

export async function POST(request: NextRequest) {
  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    }

    // For full verification, use the `svix` package.
    // Lightweight check: just ensure headers are present.
    // To add full verification: npm install svix, then use Webhook.verify()
  }

  try {
    const body = await request.json();
    const eventType = body.type as string;
    const data = body.data;

    if (!eventType || !data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const status = STATUS_MAP[eventType];
    if (!status) {
      // Unknown event type — acknowledge but don't process
      return NextResponse.json({ received: true, ignored: true });
    }

    const resendId = data.email_id as string;
    if (!resendId) {
      return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
    }

    const timestamp = data.created_at as string | undefined;
    await updateEmailStatus(resendId, status, timestamp);

    console.log(`[WEBHOOK] ${eventType} → ${status} for ${resendId}`);
    return NextResponse.json({ received: true, status });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
