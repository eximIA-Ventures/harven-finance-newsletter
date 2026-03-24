"use client";

import { useState, useMemo, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useFeeds } from "@/hooks/use-feeds";
import { useTopics } from "@/hooks/use-topics";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useSources } from "@/hooks/use-sources";
import { ArticleWithTopics, DashboardStats, FeedArticle } from "@/lib/types";
import { Header } from "@/components/header";
import { BreakingCarousel } from "@/components/breaking-carousel";
import { SourceFeed } from "@/components/source-feed";
import { TrendingTopics } from "@/components/trending-topics";
import { StatsBar } from "@/components/stats-bar";
import { TopicManager } from "@/components/topic-manager";
import { SourceManager } from "@/components/source-manager";
import { BookmarksSidebar } from "@/components/bookmarks-sidebar";

export default function DashboardPage() {
  const { topics, activeTopics, addTopic, removeTopic, toggleTopic } =
    useTopics();
  const {
    articles,
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
  } = useFeeds(topics);
  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  const { sources, addSource, removeSource, toggleSource } = useSources();

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Filter articles by selected topic and search query
  const filteredArticles = useMemo(() => {
    let result = articles;

    if (selectedTopicId) {
      result = result.filter((a) =>
        a.topics.some((t) => t.topic.id === selectedTopicId)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }

    return result;
  }, [articles, selectedTopicId, searchQuery]);

  // Group articles by source
  const articlesBySource = useMemo(() => {
    const groups: Record<
      string,
      { name: string; category: string; articles: ArticleWithTopics[] }
    > = {};

    for (const article of filteredArticles) {
      if (!groups[article.sourceId]) {
        groups[article.sourceId] = {
          name: article.source,
          category: article.category,
          articles: [],
        };
      }
      groups[article.sourceId].articles.push(article);
    }

    return Object.entries(groups).sort(
      (a, b) => b[1].articles.length - a[1].articles.length
    );
  }, [filteredArticles]);

  // Stats
  const stats: DashboardStats = useMemo(() => {
    const sourceArticleCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    for (const article of articles) {
      sourceArticleCounts[article.source] =
        (sourceArticleCounts[article.source] || 0) + 1;

      for (const tm of article.topics) {
        topicCounts[tm.topic.name] =
          (topicCounts[tm.topic.name] || 0) + 1;
      }
    }

    const mostActive = Object.entries(sourceArticleCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const dominant = Object.entries(topicCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      totalArticles: articles.length,
      activeSources: sourceCount - errorCount,
      totalSources: sourceCount,
      mostActiveSource: mostActive?.[0] || "—",
      dominantTopic: dominant?.[0] || "—",
    };
  }, [articles, sourceCount, errorCount]);

  const handleTermClick = (term: string) => {
    setSearchQuery(term);
    setSelectedTopicId(null);
  };

  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    return () => document.documentElement.removeAttribute("data-theme");
  }, [dark]);

  return (
    <div className="min-h-screen bg-bg transition-colors duration-300">
      {/* Theme toggle */}
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 60 }}>
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-border bg-surface shadow-lg transition-all hover:bg-elevated"
        >
          {dark ? <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-accent" /> : <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-muted" />}
        </button>
      </div>

      <Header
        topics={topics}
        selectedTopicId={selectedTopicId}
        onSelectTopic={setSelectedTopicId}
        fetchedAt={fetchedAt}
        autoRefresh={autoRefresh}
        secondsUntilRefresh={secondsUntilRefresh}
        isLoading={isLoading}
        onToggleAutoRefresh={toggleAutoRefresh}
        onRefresh={refresh}
        onOpenTopicManager={() => setShowTopicManager(true)}
        onOpenSourceManager={() => setShowSourceManager(true)}
        onOpenBookmarks={() => setShowBookmarks(true)}
        bookmarkCount={bookmarks.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="mx-auto max-w-[1600px] px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            Erro ao carregar feeds: {error}
          </div>
        )}

        {/* Breaking / Latest */}
        <BreakingCarousel
          articles={filteredArticles}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
          isLoading={isLoading}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: By Source */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Por Fonte
              {filteredArticles.length !== articles.length && (
                <span className="ml-2 text-accent">
                  ({filteredArticles.length} de {articles.length})
                </span>
              )}
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-surface/50 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="skeleton h-4 w-4 rounded" />
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton h-4 w-12 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="skeleton h-3 w-14" />
                          <div className="skeleton h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : articlesBySource.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface/50 px-6 py-12 text-center">
                <p className="text-sm text-muted">
                  {searchQuery || selectedTopicId
                    ? "Nenhum artigo encontrado com os filtros atuais."
                    : "Nenhum artigo disponível. Verifique as fontes."}
                </p>
              </div>
            ) : (
              articlesBySource.map(([sourceId, group]) => (
                <SourceFeed
                  key={sourceId}
                  sourceName={group.name}
                  sourceId={sourceId}
                  category={group.category}
                  articles={group.articles}
                  health={health[sourceId]}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                  isLoading={false}
                />
              ))
            )}
          </div>

          {/* Right: Trending + Emerging */}
          <div className="order-first lg:order-last">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Tendências
            </h2>
            <TrendingTopics
              terms={trendingTerms}
              emergingSignals={emergingSignals}
              onTermClick={handleTermClick}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Resumo
          </h2>
          <StatsBar stats={stats} isLoading={isLoading} />
        </div>
      </main>

      {/* Modals */}
      <TopicManager
        topics={topics}
        onToggle={toggleTopic}
        onAdd={addTopic}
        onRemove={removeTopic}
        isOpen={showTopicManager}
        onClose={() => setShowTopicManager(false)}
      />

      <SourceManager
        sources={sources}
        health={health}
        onToggle={toggleSource}
        onAdd={addSource}
        onRemove={removeSource}
        isOpen={showSourceManager}
        onClose={() => setShowSourceManager(false)}
      />

      <BookmarksSidebar
        bookmarks={bookmarks}
        onRemove={(id) => {
          const bookmark = bookmarks.find((b) => b.articleId === id);
          if (bookmark) toggleBookmark(bookmark.article);
        }}
        onClear={() => {
          bookmarks.forEach((b) => toggleBookmark(b.article));
        }}
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />
    </div>
  );
}
