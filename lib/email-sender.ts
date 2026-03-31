import { Resend } from "resend";
import { getActiveSubscribers } from "./subscriber-store";
import { StoredEdition } from "./edition-store";
import { logEmailSend } from "./email-log";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "newsletter@harvenfinance.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3007";
const SITE_URL = "https://news.harvenfinance.com";
const LOGO_URL = "https://raw.githubusercontent.com/eximIA-Ventures/harven-finance-newsletter/main/public/harven-finance-logo-dark.png";

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
  const subscribers = await getActiveSubscribers();

  if (subscribers.length === 0) {
    console.log("[EMAIL] No active subscribers");
    return { sent: 0, failed: 0, errors: [] };
  }

  const baseHtml = buildEmailHtml(edition);
  const subject = edition.headline;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Build personalized emails (each has unique unsubscribe URL)
  const emailPayloads = subscribers.map((sub) => ({
    from: `Harven Finance Newsletter <${FROM_EMAIL}>`,
    to: sub.email,
    subject,
    html: baseHtml.replace(
      "{{UNSUB_URL}}",
      `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`
    ),
  }));

  // Resend batch API: up to 100 emails per call, rate-limited internally
  const BATCH_LIMIT = 100;
  for (let i = 0; i < emailPayloads.length; i += BATCH_LIMIT) {
    const chunk = emailPayloads.slice(i, i + BATCH_LIMIT);

    try {
      const { data, error } = await resend.batch.send(chunk);

      if (error) {
        // Entire batch failed
        console.error(`[EMAIL] Batch error:`, error);
        for (const payload of chunk) {
          failed++;
          errors.push(error.message || "Batch send failed");
          logEmailSend(edition.id, payload.to as string, null, "failed", error.message).catch(() => {});
        }
        continue;
      }

      // data.data is an array of { id } for each email
      const results = data?.data || [];
      for (let j = 0; j < chunk.length; j++) {
        const recipientEmail = chunk[j].to as string;
        const result = results[j];
        if (result?.id) {
          sent++;
          logEmailSend(edition.id, recipientEmail, result.id, "sent").catch(() => {});
        } else {
          failed++;
          errors.push(`No ID returned for ${recipientEmail}`);
          logEmailSend(edition.id, recipientEmail, null, "failed", "No ID returned").catch(() => {});
        }
      }
    } catch (err: any) {
      console.error(`[EMAIL] Batch exception:`, err);
      for (const payload of chunk) {
        failed++;
        errors.push(err?.message || "Unknown error");
        logEmailSend(edition.id, payload.to as string, null, "failed", err?.message).catch(() => {});
      }
    }

    // Small delay between batches of 100 (if more than 100 subscribers)
    if (i + BATCH_LIMIT < emailPayloads.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`[EMAIL] Sent: ${sent}, Failed: ${failed}, Total subscribers: ${subscribers.length}`);
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
            .map(
              (p) =>
                `<p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#3D3D3D;">${escapeHtml(p)}</p>`
            )
            .join("");

          const imageHtml = item.image
            ? `<a href="${escapeHtml(item.link)}" target="_blank"><img src="${escapeHtml(item.image)}" alt="" style="width:100%;max-height:340px;object-fit:cover;object-position:center top;border-radius:8px;display:block;margin:16px 0 12px;" /></a>`
            : "";

          const sourceHtml = item.link
            ? `<a href="${escapeHtml(item.link)}" style="font-size:12px;color:#9C8A55;text-decoration:none;font-weight:500;" target="_blank">Leia na íntegra — ${escapeHtml(item.source)} &rarr;</a>`
            : "";

          return `
            <tr><td style="padding:24px 0 28px;border-bottom:1px solid #EEECEA;">
              <a href="${escapeHtml(item.link || "#")}" style="text-decoration:none;color:inherit;" target="_blank">
                <p style="margin:0;font-size:21px;font-weight:800;line-height:1.3;color:#1A1A1A;letter-spacing:-0.01em;">
                  ${escapeHtml(item.title)}
                </p>
              </a>
              ${imageHtml}
              ${summaryHtml}
              ${sourceHtml}
            </td></tr>`;
        })
        .join("");

      return `
        <tr><td style="padding:32px 0 12px;border-bottom:2px solid #D4C9A8;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9C8A55;">
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
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Harven Finance Newsletter</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0EDE7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preview text (hidden, shows in inbox list) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(edition.sections[0]?.items[0]?.title || edition.headline)} — Agro, Finanças e Geopolítica
    ${"&nbsp;".repeat(80)}
  </div>

  <center>
    <!-- Outer wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0EDE7;">
      <tr><td align="center" style="padding:24px 16px;">

        <!-- Main card -->
        <table width="640" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:640px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">

          <!-- Logo header -->
          <tr><td style="padding:36px 40px 0;text-align:center;">
            <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Harven Finance" width="200" style="width:200px;height:auto;display:block;margin:0 auto;" />
            </a>
          </td></tr>

          <!-- Gold bar + Newsletter label -->
          <tr><td style="padding:20px 40px 0;text-align:center;">
            <div style="width:50px;height:1px;background:#C4B078;margin:0 auto 16px;opacity:0.5;"></div>
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#9C8A55;">
              Newsletter
            </p>
          </td></tr>

          <!-- Date -->
          <tr><td style="padding:8px 40px 24px;text-align:center;border-bottom:1px solid #EEECEA;">
            <p style="margin:0;font-family:'Courier New',monospace;font-size:12px;color:#999999;text-transform:capitalize;">
              ${escapeHtml(edition.dateLabel)}
            </p>
          </td></tr>

          <!-- Content -->
          <tr><td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${sectionsHtml}
            </table>
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding:32px 40px;text-align:center;">
            <a href="${SITE_URL}" target="_blank" style="display:inline-block;padding:12px 28px;background:#9C8A55;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
              Ver todas as edições
            </a>
          </td></tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;">
            <div style="height:1px;background:#EEECEA;"></div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:28px 40px 32px;text-align:center;">
            <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
              <img src="${LOGO_URL}" alt="Harven Finance" width="120" style="width:120px;height:auto;display:block;margin:0 auto 12px;opacity:0.4;" />
            </a>
            <p style="margin:0;font-size:11px;color:#999999;line-height:1.6;">
              Agro · Finanças · Geopolítica
            </p>
            <p style="margin:6px 0 0;font-size:10px;color:#CCCCCC;">
              Curadoria automatizada com IA · Fontes verificadas
            </p>
            <p style="margin:16px 0 0;font-size:10px;">
              <a href="{{UNSUB_URL}}" style="color:#CCCCCC;text-decoration:underline;">Descadastrar</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${SITE_URL}" style="color:#CCCCCC;text-decoration:underline;">Ver no site</a>
            </p>
          </td></tr>

        </table>
        <!-- /Main card -->

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
