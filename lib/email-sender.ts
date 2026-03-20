import { Resend } from "resend";
import { getActiveSubscribers } from "./subscriber-store";
import { StoredEdition } from "./edition-store";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "newsletter@harvenfinance.com.br";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3007";

export async function sendNewsletterToSubscribers(edition: StoredEdition): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[EMAIL] RESEND_API_KEY not set — skipping email send");
    return { sent: 0, failed: 0, errors: ["RESEND_API_KEY not configured"] };
  }

  const resend = new Resend(apiKey);
  const subscribers = getActiveSubscribers();

  if (subscribers.length === 0) {
    console.log("[EMAIL] No active subscribers");
    return { sent: 0, failed: 0, errors: [] };
  }

  const html = buildEmailHtml(edition);
  const subject = `${edition.headline} — Harven Finance Newsletter`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send in batches of 10
  const batchSize = 10;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((sub) =>
        resend.emails.send({
          from: `Harven Finance <${FROM_EMAIL}>`,
          to: sub.email,
          subject,
          html: html.replace("{{UNSUB_URL}}", `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`),
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.data) {
        sent++;
      } else {
        failed++;
        const err = result.status === "rejected"
          ? result.reason?.message
          : (result.value as any)?.error?.message;
        if (err) errors.push(err);
      }
    }
  }

  console.log(`[EMAIL] Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed, errors };
}

function buildEmailHtml(edition: StoredEdition): string {
  const sectionsHtml = edition.sections
    .filter((s) => s.items.length > 0)
    .map((section) => {
      const itemsHtml = section.items
        .map((item) => {
          const summaryHtml = item.summary
            .split("\n\n")
            .map((p) => `<p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#444444;">${escapeHtml(p)}</p>`)
            .join("");

          const imageHtml = item.image
            ? `<img src="${escapeHtml(item.image)}" alt="" style="width:100%;max-height:360px;object-fit:cover;object-position:center top;border-radius:8px;display:block;margin:16px 0;" />`
            : "";

          return `
            <tr><td style="padding:24px 0 28px;border-bottom:1px solid #EEEEEE;">
              <a href="${escapeHtml(item.link)}" style="text-decoration:none;color:inherit;" target="_blank">
                <p style="margin:0;font-size:20px;font-weight:700;line-height:1.3;color:#1A1A1A;">
                  ${escapeHtml(item.title)}
                </p>
              </a>
              ${imageHtml}
              ${summaryHtml}
              <a href="${escapeHtml(item.link)}" style="font-size:12px;color:#9C8A55;text-decoration:none;font-weight:500;" target="_blank">
                Leia na íntegra — ${escapeHtml(item.source)} →
              </a>
            </td></tr>`;
        })
        .join("");

      return `
        <tr><td style="padding:28px 0 10px;border-bottom:2px solid rgba(156,138,85,0.3);">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9C8A55;">
            ${escapeHtml(section.label)}
          </p>
        </td></tr>
        ${itemsHtml}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Harven Finance Newsletter</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <center>
    <table width="640" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:640px;background:#FFFFFF;">

      <!-- Header -->
      <tr><td style="padding:36px 32px 28px;text-align:center;border-bottom:1px solid #EEEEEE;">
        <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#9C8A55;">
          Harven Finance · Newsletter
        </p>
        <div style="width:40px;height:1px;background:#9C8A55;margin:16px auto;opacity:0.4;"></div>
        <p style="margin:0;font-family:monospace;font-size:11px;color:#999999;text-transform:capitalize;">
          ${escapeHtml(edition.dateLabel)}
        </p>
      </td></tr>

      <!-- Content -->
      <tr><td style="padding:0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionsHtml}
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:32px;text-align:center;border-top:1px solid #EEEEEE;">
        <p style="margin:0;font-size:11px;color:#999999;">
          Harven Finance Newsletter — Agro · Finanças · Geopolítica
        </p>
        <p style="margin:12px 0 0;font-size:10px;color:#CCCCCC;">
          <a href="{{UNSUB_URL}}" style="color:#CCCCCC;text-decoration:underline;">Descadastrar</a>
        </p>
      </td></tr>

    </table>
  </center>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
