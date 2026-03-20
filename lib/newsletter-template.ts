import { NewsletterSection } from "./newsletter-generator";

interface TemplateData {
  date: string;
  dateLabel: string;
  sections: NewsletterSection[];
  headline: string;
}

export function renderNewsletterHtml(data: TemplateData): string {
  const { dateLabel, sections, headline } = data;

  const sectionsHtml = sections
    .filter((s) => s.items.length > 0)
    .map((section) => {
      const itemsHtml = section.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 0 0 20px 0;">
            <a href="${escapeHtml(item.link)}" style="text-decoration: none; color: inherit;" target="_blank">
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #F5F5F5; line-height: 1.4;">
                ${escapeHtml(item.title)}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.65; color: #A0A0A0;">
                ${escapeHtml(item.summary)}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #5A5A5A;">
                ${escapeHtml(item.source)}
              </p>
            </a>
          </td>
        </tr>`
        )
        .join("");

      return `
      <tr>
        <td style="padding: 24px 32px;">
          <p style="margin: 0 0 16px 0; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #B8A16B;">
            ${escapeHtml(section.topicLabel)}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${itemsHtml}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px;">
          <div style="height: 1px; background: #202020;"></div>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Harven Finance Newsletter</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td { font-family: 'Inter', Helvetica, Arial, sans-serif; }
    a { color: #B8A16B; }
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .content { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; color: #F5F5F5;">
  <center>
    <table class="wrapper" width="640" cellpadding="0" cellspacing="0" role="presentation"
      style="margin: 0 auto; background-color: #050505; max-width: 640px;">

      <!-- Header -->
      <tr>
        <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #202020;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #F5F5F5; letter-spacing: -0.01em;">
            Harven Finance
          </p>
          <p style="margin: 4px 0 0 0; font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #B8A16B;">
            NEWSLETTER
          </p>
          <div style="width: 60px; height: 1px; background: #B8A16B; margin: 16px auto 0; opacity: 0.5;"></div>
          <p style="margin: 12px 0 0 0; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #5A5A5A;">
            ${escapeHtml(dateLabel)}
          </p>
        </td>
      </tr>

      <!-- Headline -->
      <tr>
        <td style="padding: 24px 32px; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #F5F5F5; line-height: 1.3; letter-spacing: -0.01em;">
            ${escapeHtml(headline)}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px;">
          <div style="height: 1px; background: #202020;"></div>
        </td>
      </tr>

      <!-- Sections -->
      ${sectionsHtml}

      <!-- Footer -->
      <tr>
        <td style="padding: 32px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #5A5A5A; line-height: 1.6;">
            Harven Finance Newsletter
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #5A5A5A;">
            Agro · Finanças · Geopolítica
          </p>
          <div style="width: 40px; height: 1px; background: #B8A16B; margin: 16px auto; opacity: 0.3;"></div>
          <p style="margin: 0; font-size: 10px; color: #3A3A3A;">
            &copy; ${new Date().getFullYear()} Harven Finance
          </p>
        </td>
      </tr>

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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
