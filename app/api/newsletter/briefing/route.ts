import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; // 2 min max for generation
import Anthropic from "@anthropic-ai/sdk";
import { parseAllFeeds } from "@/lib/feed-parser";
import { enrichArticlesWithTopics } from "@/lib/topic-matcher";
import { defaultFeeds } from "@/lib/default-feeds";
import { defaultTopics } from "@/lib/default-topics";
import { saveEdition, getAllEditions, StoredEdition } from "@/lib/edition-store";
import { sendNewsletterToSubscribers } from "@/lib/email-sender";
import { fetchMarketData } from "@/lib/market-data";

interface BriefingArticle {
  title: string;
  summary: string;
  source: string;
  link: string;
  publishedAt: string;
  topic: string;
  image: string | null;
}

interface BriefingSection {
  topic: string;
  label: string;
  emoji: string;
  items: BriefingArticle[];
}

// ─── Fetch article content + og:image ───────────────────

async function fetchArticleData(url: string): Promise<{ content: string; image: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return { content: "", image: null };

    const html = await res.text();

    // Extract og:image
    let image: string | null = null;
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) image = ogMatch[1];

    if (!image) {
      const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twMatch) image = twMatch[1];
    }

    // Strip HTML → text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return { content: text.slice(0, 3000), image };
  } catch {
    return { content: "", image: null };
  }
}

// ═════════════════════════════════════════════════════════
// GET — Returns stored editions (instant, no generation)
// ═════════════════════════════════════════════════════════

export async function GET() {
  const editions = getAllEditions();
  return NextResponse.json({ editions });
}

// ═════════════════════════════════════════════════════════
// POST — Generates a new edition (heavy, call 1x/day via cron)
// ═════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // Optional: cron auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all feeds
    const { articles } = await parseAllFeeds(defaultFeeds);

    // 2. Build set of URLs already used in previous editions (dedup cross-day)
    const previousEditions = getAllEditions();
    const usedUrls = new Set<string>();
    for (const ed of previousEditions) {
      for (const section of ed.sections) {
        for (const item of section.items) {
          usedUrls.add(item.link);
        }
      }
    }
    console.log(`[BRIEFING] ${usedUrls.size} URLs from previous editions excluded`);

    // 3. Filter: only articles from last 24h + not in previous editions
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const freshArticles = articles.filter((a) => {
      const pubDate = new Date(a.publishedAt);
      return pubDate >= cutoff && !usedUrls.has(a.link);
    });
    console.log(`[BRIEFING] ${articles.length} total → ${freshArticles.length} fresh (last 24h, not seen before)`);

    // 4. Enrich with topics
    const enriched = enrichArticlesWithTopics(freshArticles, defaultTopics);

    // 5. Group by topic, pick top 3
    const topicMap: Record<string, string> = {
      "Agronegócio": "agro",
      "Finanças": "finance",
      "Geopolítica": "geo",
    };

    const grouped: Record<string, typeof enriched> = {
      agro: [],
      finance: [],
      geo: [],
    };

    // Also build title fingerprints from previous editions to catch
    // recurring articles like "Soja e trigo hoje: cotações para segunda (17)"
    // vs "Soja e trigo hoje: cotações para terça (18)"
    const usedTitleFingerprints = new Set<string>();
    for (const ed of previousEditions) {
      for (const section of ed.sections) {
        for (const item of section.items) {
          usedTitleFingerprints.add(titleFingerprint(item.title));
        }
      }
    }

    const seen = new Set<string>();
    const seenFingerprints = new Set<string>();
    for (const article of enriched) {
      const fp = titleFingerprint(article.title);
      // Skip if URL already used, or title is too similar to a previous one
      if (seen.has(article.link)) continue;
      if (seenFingerprints.has(fp)) continue;
      if (usedTitleFingerprints.has(fp)) continue;

      for (const match of article.topics) {
        const key = topicMap[match.topic.name];
        if (key) {
          seen.add(article.link);
          seenFingerprints.add(fp);
          grouped[key].push(article);
          break;
        }
      }
    }

    const selected = [
      ...grouped.agro.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3),
      ...grouped.finance.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3),
      ...grouped.geo.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3),
    ];

    // 4. Fetch full content + image (parallel with timeout)
    console.log(`[BRIEFING] Fetching content from ${selected.length} articles...`);
    const contentResults = await Promise.allSettled(
      selected.map(async (article) => {
        console.log(`[BRIEFING] Fetching: ${article.source} - ${article.title.slice(0, 50)}`);
        const { content, image } = await fetchArticleData(article.link);
        console.log(`[BRIEFING] Done: ${article.source} (${content.length} chars, image: ${!!image})`);
        const topicKey = article.topics[0]
          ? topicMap[article.topics[0].topic.name] || "finance"
          : "finance";
        return {
          title: article.title,
          source: article.source,
          link: article.link,
          publishedAt: article.publishedAt,
          topic: topicKey,
          content: content || article.description,
          image,
        };
      })
    );
    console.log(`[BRIEFING] All fetches complete. Sending to AI...`);

    const articlesWithContent = contentResults
      .filter((r): r is PromiseFulfilledResult<{
        title: string; source: string; link: string; publishedAt: string;
        topic: string; content: string; image: string | null;
      }> => r.status === "fulfilled")
      .map((r) => r.value);

    // 5. AI summarization
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const sections = buildSections(
        articlesWithContent.map((a) => ({
          ...a,
          summary: a.content.slice(0, 250) + "...",
        }))
      );
      const edition = persistEdition(sections, articlesWithContent.length);
      return NextResponse.json({ edition, generated: false });
    }

    const client = new Anthropic({ apiKey });

    const articlesPrompt = articlesWithContent
      .map((a, i) => `[${i}] TÍTULO: ${a.title}\nFONTE: ${a.source}\nTÓPICO: ${a.topic}\nCONTEÚDO:\n${a.content}\n`)
      .join("\n---\n\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10000,
      messages: [{
        role: "user",
        content: `Você é o editor da Harven Finance Newsletter, um briefing diário de inteligência sobre Agronegócio, Finanças e Geopolítica.

Abaixo estão artigos completos coletados hoje. Para CADA artigo, escreva um resumo de EXATAMENTE 4 parágrafos curtos que:

- Primeiro parágrafo: O que aconteceu (fatos objetivos)
- Segundo parágrafo: Contexto (o que levou a isso, antecedentes relevantes)
- Terceiro parágrafo: Impacto (consequências práticas, quem é afetado)
- Quarto parágrafo: Perspectiva (o que esperar, próximos desdobramentos)
- Tom: direto, profissional, como Bloomberg/Reuters
- Português brasileiro
- Sem opinião pessoal — fatos e análise
- Cada parágrafo deve ter 2-3 frases no máximo

Responda APENAS com JSON neste formato:
{
  "summaries": [
    { "index": 0, "summary": "Parágrafo 1.\\n\\nParágrafo 2.\\n\\nParágrafo 3.\\n\\nParágrafo 4." },
    { "index": 1, "summary": "..." }
  ]
}

ARTIGOS:

${articlesPrompt}`,
      }],
    });

    // Parse AI response
    const aiText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    let summaries: Record<number, string> = {};
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          summaries: { index: number; summary: string }[];
        };
        for (const s of parsed.summaries) {
          summaries[s.index] = s.summary;
        }
      } catch {
        // fallback below
      }
    }

    // 6. Build final
    const finalArticles: BriefingArticle[] = articlesWithContent.map((a, i) => ({
      title: a.title,
      summary: summaries[i] || a.content.slice(0, 250) + "...",
      source: a.source,
      link: a.link,
      publishedAt: a.publishedAt,
      topic: a.topic,
      image: a.image,
    }));

    const sections = buildSections(finalArticles);
    const edition = await persistEditionWithMarket(sections, finalArticles.length);

    // Send to subscribers
    const emailResult = await sendNewsletterToSubscribers(edition);

    return NextResponse.json({
      edition,
      generated: true,
      articleCount: finalArticles.length,
      email: emailResult,
    });
  } catch (error) {
    console.error("Briefing generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing", details: String(error) },
      { status: 500 }
    );
  }
}

