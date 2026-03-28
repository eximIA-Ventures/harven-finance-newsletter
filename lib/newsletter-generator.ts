import Anthropic from "@anthropic-ai/sdk";
import { parseAllFeeds } from "./feed-parser";
import { enrichArticlesWithTopics } from "./topic-matcher";
import { curateArticles } from "./curation-engine";
import { defaultFeeds } from "./default-feeds";
import { defaultTopics } from "./default-topics";
import { ArticleWithTopics } from "./types";
import { renderNewsletterHtml } from "./newsletter-template";

// ── Types ───────────────────────────────────────────────

export interface NewsletterSection {
  topic: string;
  topicLabel: string;
  items: NewsletterItem[];
}

export interface NewsletterItem {
  title: string;
  summary: string;
  source: string;
  link: string;
  publishedAt: string;
}

export interface NewsletterEdition {
  date: string;
  dateLabel: string;
  sections: NewsletterSection[];
  headline: string;
  html: string;
  articleCount: number;
  sourceCount: number;
}

// ── Config ──────────────────────────────────────────────

const CANDIDATES_PER_TOPIC = 8;     // Candidate pool for AI curation
const FINAL_ARTICLES_PER_TOPIC = 3; // Final selection after curation

// ── Source credibility map ──────────────────────────────

const SOURCE_WEIGHTS = new Map(
  defaultFeeds.map((f) => [f.id, f.credibilityWeight ?? 1.0])
);

// ── Pipeline ────────────────────────────────────────────

export async function generateNewsletter(): Promise<NewsletterEdition> {
  // Step 1: Fetch all feeds
  const { articles } = await parseAllFeeds(defaultFeeds);

  // Step 2: Enrich with topic matching (+ source weight + recency)
  const enriched = enrichArticlesWithTopics(articles, defaultTopics, SOURCE_WEIGHTS);

  // Step 3: Group by topic and pick candidate pool (top 8)
  const candidates = groupByTopic(enriched);

  // Step 4: AI curation — semantic dedup + impact scoring → top 3
  const curated = await curateArticles(candidates, FINAL_ARTICLES_PER_TOPIC);

  // Step 5: AI synthesis — generate summaries
  const sections = await synthesizeWithAI(curated);

  // Step 6: Generate headline
  const headline = await generateHeadline(sections);

  // Step 7: Render HTML
  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = renderNewsletterHtml({
    date: now.toISOString(),
    dateLabel,
    sections,
    headline,
  });

  return {
    date: now.toISOString(),
    dateLabel,
    sections,
    headline,
    html,
    articleCount: sections.reduce((sum, s) => sum + s.items.length, 0),
    sourceCount: new Set(articles.map((a) => a.source)).size,
  };
}

// ── Step 3: Group ───────────────────────────────────────

function groupByTopic(
  articles: ArticleWithTopics[]
): Record<string, ArticleWithTopics[]> {
  const groups: Record<string, ArticleWithTopics[]> = {
    agro: [],
    finance: [],
    geo: [],
  };

  for (const article of articles) {
    for (const match of article.topics) {
      const topicId = match.topic.id;
      if (topicId in groups) {
        groups[topicId].push(article);
      }
    }
  }

  // Deduplicate by link, sort by relevance, take candidate pool
  for (const topicId of Object.keys(groups)) {
    const seen = new Set<string>();
    groups[topicId] = groups[topicId]
      .filter((a) => {
        if (seen.has(a.link)) return false;
        seen.add(a.link);
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, CANDIDATES_PER_TOPIC);
  }

  return groups;
}

// ── Step 4: AI Synthesis ────────────────────────────────

async function synthesizeWithAI(
  grouped: Record<string, ArticleWithTopics[]>
): Promise<NewsletterSection[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: use raw descriptions without AI synthesis
    return fallbackSections(grouped);
  }

  const client = new Anthropic({ apiKey });

  const topicLabels: Record<string, string> = {
    agro: "Agronegócio",
    finance: "Finanças",
    geo: "Geopolítica",
  };

  // Build prompt with all articles
  const articlesText = Object.entries(grouped)
    .map(([topicId, articles]) => {
      const section = articles
        .map(
          (a, i) =>
            `[${topicLabels[topicId]} #${i + 1}] "${a.title}" (${a.source})\n${a.description}`
        )
        .join("\n\n");
      return `=== ${topicLabels[topicId].toUpperCase()} ===\n${section}`;
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Você é o editor da Harven Finance Newsletter, o briefing de inteligência da Harven Finance.

Abaixo estão as notícias mais relevantes de hoje em 3 editorias: Agronegócio, Finanças e Geopolítica.

Para CADA notícia, escreva um resumo de 1-2 frases que:
- Capture a essência da notícia (o que aconteceu e por que importa)
- Use tom direto e profissional (estilo Bloomberg/Reuters)
- Seja em português brasileiro
- NÃO use jargão desnecessário
- NÃO adicione opinião — apenas fatos e contexto

Responda EXATAMENTE neste formato JSON:
{
  "sections": [
    {
      "topic": "agro",
      "items": [
        { "index": 0, "summary": "resumo aqui" },
        { "index": 1, "summary": "resumo aqui" }
      ]
    },
    {
      "topic": "finance",
      "items": [
        { "index": 0, "summary": "resumo aqui" }
      ]
    },
    {
      "topic": "geo",
      "items": [
        { "index": 0, "summary": "resumo aqui" }
      ]
    }
  ]
}

NOTÍCIAS:

${articlesText}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackSections(grouped);

    const parsed = JSON.parse(jsonMatch[0]) as {
      sections: {
        topic: string;
        items: { index: number; summary: string }[];
      }[];
    };

    return parsed.sections.map((section) => {
      const topicArticles = grouped[section.topic] || [];
      return {
        topic: section.topic,
        topicLabel: topicLabels[section.topic] || section.topic,
        items: section.items
          .filter((item) => topicArticles[item.index])
          .map((item) => {
            const article = topicArticles[item.index];
            return {
              title: article.title,
              summary: item.summary,
              source: article.source,
              link: article.link,
              publishedAt: article.publishedAt,
            };
          }),
      };
    });
  } catch {
    return fallbackSections(grouped);
  }
}

// ── Step 5: Headline ────────────────────────────────────

async function generateHeadline(
  sections: NewsletterSection[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "Briefing do dia";
  }

  const client = new Anthropic({ apiKey });

  const topStories = sections
    .flatMap((s) => s.items.slice(0, 2))
    .map((i) => i.title)
    .join("; ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Dadas estas manchetes do dia: "${topStories}"

Crie UMA frase-manchete de no máximo 12 palavras que capture o tema dominante do dia. Tom: direto, sem sensacionalismo. Português brasileiro. Responda APENAS com a frase, sem aspas.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim() || "Briefing do dia";
}

// ── Fallback (no AI) ────────────────────────────────────

function fallbackSections(
  grouped: Record<string, ArticleWithTopics[]>
): NewsletterSection[] {
  const topicLabels: Record<string, string> = {
    agro: "Agronegócio",
    finance: "Finanças",
    geo: "Geopolítica",
  };

  return Object.entries(grouped).map(([topicId, articles]) => ({
    topic: topicId,
    topicLabel: topicLabels[topicId] || topicId,
    items: articles.map((a) => ({
      title: a.title,
      summary: a.description,
      source: a.source,
      link: a.link,
      publishedAt: a.publishedAt,
    })),
  }));
}
