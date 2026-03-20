export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3007";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.CRON_SECRET) {
      headers["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
    }

    // ── Newsletter: daily at 9:00 AM ────────────────────
    cron.default.schedule(
      "0 9 * * *",
      async () => {
        console.log("[CRON] Generating daily newsletter edition...");
        try {
          const res = await fetch(`${baseUrl}/api/newsletter/briefing`, {
            method: "POST",
            headers,
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[CRON] Edition generated: ${data.edition?.id} — ${data.articleCount} articles`);
          } else {
            console.error(`[CRON] Newsletter failed: ${res.status}`);
          }
        } catch (error) {
          console.error("[CRON] Newsletter error:", error);
        }
      },
      { timezone: "America/Sao_Paulo" }
    );

    // ── Cotações: 9h, 12h, 16h, 20h ────────────────────
    cron.default.schedule(
      "0 9,12,16,20 * * *",
      async () => {
        console.log("[CRON] Refreshing market data...");
        try {
          const res = await fetch(`${baseUrl}/api/market?refresh=true`);
          if (res.ok) {
            const data = await res.json();
            console.log(`[CRON] Market data refreshed: ${data.quotes?.length} quotes`);
          } else {
            console.error(`[CRON] Market refresh failed: ${res.status}`);
          }
        } catch (error) {
          console.error("[CRON] Market error:", error);
        }
      },
      { timezone: "America/Sao_Paulo" }
    );

    console.log("[CRON] Scheduled: newsletter at 09:00 | market at 09:00, 12:00, 16:00, 20:00 (America/Sao_Paulo)");
  }
}
