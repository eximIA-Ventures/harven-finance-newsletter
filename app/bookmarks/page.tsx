"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { timeAgo, truncate, categoryLabel } from "@/lib/utils";

export default function BookmarksPage() {
  const { bookmarks, toggleBookmark } = useBookmarks();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-accent" />
                <h1 className="text-lg font-bold text-primary">
                  Favoritos
                </h1>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {bookmarks.length}
                </span>
              </div>
            </div>

            {bookmarks.length > 0 && (
              <button
                onClick={() =>
                  bookmarks.forEach((b) => toggleBookmark(b.article))
                }
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-danger/70 hover:bg-danger/10 hover:text-danger transition-all duration-fast"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar tudo
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 md:px-6 py-6">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark className="h-16 w-16 text-muted/15 mb-4" />
            <p className="text-sm text-muted">
              Nenhum artigo salvo nos favoritos.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25 transition-all duration-fast"
            >
              Explorar notícias
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.articleId}
                className="group rounded-xl border border-border bg-surface/50 p-4 hover:bg-elevated/30 transition-all duration-fast animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent-alt/10 text-accent-alt">
                        {bookmark.article.source}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted">
                        {categoryLabel(bookmark.article.category)}
                      </span>
                      <span className="text-[10px] text-muted">
                        {timeAgo(bookmark.article.publishedAt)}
                      </span>
                    </div>
                    <a
                      href={bookmark.article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <h2 className="text-base font-semibold text-primary leading-snug hover:text-accent transition-colors duration-fast">
                        {bookmark.article.title}
                      </h2>
                    </a>
                    {bookmark.article.description && (
                      <p className="mt-2 text-sm text-secondary/70 leading-relaxed">
                        {bookmark.article.description}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-muted/40">
                      Salvo {timeAgo(bookmark.bookmarkedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={bookmark.article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => toggleBookmark(bookmark.article)}
                      className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger transition-all duration-fast"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
