import { NextRequest, NextResponse } from "next/server";

const BRAPI_BASE = "https://brapi.dev/api";
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || "";

const TICKER_MAP: Record<string, string> = {
  "USD/BRL": "USD-BRL",
  "Ibovespa": "%5EBVSP",
  "Soja (CBOT)": "SB%3DF",
  "Milho (CBOT)": "ZC%3DF",
  "Café (CBOT)": "KC%3DF",
  "Petróleo (WTI)": "CL%3DF",
};

const PERIOD_CONFIG: Record<string, { range: string; interval: string; currencyDays: number }> = {
  "1d": { range: "1d", interval: "15m", currencyDays: 1 },
  "7d": { range: "5d", interval: "1d", currencyDays: 7 },
  "30d": { range: "1mo", interval: "1d", currencyDays: 30 },
};

const historyCache: Record<string, { data: any; time: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get("label") || "";
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const ticker = TICKER_MAP[label];
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG["7d"];

  if (!ticker) {
    return NextResponse.json({ error: "Unknown ticker" }, { status: 400 });
  }

  const cacheKey = `${label}_${period}`;
  const cached = historyCache[cacheKey];
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const isCurrency = label === "USD/BRL";
    let points: { date: string; value: number }[] = [];

    if (isCurrency) {
      const res = await fetch(
        `https://economia.awesomeapi.com.br/json/daily/USD-BRL/${config.currencyDays}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        points = data
          .map((d: any) => ({
            date: new Date(parseInt(d.timestamp) * 1000).toISOString().slice(0, period === "1d" ? 16 : 10),
            value: parseFloat(d.bid),
          }))
          .reverse();
      }
    } else {
      const url = `${BRAPI_BASE}/quote/${ticker}?range=${config.range}&interval=${config.interval}${BRAPI_TOKEN ? `&token=${BRAPI_TOKEN}` : ""}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const hist = data.results?.[0]?.historicalDataPrice || [];
        points = hist.map((h: any) => ({
          date: new Date(h.date * 1000).toISOString().slice(0, period === "1d" ? 16 : 10),
          value: h.close,
        }));
      }
    }

    // Fallback: synthetic data
    if (points.length === 0) {
      const baseValues: Record<string, number> = {
        "USD/BRL": 5.24, "Ibovespa": 131420, "Soja (CBOT)": 1050,
        "Milho (CBOT)": 450, "Café (CBOT)": 380, "Petróleo (WTI)": 82,
      };
      const base = baseValues[label] || 100;
      const count = period === "1d" ? 24 : period === "7d" ? 7 : 30;
      let val = base;
      points = Array.from({ length: count }, (_, i) => {
        const d = new Date();
        if (period === "1d") d.setHours(d.getHours() - (count - 1 - i));
        else d.setDate(d.getDate() - (count - 1 - i));
        val = val * (1 + (Math.random() - 0.48) * 0.02);
        return {
          date: d.toISOString().slice(0, period === "1d" ? 16 : 10),
          value: Number(val.toFixed(2)),
        };
      });
    }

    const result = { label, period, points };
    historyCache[cacheKey] = { data: result, time: Date.now() };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ label, period, points: [] });
  }
}
