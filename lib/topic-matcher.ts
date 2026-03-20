import {
  FeedArticle,
  Topic,
  TopicMatch,
  ArticleWithTopics,
  TrendingTerm,
} from "./types";

export function matchArticleToTopics(
  article: FeedArticle,
  topics: Topic[]
): TopicMatch[] {
  const matches: TopicMatch[] = [];
  const searchText = `${article.title} ${article.description}`.toLowerCase();

  for (const topic of topics) {
    if (!topic.enabled) continue;

    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of topic.keywords) {
      const kw = keyword.toLowerCase();
      // Count occurrences in title (weight 3x) and description (weight 1x)
      const titleMatches = countOccurrences(
        article.title.toLowerCase(),
        kw
      );
      const descMatches = countOccurrences(searchText, kw);

      if (titleMatches > 0 || descMatches > 0) {
        matchedKeywords.push(keyword);
        score += titleMatches * 3 + descMatches;
      }
    }

    if (matchedKeywords.length > 0) {
      matches.push({ topic, score, matchedKeywords });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function countOccurrences(text: string, keyword: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(keyword, pos)) !== -1) {
    count++;
    pos += keyword.length;
  }
  return count;
}

export function enrichArticlesWithTopics(
  articles: FeedArticle[],
  topics: Topic[]
): ArticleWithTopics[] {
  return articles.map((article) => {
    const topicMatches = matchArticleToTopics(article, topics);
    const relevanceScore = topicMatches.reduce((sum, m) => sum + m.score, 0);
    return {
      ...article,
      topics: topicMatches,
      relevanceScore,
    };
  });
}

// Portuguese stop words to exclude from trending
const STOP_WORDS = new Set([
  "de", "da", "do", "dos", "das", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "sob", "sobre", "entre", "até",
  "que", "como", "mais", "menos", "muito", "pouco",
  "um", "uma", "uns", "umas", "o", "a", "os", "as",
  "é", "são", "foi", "ser", "ter", "há", "ou", "se", "ao",
  "não", "sim", "já", "mas", "também", "pode", "vai",
  "ele", "ela", "eles", "elas", "seu", "sua", "seus", "suas",
  "isso", "isto", "esse", "essa", "este", "esta", "aqui",
  "the", "and", "for", "are", "but", "not", "you", "all",
  "can", "had", "her", "was", "one", "our", "out", "has",
  "its", "new", "now", "old", "see", "way", "may", "say",
  "she", "two", "how", "boy", "did", "get", "him",
  "his", "let", "put", "too", "use", "with", "from", "this",
  "that", "will", "have", "been", "they", "than", "into",
  "what", "when", "were", "your", "more", "some", "them",
  "then", "just", "only", "come", "made", "after", "back",
  "says", "said", "also", "could", "about", "over", "year",
]);

export function extractTrendingTerms(
  articles: FeedArticle[],
  limit: number = 30
): TrendingTerm[] {
  const termCount: Record<string, number> = {};

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    const words = text
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûçñ]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    const seen = new Set<string>();
    for (const word of words) {
      if (!seen.has(word)) {
        termCount[word] = (termCount[word] || 0) + 1;
        seen.add(word);
      }
    }
  }

  return Object.entries(termCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({
      term,
      count,
      growth: 0,
    }));
}

export function detectEmergingSignals(
  articles: FeedArticle[],
  limit: number = 8
): string[] {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const recentArticles = articles.filter(
    (a) => new Date(a.publishedAt) >= sixHoursAgo
  );
  const olderArticles = articles.filter(
    (a) =>
      new Date(a.publishedAt) < sixHoursAgo &&
      new Date(a.publishedAt) >= twelveHoursAgo
  );

  const recentTerms = extractTermSet(recentArticles);
  const olderTerms = extractTermSet(olderArticles);

  // Terms that appear in recent but not in older
  const emerging: string[] = [];
  for (const [term, count] of recentTerms) {
    if (!olderTerms.has(term) && count >= 2) {
      emerging.push(term);
    }
  }

  return emerging.slice(0, limit);
}

function extractTermSet(articles: FeedArticle[]): Map<string, number> {
  const terms = new Map<string, number>();
  for (const article of articles) {
    const text = `${article.title}`.toLowerCase();
    const words = text
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûçñ]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

    for (const word of words) {
      terms.set(word, (terms.get(word) || 0) + 1);
    }
  }
  return terms;
}
