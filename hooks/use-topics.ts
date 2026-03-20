"use client";

import { useState, useEffect, useCallback } from "react";
import { Topic } from "@/lib/types";
import { getTopics, saveTopics } from "@/lib/storage";
import { generateId } from "@/lib/utils";

interface UseTopicsReturn {
  topics: Topic[];
  activeTopics: Topic[];
  addTopic: (name: string, keywords: string[], color: string) => void;
  removeTopic: (id: string) => void;
  toggleTopic: (id: string) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
}

export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    setTopics(getTopics());
  }, []);

  const persist = useCallback((updated: Topic[]) => {
    setTopics(updated);
    saveTopics(updated);
  }, []);

  const addTopic = useCallback(
    (name: string, keywords: string[], color: string) => {
      const newTopic: Topic = {
        id: generateId(),
        name,
        keywords,
        color,
        enabled: true,
      };
      persist([...topics, newTopic]);
    },
    [topics, persist]
  );

  const removeTopic = useCallback(
    (id: string) => {
      persist(topics.filter((t) => t.id !== id));
    },
    [topics, persist]
  );

  const toggleTopic = useCallback(
    (id: string) => {
      persist(
        topics.map((t) =>
          t.id === id ? { ...t, enabled: !t.enabled } : t
        )
      );
    },
    [topics, persist]
  );

  const updateTopic = useCallback(
    (id: string, updates: Partial<Topic>) => {
      persist(
        topics.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    [topics, persist]
  );

  const activeTopics = topics.filter((t) => t.enabled);

  return {
    topics,
    activeTopics,
    addTopic,
    removeTopic,
    toggleTopic,
    updateTopic,
  };
}
