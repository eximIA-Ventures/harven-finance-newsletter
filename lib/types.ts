export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: FeedCategory;
  enabled: boolean;
  isDefault: boolean;
  /** Source credibility weight: 1.0 (bronze) → 1.5 (silver) → 2.0 (gold) */
  credibilityWeight?: number;
}

export type FeedCategory =
  | "tech"
  | "business"
  | "brazil"
  | "agro"
  | "custom";

export interface FeedArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceId: string;
  publishedAt: string;
  description: string;
  category: FeedCategory;
  categories: string[];
}

export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  color: string;
  enabled: boolean;
}

export interface TopicMatch {
  topic: Topic;
  score: number;
  matchedKeywords: string[];
}

export interface ArticleWithTopics extends FeedArticle {
  topics: TopicMatch[];
  relevanceScore: number;
}

export interface FeedHealth {
  sourceId: string;
  lastSuccess: string | null;
  lastError: string | null;
  errorCount: number;
  articleCount: number;
}

export interface Bookmark {
  articleId: string;
  article: FeedArticle;
  bookmarkedAt: string;
}

export interface FeedResponse {
  articles: FeedArticle[];
  health: Record<string, FeedHealth>;
  fetchedAt: string;
  sourceCount: number;
  errorCount: number;
}

export interface TopicResponse {
  articles: ArticleWithTopics[];
  trendingTerms: TrendingTerm[];
  emergingSignals: string[];
}

export interface TrendingTerm {
  term: string;
  count: number;
  growth: number;
}

export interface DashboardStats {
  totalArticles: number;
  activeSources: number;
  totalSources: number;
  mostActiveSource: string;
  dominantTopic: string;
}