// ─── Helpers ────────────────────────────────────────────

async function persistEditionWithMarket(sections: BriefingSection[], articleCount: number): Promise<StoredEdition> {
  const marketData = await fetchMarketData();
  return persistEdition(sections, articleCount, marketData);
}

function persistEdition(sections: BriefingSection[], articleCount: number, marketData?: any[]): StoredEdition {
  const todayId = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const edition: StoredEdition = {
    id: todayId,
    date: new Date().toISOString(),
    dateLabel: todayLabel,
    headline: sections[0]?.items[0]?.title || "Briefing do dia",
    articleCount,
    marketData: marketData || undefined,
    sections,
  };
  saveEdition(edition);
  return edition;
}

// Normalize title to a fingerprint — strips dates, numbers, punctuation
// so "Soja e trigo hoje: cotações para quinta (19)" and
// "Soja e trigo hoje: cotações para sexta (20)" produce the same fingerprint
function titleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .replace(/\d+/g, "")             // remove numbers
    .replace(/segunda|terça|quarta|quinta|sexta|sábado|domingo/g, "") // remove weekdays
    .replace(/janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/g, "")
    .replace(/[^\w\s]/g, "")         // remove punctuation
    .replace(/\s+/g, " ")            // collapse spaces
    .trim()
    .slice(0, 50);                   // first 50 chars is enough for matching
}

function buildSections(articles: BriefingArticle[]): BriefingSection[] {
  const config: Record<string, { label: string; emoji: string }> = {
    agro: { label: "Agronegócio", emoji: "🌾" },
    finance: { label: "Finanças", emoji: "📊" },
    geo: { label: "Geopolítica", emoji: "🌍" },
  };

  return ["agro", "finance", "geo"]
    .map((topic) => ({
      topic,
      ...config[topic],
      items: articles.filter((a) => a.topic === topic),
    }))
    .filter((s) => s.items.length > 0);
}
