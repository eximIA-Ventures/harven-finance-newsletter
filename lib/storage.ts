import { FeedSource, Topic, Bookmark } from "./types";
import { defaultFeeds } from "./default-feeds";
import { defaultTopics } from "./default-topics";

const STORAGE_KEYS = {
  sources: "intelligence-hub-sources",
  topics: "intelligence-hub-topics",
  bookmarks: "intelligence-hub-bookmarks",
  autoRefresh: "intelligence-hub-auto-refresh",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage might be full or disabled
  }
}

// Sources
export function getSources(): FeedSource[] {
  return safeGet<FeedSource[]>(STORAGE_KEYS.sources, defaultFeeds);
}

export function saveSources(sources: FeedSource[]): void {
  safeSet(STORAGE_KEYS.sources, sources);
}

// Topics
export function getTopics(): Topic[] {
  return safeGet<Topic[]>(STORAGE_KEYS.topics, defaultTopics);
}

export function saveTopics(topics: Topic[]): void {
  safeSet(STORAGE_KEYS.topics, topics);
}

// Bookmarks
export function getBookmarks(): Bookmark[] {
  return safeGet<Bookmark[]>(STORAGE_KEYS.bookmarks, []);
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
  safeSet(STORAGE_KEYS.bookmarks, bookmarks);
}

// Auto-refresh
export function getAutoRefresh(): boolean {
  return safeGet<boolean>(STORAGE_KEYS.autoRefresh, true);
}

export function saveAutoRefresh(enabled: boolean): void {
  safeSet(STORAGE_KEYS.autoRefresh, enabled);
}
