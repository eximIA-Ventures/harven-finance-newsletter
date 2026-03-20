import Anthropic from "@anthropic-ai/sdk";
import { getAllEditions, saveEdition, StoredEdition } from "./edition-store";
import { fetchMarketData } from "./market-data";

type DigestType = "weekly" | "monthly";

// Get editions within a date range
function getEditionsInRange(start: Date, end: Date): StoredEdition[] {
  const all = getAllEditions();
  return all.filter((ed) => {
    // Only include daily editions (not other digests)
    if (ed.id.includes("week") || ed.id.includes("month")) return false;
    const d = new Date(ed.date);
    return d >= start && d <= end;
  });
}

// Extract all articles from a set of editions
function extractAllArticles(editions: StoredEdition[]) {
  const articles: { title: string; summary: string; source: string; topic: string; date: string }[] = [];
  for (const ed of editions) {
    for (const section of ed.sections) {
      for (const item of section.items) {
        articles.push({
          title: item.title,
          summary: item.summary.split("\n\n")[0] || "",
          source: item.source,
          topic: section.label,
          date: ed.dateLabel,
        });
      }
    }
  }
  return articles;
}

export async function generateDigest(type: DigestType): Promise<StoredEdition | null> {
  const now = new Date();
  let start: Date;
  let id: string;
  let label: string;

  if (type === "weekly") {
    // Last 7 days
    start = new Date(now);
    start.setDate(start.getDate() - 7);
    const weekNum = getWeekNumber(now);
    id = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    label = `Resumo Semanal — Semana ${weekNum}, ${now.getFullYear()}`;
  } else {
    // Last 30 days
    start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    const monthName = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    id = `${now.getFullYear()}-M${String(now.getMonth() + 1).padStart(2, "0")}`;
    label = `Resumo Mensal — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
  }

  const editions = getEditionsInRange(start, now);

  if (editions.length === 0) {
    console.log(`[DIGEST] No editions found for ${type} digest`);
    return null;
  }

  const allArticles = extractAllArticles(editions);
  console.log(`[DIGEST] Generating ${type} digest from ${editions.length} editions, ${allArticles.length} articles`);

  // Group by topic
  const byTopic: Record<string, typeof allArticles> = {};
  for (const art of allArticles) {
    if (!byTopic[art.topic]) byTopic[art.topic] = [];
    byTopic[art.topic].push(art);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: pick top articles per topic
    return buildFallbackDigest(id, label, type, byTopic, editions.length);
  }

  const client = new Anthropic({ apiKey });

  // Build prompt with all articles grouped by topic
  const articlesText = Object.entries(byTopic)
    .map(([topic, articles]) => {
      const list = articles
        .map((a) => `- "${a.title}" (${a.source}, ${a.date}): ${a.summary}`)
        .join("\n");
      return `=== ${topic.toUpperCase()} ===\n${list}`;
    })
    .join("\n\n");

  const periodLabel = type === "weekly" ? "da semana" : "do mês";
  const periodDays = type === "weekly" ? "7 dias" : "30 dias";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `Você é o editor da Harven Finance Newsletter. Abaixo estão TODAS as notícias cobertas nos últimos ${periodDays} (${editions.length} edições diárias, ${allArticles.length} matérias).

Crie um RESUMO ${type === "weekly" ? "SEMANAL" : "MENSAL"} com:

Para CADA editoria (Agronegócio, Finanças, Geopolítica), escreva:
1. **Panorama** (2-3 parágrafos): Os grandes movimentos ${periodLabel}. O que definiu o período.
2. **Destaques** (3-5 bullets): As notícias mais impactantes, com contexto.
3. **O que observar** (1 parágrafo): O que acompanhar na próxima semana/mês.

Tom: analítico, profissional, Bloomberg/Reuters. Português brasileiro.
NÃO repita notícias individuais — SINTETIZE tendências e movimentos.

Responda em JSON:
{
  "sections": [
    {
      "topic": "agro",
      "label": "Agronegócio",
      "panorama": "Texto do panorama...",
      "highlights": ["Destaque 1", "Destaque 2", "Destaque 3"],
      "outlook": "O que observar..."
    }
  ]
}

NOTÍCIAS DO PERÍODO:

${articlesText}`,
    }],
  });

  const aiText = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return buildFallbackDigest(id, label, type, byTopic, editions.length);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      sections: {
        topic: string;
        label: string;
        panorama: string;
        highlights: string[];
        outlook: string;
      }[];
    };

    // Build edition with digest format
    const sections = parsed.sections.map((s) => ({
      topic: s.topic,
      label: s.label,
      emoji: "",
      items: [
        {
          title: `Panorama ${s.label}`,
          summary: s.panorama,
          source: `${editions.length} edições analisadas`,
          link: "",
          publishedAt: now.toISOString(),
          topic: s.topic,
          image: null,
        },
        {
          title: `Destaques ${s.label}`,
          summary: s.highlights.map((h) => `• ${h}`).join("\n\n"),
          source: "",
          link: "",
          publishedAt: now.toISOString(),
          topic: s.topic,
          image: null,
        },
        {
          title: `O que observar`,
          summary: s.outlook,
          source: "",
          link: "",
          publishedAt: now.toISOString(),
          topic: s.topic,
          image: null,
        },
      ],
    }));

    const marketData = await fetchMarketData();

    const edition: StoredEdition = {
      id,
      date: now.toISOString(),
      dateLabel: label,
      headline: `Resumo ${type === "weekly" ? "Semanal" : "Mensal"} — ${editions.length} edições, ${allArticles.length} matérias`,
      articleCount: allArticles.length,
      marketData,
      sections,
    };

    saveEdition(edition);
    console.log(`[DIGEST] ${type} digest saved: ${id}`);
    return edition;
  } catch {
    return buildFallbackDigest(id, label, type, byTopic, editions.length);
  }
}

function buildFallbackDigest(
  id: string,
  label: string,
  type: DigestType,
  byTopic: Record<string, { title: string; summary: string; source: string; topic: string; date: string }[]>,
  editionCount: number
): StoredEdition {
  const topicLabels: Record<string, string> = {
    "Agronegócio": "agro",
    "Finanças": "finance",
    "Geopolítica": "geo",
  };

  const sections = Object.entries(byTopic).map(([topic, articles]) => ({
    topic: topicLabels[topic] || topic.toLowerCase(),
    label: topic,
    emoji: "",
    items: articles.slice(0, 5).map((a) => ({
      title: a.title,
      summary: a.summary,
      source: a.source,
      link: "",
      publishedAt: new Date().toISOString(),
      topic: topicLabels[topic] || topic.toLowerCase(),
      image: null,
    })),
  }));

  const edition: StoredEdition = {
    id,
    date: new Date().toISOString(),
    dateLabel: label,
    headline: `Resumo ${type === "weekly" ? "Semanal" : "Mensal"} — ${editionCount} edições`,
    articleCount: Object.values(byTopic).flat().length,
    sections,
  };

  saveEdition(edition);
  return edition;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
