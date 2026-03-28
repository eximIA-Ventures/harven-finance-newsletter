import Anthropic from "@anthropic-ai/sdk";
import { ArticleWithTopics } from "./types";

// ── Types ───────────────────────────────────────────────

interface CurationArticleResult {
  index: number;
  keep: boolean;
  duplicate_of?: number | null;
  impact: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

interface CurationTopicResult {
  topic: string;
  articles: CurationArticleResult[];
}

interface CurationResponse {
  topics: CurationTopicResult[];
}

// ── Impact multipliers ──────────────────────────────────

const IMPACT_MULTIPLIER: Record<string, number> = {
  HIGH: 2.0,
  MEDIUM: 1.0,
  LOW: 0.5,
};

const TOPIC_LABELS: Record<string, string> = {
  agro: "Agronegócio",
  finance: "Finanças",
  geo: "Geopolítica",
};

// ── Main curation function ──────────────────────────────

export async function curateArticles(
  grouped: Record<string, ArticleWithTopics[]>,
  finalCount: number = 3
): Promise<Record<string, ArticleWithTopics[]>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackCuration(grouped, finalCount);
  }

  // Skip curation if no topic has more candidates than finalCount
  const needsCuration = Object.values(grouped).some(
    (articles) => articles.length > finalCount
  );
  if (!needsCuration) {
    return grouped;
  }

  try {
    const client = new Anthropic({ apiKey });

    // Build prompt with all candidate articles across topics
    const articlesText = Object.entries(grouped)
      .filter(([, articles]) => articles.length > 0)
      .map(([topicId, articles]) => {
        const section = articles
          .map((a, i) => {
            const age = getArticleAge(a.publishedAt);
            return `  [${i}] "${a.title}" (${a.source}, ${age})\n      ${a.description.slice(0, 200)}`;
          })
          .join("\n\n");
        return `=== ${TOPIC_LABELS[topicId] || topicId} (${topicId}) ===\n${section}`;
      })
      .join("\n\n---\n\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Você é o motor editorial da Harven Finance Newsletter — briefing de inteligência para investidores e produtores rurais brasileiros.

Analise os artigos candidatos abaixo e execute 2 tarefas para CADA editoria:

1. **DEDUPLICAÇÃO**: Identifique artigos que cobrem o MESMO evento/fato. Para cada grupo de duplicatas, marque "keep": true APENAS no mais completo e informativo. Os demais recebem "keep": false.

2. **IMPACTO**: Classifique cada artigo:
   - **HIGH**: Move mercado, exige atenção imediata de investidores/produtores
   - **MEDIUM**: Relevante para decisões futuras, desenvolvimento notável
   - **LOW**: Meramente informativo, sem urgência ou impacto prático

Responda APENAS com JSON válido (sem markdown):
{
  "topics": [
    {
      "topic": "topicId",
      "articles": [
        { "index": 0, "keep": true, "impact": "HIGH", "reason": "breve justificativa" },
        { "index": 1, "keep": false, "duplicate_of": 0, "impact": "MEDIUM", "reason": "mesmo evento que [0], cobertura inferior" }
      ]
    }
  ]
}

ARTIGOS CANDIDATOS:

${articlesText}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackCuration(grouped, finalCount);

    const parsed = JSON.parse(jsonMatch[0]) as CurationResponse;
    return applyCuration(grouped, parsed, finalCount);
  } catch {
    return fallbackCuration(grouped, finalCount);
  }
}

// ── Apply curation results ──────────────────────────────

function applyCuration(
  grouped: Record<string, ArticleWithTopics[]>,
  curation: CurationResponse,
  finalCount: number
): Record<string, ArticleWithTopics[]> {
  const result: Record<string, ArticleWithTopics[]> = {};

  for (const section of curation.topics) {
    const topicId = section.topic;
    const candidates = grouped[topicId];
    if (!candidates) continue;

    const curated = section.articles
      .filter((a) => a.keep !== false && candidates[a.index])
      .map((a) => {
        const article = { ...candidates[a.index] };
        const multiplier = IMPACT_MULTIPLIER[a.impact] ?? 1.0;
        article.relevanceScore = article.relevanceScore * multiplier;
        return article;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, finalCount);

    result[topicId] = curated;
  }

  // Fallback for any topic not in Claude's response
  for (const topicId of Object.keys(grouped)) {
    if (!result[topicId]) {
      result[topicId] = grouped[topicId].slice(0, finalCount);
    }
  }

  return result;
}

// ── Fallback (no AI available) ──────────────────────────

function fallbackCuration(
  grouped: Record<string, ArticleWithTopics[]>,
  finalCount: number
): Record<string, ArticleWithTopics[]> {
  const result: Record<string, ArticleWithTopics[]> = {};
  for (const [topicId, articles] of Object.entries(grouped)) {
    result[topicId] = articles.slice(0, finalCount);
  }
  return result;
}

// ── Helpers ─────────────────────────────────────────────

function getArticleAge(publishedAt: string): string {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  if (hours < 1) return "< 1h atrás";
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}
