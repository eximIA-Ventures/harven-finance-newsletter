export async function register() {
  // Only run cron on the server (not edge, not client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");

    // Schedule: every day at 9:00 AM (São Paulo time)
    // Cron format: minute hour * * * (0 9 = 9:00)
    cron.default.schedule(
      "0 9 * * *",
      async () => {
        console.log("[CRON] Generating daily newsletter edition...");
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3007";
          const res = await fetch(`${baseUrl}/api/newsletter/briefing`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.CRON_SECRET
                ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
                : {}),
            },
          });

          if (res.ok) {
            const data = await res.json();
            console.log(
              `[CRON] Edition generated: ${data.edition?.id} — ${data.articleCount} articles`
            );
          } else {
            console.error(`[CRON] Failed: ${res.status} ${res.statusText}`);
          }
        } catch (error) {
          console.error("[CRON] Error:", error);
        }
      },
      {
        timezone: "America/Sao_Paulo",
      }
    );

    console.log("[CRON] Newsletter cron scheduled: daily at 09:00 (America/Sao_Paulo)");
  }
}
