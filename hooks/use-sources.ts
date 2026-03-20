"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedSource, FeedCategory } from "@/lib/types";
import { getSources, saveSources } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface UseSourcesReturn {
  sources: FeedSource[];
  enabledSources: FeedSource[];
  addSource: (name: string, url: string, category: FeedCategory) => void;
  removeSource: (id: string) => void;
  toggleSource: (id: string) => void;
  resetToDefaults: () => void;
}

export function useSources(): UseSourcesReturn {
  const [sources, setSources] = useState<FeedSource[]>([]);

  useEffect(() => {
    setSources(getSources());
  }, []);

  const persist = useCallback((updated: FeedSource[]) => {
    setSources(updated);
    saveSources(updated);
  }, []);

  const addSource = useCallback(
    (name: string, url: string, category: FeedCategory) => {
      const newSource: FeedSource = {
        id: generateId(),
        name,
        url,
        category,
        enabled: true,
        isDefault: false,
      };
      persist([...sources, newSource]);
    },
    [sources, persist]
  );

  const removeSource = useCallback(
    (id: string) => {
      persist(sources.filter((s) => s.id !== id));
    },
    [sources, persist]
  );

  const toggleSource = useCallback(
    (id: string) => {
      persist(
        sources.map((s) =>
          s.id === id ? { ...s, enabled: !s.enabled } : s
        )
      );
    },
    [sources, persist]
  );

  const resetToDefaults = useCallback(() => {
    const { defaultFeeds } = require("@/lib/default-feeds");
    persist(defaultFeeds);
  }, [persist]);

  const enabledSources = sources.filter((s) => s.enabled);

  return {
    sources,
    enabledSources,
    addSource,
    removeSource,
    toggleSource,
    resetToDefaults,
  };
}
