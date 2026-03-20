"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Rss } from "lucide-react";
import { ArticleWithTopics, FeedArticle, FeedHealth } from "@/lib/types";
import { cn, categoryLabel } from "@/lib/utils";
import { ArticleRow } from "./article-row";

interface SourceFeedProps {
  sourceName: string;
  sourceId: string;
  category: string;
  articles: ArticleWithTopics[];
  health?: FeedHealth;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (article: FeedArticle) => void;
  isLoading: boolean;
}

export function SourceFeed({
  sourceName,
  sourceId,
  category,
  articles,
  health,
  isBookmarked,
  onToggleBookmark,
  isLoading,
}: SourceFeedProps) {
  const [expanded, setExpanded] = useState(true);
  const hasError = health?.lastError && !health?.lastSuccess;

  return (
    <div className="rounded-xl border border-border bg-surface/50 overflow-hidden transition-all duration-normal animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 transition-colors duration-fast hover:bg-elevated/50"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted flex-shrink-0" />
          )}
          <Rss
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{ color: `rgb(${getCategoryRgb(category)})` }}
          />
          <span className="text-sm font-semibold text-primary truncate">
            {sourceName}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              backgroundColor: `rgb(${getCategoryRgb(category)} / 0.1)`,
              color: `rgb(${getCategoryRgb(category)})`,
            }}
          >
            {categoryLabel(category)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasError && (
            <span className="text-[10px] text-danger font-medium">
              Erro
            </span>
          )}
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium text-muted tabular-nums">
            {articles.length}
          </span>
        </div>
      </button>

      {/* Articles */}
      {expanded && (
        <div className="border-t border-border/50">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <div className="skeleton h-3 w-14" />
                  <div className="skeleton h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted">
              {hasError
                ? `Erro ao carregar: ${health?.lastError}`
                : "Nenhum artigo encontrado"}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {articles.slice(0, 8).map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  isBookmarked={isBookmarked(article.id)}
                  onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryRgb(category: string): string {
  const map: Record<string, string> = {
    tech: "100 181 246",
    business: "196 168 130",
    brazil: "76 175 80",
    agro: "124 158 143",
    custom: "255 183 77",
  };
  return map[category] || "115 110 102";
}
