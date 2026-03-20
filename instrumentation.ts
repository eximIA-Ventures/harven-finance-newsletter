export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3007";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.CRON_SECRET) {
      headers["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
    }

    // ── Newsletter diária: 9:00 AM ─────────────────────
    cron.default.schedule(
      "0 9 * * *",
      async () => {
        console.log("[CRON] Generating daily newsletter...");
        try {
          const res = await fetch(`${baseUrl}/api/newsletter/briefing`, { method: "POST", headers });
          if (res.ok) {
            const data = await res.json();
            console.log(`[CRON] Daily edition: ${data.edition?.id} — ${data.articleCount} articles`);
          } else {
            console.error(`[CRON] Daily failed: ${res.status}`);
          }
        } catch (error) {
          console.error("[CRON] Daily error:", error);
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
            console.log(`[CRON] Market: ${data.quotes?.length} quotes`);
          }
        } catch (error) {
          console.error("[CRON] Market error:", error);
        }
      },
      { timezone: "America/Sao_Paulo" }
    );

    // ── Resumo semanal: sábado 10:00 AM ─────────────────
    cron.default.schedule(
      "0 10 * * 6",
      async () => {
        console.log("[CRON] Generating weekly digest...");
        try {
          const res = await fetch(`${baseUrl}/api/newsletter/digest`, {
            method: "POST",
            headers,
            body: JSON.stringify({ type: "weekly" }),
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[CRON] Weekly digest: ${data.edition?.id}`);
          } else {
            console.error(`[CRON] Weekly failed: ${res.status}`);
          }
        } catch (error) {
          console.error("[CRON] Weekly error:", error);
        }
      },
      { timezone: "America/Sao_Paulo" }
    );

    // ── Resumo mensal: dia 1 de cada mês, 10:00 AM ─────
    cron.default.schedule(
      "0 10 1 * *",
      async () => {
        console.log("[CRON] Generating monthly digest...");
        try {
          const res = await fetch(`${baseUrl}/api/newsletter/digest`, {
            method: "POST",
            headers,
            body: JSON.stringify({ type: "monthly" }),
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[CRON] Monthly digest: ${data.edition?.id}`);
          } else {
            console.error(`[CRON] Monthly failed: ${res.status}`);
          }
        } catch (error) {
          console.error("[CRON] Monthly error:", error);
        }
      },
      { timezone: "America/Sao_Paulo" }
    );

    console.log("[CRON] Scheduled:");
    console.log("  Daily newsletter:  09:00 (seg-dom)");
    console.log("  Market data:       09:00, 12:00, 16:00, 20:00");
    console.log("  Weekly digest:     sábado 10:00");
    console.log("  Monthly digest:    dia 1, 10:00");
  }
}
