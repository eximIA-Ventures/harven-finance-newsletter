export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    // Always use localhost for internal cron calls (container can't resolve external hostname)
    const port = process.env.PORT || "3000";
    const baseUrl = `http://localhost:${port}`;
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

    // ── Startup Recovery ──────────────────────────────────
    // Check if any scheduled jobs were missed due to container restart.
    // Runs 30s after startup to ensure the server is ready to handle requests.
    setTimeout(async () => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const hour = now.getHours();
      const day = now.getDay(); // 0=Sun, 6=Sat
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

      console.log("[RECOVERY] Checking for missed cron jobs...");

      // Check missed daily (if after 9:00 and today's edition doesn't exist)
      if (hour >= 9) {
        try {
          const edRes = await fetch(`${baseUrl}/api/newsletter/editions`);
          const editions = await edRes.json();
          const list = Array.isArray(editions) ? editions : editions.editions || [];
          const todayExists = list.some((e: { id: string }) => e.id === dateStr);

          if (!todayExists) {
            console.log(`[RECOVERY] Missed daily for ${dateStr} — generating now`);
            const res = await fetch(`${baseUrl}/api/newsletter/briefing`, { method: "POST", headers });
            if (res.ok) {
              const data = await res.json();
              console.log(`[RECOVERY] Daily recovered: ${data.edition?.id}`);
            }
          }
        } catch (error) {
          console.error("[RECOVERY] Daily check error:", error);
        }
      }

      // Check missed weekly (if Saturday after 10:00 and this week's digest doesn't exist)
      if (day === 6 && hour >= 10) {
        try {
          const weekNum = getISOWeekNumber(now);
          const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
          const edRes = await fetch(`${baseUrl}/api/newsletter/editions`);
          const editions = await edRes.json();
          const list = Array.isArray(editions) ? editions : editions.editions || [];
          const weekExists = list.some((e: { id: string }) => e.id === weekId);

          if (!weekExists) {
            console.log(`[RECOVERY] Missed weekly ${weekId} — generating now`);
            const res = await fetch(`${baseUrl}/api/newsletter/digest`, {
              method: "POST",
              headers,
              body: JSON.stringify({ type: "weekly" }),
            });
            if (res.ok) {
              const data = await res.json();
              console.log(`[RECOVERY] Weekly recovered: ${data.edition?.id}`);
            }
          }
        } catch (error) {
          console.error("[RECOVERY] Weekly check error:", error);
        }
      }

      // Check missed monthly (if day 1 after 10:00 and this month's digest doesn't exist)
      if (now.getDate() === 1 && hour >= 10) {
        try {
          const monthId = `${now.getFullYear()}-M${String(now.getMonth() + 1).padStart(2, "0")}`;
          const edRes = await fetch(`${baseUrl}/api/newsletter/editions`);
          const editions = await edRes.json();
          const list = Array.isArray(editions) ? editions : editions.editions || [];
          const monthExists = list.some((e: { id: string }) => e.id === monthId);

          if (!monthExists) {
            console.log(`[RECOVERY] Missed monthly ${monthId} — generating now`);
            const res = await fetch(`${baseUrl}/api/newsletter/digest`, {
              method: "POST",
              headers,
              body: JSON.stringify({ type: "monthly" }),
            });
            if (res.ok) {
              const data = await res.json();
              console.log(`[RECOVERY] Monthly recovered: ${data.edition?.id}`);
            }
          }
        } catch (error) {
          console.error("[RECOVERY] Monthly check error:", error);
        }
      }

      console.log("[RECOVERY] Check complete.");
    }, 30_000); // 30s delay for server readiness
  }
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
