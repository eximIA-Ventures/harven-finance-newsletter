import { appendFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const ANALYTICS_FILE = join(DATA_DIR, "analytics.jsonl");

// ── Types ───���───────────────────────────────────────────

export interface AnalyticsEvent {
  type: "page_view" | "article_click" | "newsletter_open";
  timestamp: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  visitorId: string;
  screenWidth?: number;
  metadata?: Record<string, string>;
}

export interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  daily: DailyStats[];
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  devices: { mobile: number; desktop: number };
  articleClicks: number;
  period: { from: string; to: string };
}

// ── Write ───────────────────────────────────────────────

export function trackEvent(event: AnalyticsEvent): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  appendFileSync(ANALYTICS_FILE, JSON.stringify(event) + "\n", "utf-8");
}

// ── Read ─────────��────────────────────────────���─────────

export function getEvents(daysBack: number = 30): AnalyticsEvent[] {
  if (!existsSync(ANALYTICS_FILE)) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const lines = readFileSync(ANALYTICS_FILE, "utf-8").split("\n").filter(Boolean);
  const events: AnalyticsEvent[] = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as AnalyticsEvent;
      if (new Date(event.timestamp) >= cutoff) {
        events.push(event);
      }
    } catch {
      // Skip malformed lines
    }
  }

  return events;
}

// ── Aggregation ─────────────────────────────────────────

export function getStats(daysBack: number = 30): AnalyticsSummary {
  const events = getEvents(daysBack);
  const pageViews = events.filter((e) => e.type === "page_view");

  // Daily breakdown
  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (const e of pageViews) {
    const date = e.timestamp.split("T")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { views: 0, visitors: new Set() });
    }
    const day = dailyMap.get(date)!;
    day.views++;
    day.visitors.add(e.visitorId);
  }

  const daily: DailyStats[] = Array.from(dailyMap.entries())
    .map(([date, { views, visitors }]) => ({
      date,
      views,
      visitors: visitors.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top pages
  const pathCounts = new Map<string, number>();
  for (const e of pageViews) {
    pathCounts.set(e.path, (pathCounts.get(e.path) || 0) + 1);
  }
  const topPages = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Unique visitors
  const uniqueVisitors = new Set(pageViews.map((e) => e.visitorId)).size;

  // Referrers
  const refCounts = new Map<string, number>();
  for (const e of pageViews) {
    const ref = e.referrer || "";
    if (ref && ref !== "" && ref !== "null") {
      try {
        const host = new URL(ref).hostname || "direct";
        refCounts.set(host, (refCounts.get(host) || 0) + 1);
      } catch {
        refCounts.set("direct", (refCounts.get("direct") || 0) + 1);
      }
    } else {
      refCounts.set("direct", (refCounts.get("direct") || 0) + 1);
    }
  }
  const topReferrers = Array.from(refCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // Device breakdown
  let mobile = 0;
  let desktop = 0;
  for (const e of pageViews) {
    if (e.screenWidth && e.screenWidth < 768) mobile++;
    else desktop++;
  }

  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);

  return {
    totalViews: pageViews.length,
    uniqueVisitors,
    daily,
    topPages,
    topReferrers,
    devices: { mobile, desktop },
    articleClicks: events.filter((e) => e.type === "article_click").length,
    period: { from: from.toISOString(), to: now.toISOString() },
  };
}
