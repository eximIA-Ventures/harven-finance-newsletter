"use client";

import { Bookmark, Tags, Rss, Search } from "lucide-react";
import { Topic } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { RefreshIndicator } from "./refresh-indicator";
import { TopicChip } from "./topic-chip";

interface HeaderProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string | null) => void;
  fetchedAt: string | null;
  autoRefresh: boolean;
  secondsUntilRefresh: number;
  isLoading: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onOpenTopicManager: () => void;
  onOpenSourceManager: () => void;
  onOpenBookmarks: () => void;
  bookmarkCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({
  topics,
  selectedTopicId,
  onSelectTopic,
  fetchedAt,
  autoRefresh,
  secondsUntilRefresh,
  isLoading,
  onToggleAutoRefresh,
  onRefresh,
  onOpenTopicManager,
  onOpenSourceManager,
  onOpenBookmarks,
  bookmarkCount,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <img
              src="/harven-finance-logo.png"
              alt="Harven Finance"
              className="h-7 w-auto"
            />
            <div className="h-5 w-[1px] bg-border" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-primary">
                Newsletter
              </h1>
              {fetchedAt && (
                <p className="text-[10px] text-muted font-mono">
                  {timeAgo(fetchedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar artigos..."
                className="w-48 rounded-lg border border-border bg-elevated py-1.5 pl-8 pr-3 text-xs text-primary placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:w-64 transition-all duration-normal"
              />
            </div>

            {/* Action buttons */}
            <button
              onClick={onOpenBookmarks}
              className="relative flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-all duration-normal hover:bg-elevated hover:text-secondary"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Favoritos</span>
              {bookmarkCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent/20 px-1 text-[10px] font-semibold text-accent">
                  {bookmarkCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenTopicManager}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-all duration-normal hover:bg-elevated hover:text-secondary"
            >
              <Tags className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tópicos</span>
            </button>

            <button
              onClick={onOpenSourceManager}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-all duration-normal hover:bg-elevated hover:text-secondary"
            >
              <Rss className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fontes</span>
            </button>

            <RefreshIndicator
              autoRefresh={autoRefresh}
              secondsUntilRefresh={secondsUntilRefresh}
              isLoading={isLoading}
              onToggleAutoRefresh={onToggleAutoRefresh}
              onRefresh={onRefresh}
            />
          </div>
        </div>

        {/* Gold accent bar — from Harven Finance logo */}
        <div className="gold-bar mb-3" />

        {/* Topic filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto scroll-hidden pb-3">
          <button
            onClick={() => onSelectTopic(null)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-normal",
              selectedTopicId === null
                ? "bg-accent/15 text-accent border-accent/30"
                : "bg-transparent text-muted border-border hover:text-secondary"
            )}
          >
            Todos
          </button>
          {topics
            .filter((t) => t.enabled)
            .map((topic) => (
              <TopicChip
                key={topic.id}
                topic={topic}
                active={selectedTopicId === null || selectedTopicId === topic.id}
                onClick={() =>
                  onSelectTopic(
                    selectedTopicId === topic.id ? null : topic.id
                  )
                }
                size="sm"
              />
            ))}
        </div>
      </div>
    </header>
  );
}
