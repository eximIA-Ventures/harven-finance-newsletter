"use client";

import { ExternalLink } from "lucide-react";
import { ArticleWithTopics, FeedArticle } from "@/lib/types";
import { timeAgo, truncate, cn, categoryLabel } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";

interface ArticleCardProps {
  article: ArticleWithTopics | FeedArticle;
  isBookmarked: boolean;
  onToggleBookmark: (article: FeedArticle) => void;
}

export function ArticleCard({
  article,
  isBookmarked,
  onToggleBookmark,
}: ArticleCardProps) {
  return (
    <div className="group relative flex flex-col min-w-[280px] max-w-[320px] rounded-xl border border-border bg-surface p-4 transition-all duration-normal hover:border-muted/50 hover:bg-elevated animate-fade-in">
      {/* Top row: source + time */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `rgb(${getCategoryRgb(article.category)} / 0.12)`,
            color: `rgb(${getCategoryRgb(article.category)})`,
          }}
        >
          {article.source}
        </span>
        <span className="text-[11px] text-muted whitespace-nowrap">
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 flex-1"
      >
        <h3 className="text-sm font-semibold leading-snug text-primary group-hover:text-accent transition-colors duration-fast line-clamp-3">
          {article.title}
        </h3>
      </a>

      {/* Description */}
      {article.description && (
        <p className="mb-3 text-xs leading-relaxed text-secondary line-clamp-2">
          {truncate(article.description, 120)}
        </p>
      )}

      {/* Bottom row: category tag + actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted uppercase tracking-wide">
          {categoryLabel(article.category)}
        </span>
        <div className="flex items-center gap-1">
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(article)}
          />
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1 text-muted/40 hover:text-muted transition-colors duration-fast"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
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
