"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FeedArticle,
  FeedHealth,
  FeedResponse,
  ArticleWithTopics,
  TopicResponse,
  TrendingTerm,
  Topic,
} from "@/lib/types";
import { getAutoRefresh, saveAutoRefresh } from "@/lib/storage";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UseFeedsReturn {
  articles: ArticleWithTopics[];
  rawArticles: FeedArticle[];
  health: Record<string, FeedHealth>;
  trendingTerms: TrendingTerm[];
  emergingSignals: string[];
  isLoading: boolean;
  error: string | null;
  fetchedAt: string | null;
  sourceCount: number;
  errorCount: number;
  autoRefresh: boolean;
  secondsUntilRefresh: number;
  refresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
}

export function useFeeds(topics: Topic[]): UseFeedsReturn {
  const [rawArticles, setRawArticles] = useState<FeedArticle[]>([]);
  const [articles, setArticles] = useState<ArticleWithTopics[]>([]);
  const [health, setHealth] = useState<Record<string, FeedHealth>>({});
  const [trendingTerms, setTrendingTerms] = useState<TrendingTerm[]>([]);
  const [emergingSignals, setEmergingSignals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sourceCount, setSourceCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(300);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const topicsRef = useRef(topics);
  topicsRef.current = topics;

  const enrichWithTopics = useCallback(
    async (feedArticles: FeedArticle[]) => {
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articles: feedArticles,
            topics: topicsRef.current,
          }),
        });

        if (res.ok) {
          const data: TopicResponse = await res.json();
          setArticles(data.articles);
          setTrendingTerms(data.trendingTerms);
          setEmergingSignals(data.emergingSignals);
        }
      } catch {
        // If topic enrichment fails, just use raw articles
        setArticles(
          feedArticles.map((a) => ({
            ...a,
            topics: [],
            relevanceScore: 0,
          }))
        );
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/feeds");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: FeedResponse = await res.json();
      setRawArticles(data.articles);
      setHealth(data.health);
      setFetchedAt(data.fetchedAt);
      setSourceCount(data.sourceCount);
      setErrorCount(data.errorCount);

      // Enrich with topics
      await enrichWithTopics(data.articles);

      // Reset countdown
      setSecondsUntilRefresh(300);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao buscar notícias"
      );
    } finally {
      setIsLoading(false);
    }
  }, [enrichWithTopics]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => {
      const next = !prev;
      saveAutoRefresh(next);
      return next;
    });
  }, []);

  // Initial load
  useEffect(() => {
    const savedAutoRefresh = getAutoRefresh();
    setAutoRefresh(savedAutoRefresh);
    refresh();
  }, [refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  // Countdown timer
  useEffect(() => {
    if (autoRefresh) {
      countdownRef.current = setInterval(() => {
        setSecondsUntilRefresh((prev) => (prev <= 1 ? 300 : prev - 1));
      }, 1000);
    } else {
      setSecondsUntilRefresh(0);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh]);

  // Re-enrich when topics change
  useEffect(() => {
    if (rawArticles.length > 0) {
      enrichWithTopics(rawArticles);
    }
  }, [topics, rawArticles, enrichWithTopics]);

  return {
    articles,
    rawArticles,
    health,
    trendingTerms,
    emergingSignals,
    isLoading,
    error,
    fetchedAt,
    sourceCount,
    errorCount,
    autoRefresh,
    secondsUntilRefresh,
    refresh,
    toggleAutoRefresh,
  };
}
