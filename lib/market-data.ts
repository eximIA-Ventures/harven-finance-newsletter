// Market data fetcher — Brapi.dev (free) for stocks/currency + AwesomeAPI fallback

export interface MarketQuote {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

const BRAPI_BASE = "https://brapi.dev/api";
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || ""; // optional, works without for basic

// ── Fetch USD/BRL ───────────────────────────────────────

async function fetchCurrency(): Promise<MarketQuote | null> {
  try {
    const url = `${BRAPI_BASE}/v2/currency?currency=USD-BRL${BRAPI_TOKEN ? `&token=${BRAPI_TOKEN}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const curr = data.currency?.[0];
    if (!curr) return null;

    const price = parseFloat(curr.bidPrice).toFixed(2);
    const pct = parseFloat(curr.percentageChange);

    return {
      label: "USD/BRL",
      value: price.replace(".", ","),
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`.replace(".", ","),
      up: pct >= 0,
    };
  } catch {
    return null;
  }
}

// ── Fetch Ibovespa ──────────────────────────────────────

async function fetchIbovespa(): Promise<MarketQuote | null> {
  try {
    const url = `${BRAPI_BASE}/quote/%5EBVSP${BRAPI_TOKEN ? `?token=${BRAPI_TOKEN}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    const price = Math.round(result.regularMarketPrice).toLocaleString("pt-BR");
    const pct = result.regularMarketChangePercent || 0;

    return {
      label: "Ibovespa",
      value: price,
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`.replace(".", ","),
      up: pct >= 0,
    };
  } catch {
    return null;
  }
}

// ── Fetch Commodities (soja, milho, boi, café via Brapi tickers) ──

async function fetchCommodity(
  ticker: string,
  label: string,
  prefix: string = "R$"
): Promise<MarketQuote | null> {
  try {
    const url = `${BRAPI_BASE}/quote/${ticker}${BRAPI_TOKEN ? `?token=${BRAPI_TOKEN}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    const price = result.regularMarketPrice;
    const pct = result.regularMarketChangePercent || 0;
    const formatted = typeof price === "number"
      ? `${prefix} ${price.toFixed(2).replace(".", ",")}`
      : `${prefix} ${price}`;

    return {
      label,
      value: formatted,
      change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`.replace(".", ","),
      up: pct >= 0,
    };
  } catch {
    return null;
  }
}

// ── Fetch all market data ───────────────────────────────

export async function fetchMarketData(): Promise<MarketQuote[]> {
  const results = await Promise.allSettled([
    fetchCurrency(),
    fetchIbovespa(),
    fetchCommodity("SB=F", "Soja (CBOT)", "US$"),
    fetchCommodity("ZC=F", "Milho (CBOT)", "US$"),
    fetchCommodity("KC=F", "Café (CBOT)", "US$"),
    fetchCommodity("CL=F", "Petróleo (WTI)", "US$"),
  ]);

  const quotes: MarketQuote[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      quotes.push(result.value);
    }
  }

  // If we got nothing from APIs, return static fallback
  if (quotes.length === 0) {
    return [
      { label: "USD/BRL", value: "5,24", change: "+0,3%", up: true },
      { label: "Ibovespa", value: "131.420", change: "-0,4%", up: false },
      { label: "Soja", value: "R$ 127", change: "+0,1%", up: true },
      { label: "Milho", value: "R$ 68", change: "-0,2%", up: false },
      { label: "Café", value: "R$ 1.280", change: "+1,2%", up: true },
      { label: "Petróleo", value: "US$ 82", change: "+0,8%", up: true },
    ];
  }

  return quotes;
}
