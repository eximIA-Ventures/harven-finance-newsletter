"use client";

import { Zap } from "lucide-react";
import { ArticleWithTopics, FeedArticle } from "@/lib/types";
import { ArticleCard } from "./article-card";

interface BreakingCarouselProps {
  articles: ArticleWithTopics[];
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (article: FeedArticle) => void;
  isLoading: boolean;
}

export function BreakingCarousel({
  articles,
  isBookmarked,
  onToggleBookmark,
  isLoading,
}: BreakingCarouselProps) {
  const latestArticles = articles.slice(0, 12);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">
          Últimas Notícias
        </h2>
        <span className="text-xs text-muted">
          {latestArticles.length} artigos
        </span>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto scroll-hidden pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[280px] max-w-[320px] rounded-xl border border-border bg-surface p-4"
            >
              <div className="mb-3 flex justify-between">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-3 w-14" />
              </div>
              <div className="skeleton mb-2 h-4 w-full" />
              <div className="skeleton mb-2 h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scroll-hidden pb-2">
          {latestArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isBookmarked={isBookmarked(article.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </section>
  );
}
