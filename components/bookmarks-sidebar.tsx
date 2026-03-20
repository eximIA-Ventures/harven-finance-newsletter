"use client";

import { X, Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { Bookmark as BookmarkType } from "@/lib/types";
import { timeAgo, truncate, cn } from "@/lib/utils";

interface BookmarksSidebarProps {
  bookmarks: BookmarkType[];
  onRemove: (articleId: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarksSidebar({
  bookmarks,
  onRemove,
  onClear,
  isOpen,
  onClose,
}: BookmarksSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative w-full max-w-md border-l border-border bg-surface shadow-2xl animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-sm px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-primary">
                Favoritos
              </h2>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {bookmarks.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bookmarks.length > 0 && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-danger/70 hover:bg-danger/10 hover:text-danger transition-all duration-fast"
                >
                  <Trash2 className="h-3 w-3" />
                  Limpar
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <Bookmark className="h-12 w-12 text-muted/20 mb-4" />
            <p className="text-sm text-muted text-center">
              Nenhum artigo salvo.
            </p>
            <p className="text-xs text-muted/60 mt-1 text-center">
              Clique no ícone de favorito em qualquer artigo para salvá-lo aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.articleId}
                className="group px-5 py-4 hover:bg-elevated/30 transition-colors duration-fast"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-alt">
                        {bookmark.article.source}
                      </span>
                      <span className="text-[10px] text-muted">
                        {timeAgo(bookmark.article.publishedAt)}
                      </span>
                    </div>
                    <a
                      href={bookmark.article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="text-sm font-medium text-primary leading-snug hover:text-accent transition-colors duration-fast">
                        {bookmark.article.title}
                      </h3>
                    </a>
                    {bookmark.article.description && (
                      <p className="mt-1 text-xs text-secondary/60 line-clamp-2">
                        {truncate(bookmark.article.description, 120)}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-muted/40">
                      Salvo {timeAgo(bookmark.bookmarkedAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
                    <a
                      href={bookmark.article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => onRemove(bookmark.articleId)}
                      className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-all duration-fast"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
