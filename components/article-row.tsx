"use client";

import { ExternalLink } from "lucide-react";
import { ArticleWithTopics, FeedArticle } from "@/lib/types";
import { timeAgo, truncate, cn } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import { TopicChip } from "./topic-chip";

interface ArticleRowProps {
  article: ArticleWithTopics;
  isBookmarked: boolean;
  onToggleBookmark: (article: FeedArticle) => void;
}

export function ArticleRow({
  article,
  isBookmarked,
  onToggleBookmark,
}: ArticleRowProps) {
  return (
    <div className="group flex items-start gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-fast hover:bg-elevated/70 animate-fade-in">
      {/* Time */}
      <span className="mt-0.5 min-w-[48px] sm:min-w-[60px] text-[10px] sm:text-[11px] text-muted font-mono tabular-nums whitespace-nowrap">
        {timeAgo(article.publishedAt)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h4 className="text-[13px] sm:text-sm font-medium text-primary leading-snug group-hover:text-accent transition-colors duration-fast line-clamp-2 sm:truncate">
            {article.title}
          </h4>
        </a>
        {article.description && (
          <p className="mt-0.5 text-xs text-secondary/70 line-clamp-1">
            {truncate(article.description, 150)}
          </p>
        )}
        {article.topics.length > 0 && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {article.topics.slice(0, 3).map((tm) => (
              <TopicChip
                key={tm.topic.id}
                topic={tm.topic}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-fast flex-shrink-0">
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
  );
}
