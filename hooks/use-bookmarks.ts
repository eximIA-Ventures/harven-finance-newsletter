"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedArticle, Bookmark } from "@/lib/types";
import { getBookmarks, saveBookmarks } from "@/lib/storage";

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isBookmarked: (articleId: string) => boolean;
  toggleBookmark: (article: FeedArticle) => void;
  removeBookmark: (articleId: string) => void;
  clearBookmarks: () => void;
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const persist = useCallback((updated: Bookmark[]) => {
    setBookmarks(updated);
    saveBookmarks(updated);
  }, []);

  const isBookmarked = useCallback(
    (articleId: string) => {
      return bookmarks.some((b) => b.articleId === articleId);
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (article: FeedArticle) => {
      if (isBookmarked(article.id)) {
        persist(bookmarks.filter((b) => b.articleId !== article.id));
      } else {
        const bookmark: Bookmark = {
          articleId: article.id,
          article,
          bookmarkedAt: new Date().toISOString(),
        };
        persist([bookmark, ...bookmarks]);
      }
    },
    [bookmarks, isBookmarked, persist]
  );

  const removeBookmark = useCallback(
    (articleId: string) => {
      persist(bookmarks.filter((b) => b.articleId !== articleId));
    },
    [bookmarks, persist]
  );

  const clearBookmarks = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
