import Parser from "rss-parser";
import { FeedSource, FeedArticle, FeedHealth } from "./types";
import { stripHtml, generateId } from "./utils";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "HarvenFinance/1.0 (RSS Reader)",
    Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
    "Accept-Charset": "utf-8",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["dc:creator", "creator"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// Fix encoding: try to recover garbled UTF-8, remove junk chars
function fixEncoding(text: string): string {
  let fixed = text;

  // Try to fix double-encoded UTF-8 (common with latin1 feeds)
  try {
    // Detect if text has mojibake patterns
    if (/[\u00C0-\u00FF][\u0080-\u00BF]/.test(fixed)) {
      const bytes = Buffer.from(fixed, "latin1");
      const decoded = bytes.toString("utf-8");
      // Only use decoded if it reduced weird chars
      if (decoded.length <= fixed.length && !/\ufffd/.test(decoded)) {
        fixed = decoded;
      }
    }
  } catch {
    // keep original
  }

  return fixed
    .replace(/\ufffd/g, "")
    .replace(/\u0000/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

export async function parseFeed(
  source: FeedSource
): Promise<{ articles: FeedArticle[]; health: FeedHealth }> {
  const health: FeedHealth = {
    sourceId: source.id,
    lastSuccess: null,
    lastError: null,
    errorCount: 0,
    articleCount: 0,
  };

  try {
    const feed = await parser.parseURL(source.url);
    const articles: FeedArticle[] = (feed.items || [])
      .slice(0, 20)
      .map((item) => {
        const description = item.contentSnippet
          || (item.content ? stripHtml(item.content) : "")
          || (item.summary ? stripHtml(item.summary) : "")
          || "";

        const categories = ((item.categories as (string | { _: string })[] | undefined) || []).map((c) =>
          typeof c === "string" ? c : String(c)
        );

        return {
          id: generateId(),
          title: fixEncoding(item.title ? stripHtml(item.title) : "Sem título"),
          link: item.link || "",
          source: source.name,
          sourceId: source.id,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          description: fixEncoding(description.slice(0, 300)),
          category: source.category,
          categories,
        };
      });

    health.lastSuccess = new Date().toISOString();
    health.articleCount = articles.length;

    return { articles, health };
  } catch (error) {
    health.lastError =
      error instanceof Error ? error.message : "Erro desconhecido";
    health.errorCount = 1;

    return { articles: [], health };
  }
}

export async function parseAllFeeds(
  sources: FeedSource[]
): Promise<{
  articles: FeedArticle[];
  healthMap: Record<string, FeedHealth>;
}> {
  const enabledSources = sources.filter((s) => s.enabled);

  const results = await Promise.allSettled(
    enabledSources.map((source) => parseFeed(source))
  );

  const articles: FeedArticle[] = [];
  const healthMap: Record<string, FeedHealth> = {};

  results.forEach((result, index) => {
    const source = enabledSources[index];
    if (result.status === "fulfilled") {
      articles.push(...result.value.articles);
      healthMap[source.id] = result.value.health;
    } else {
      healthMap[source.id] = {
        sourceId: source.id,
        lastSuccess: null,
        lastError: result.reason?.message || "Feed inacessível",
        errorCount: 1,
        articleCount: 0,
      };
    }
  });

  // Sort by date, newest first
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return { articles, healthMap };
}
