"use client";

import { useState } from "react";
import { X, Plus, Tags } from "lucide-react";
import { Topic } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TopicChip } from "./topic-chip";

interface TopicManagerProps {
  topics: Topic[];
  onToggle: (id: string) => void;
  onAdd: (name: string, keywords: string[], color: string) => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "100 181 246",
  "124 158 143",
  "196 168 130",
  "76 175 80",
  "255 183 77",
  "244 67 54",
  "171 130 255",
  "255 138 101",
];

export function TopicManager({
  topics,
  onToggle,
  onAdd,
  onRemove,
  isOpen,
  onClose,
}: TopicManagerProps) {
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim() || !newKeywords.trim()) return;
    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    onAdd(newName.trim(), keywords, newColor);
    setNewName("");
    setNewKeywords("");
    setNewColor(PRESET_COLORS[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl mx-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">
              Gerenciar Tópicos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing topics */}
        <div className="mb-6 space-y-2 max-h-[200px] overflow-y-auto">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 hover:bg-elevated/50 transition-colors duration-fast"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onToggle(topic.id)}
                  className={cn(
                    "h-4 w-4 rounded border-2 flex-shrink-0 transition-all duration-fast",
                    topic.enabled
                      ? "border-accent-alt bg-accent-alt"
                      : "border-muted bg-transparent"
                  )}
                >
                  {topic.enabled && (
                    <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
                      <path
                        d="M4 8L7 11L12 5"
                        stroke="rgb(var(--c-bg))"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `rgb(${topic.color})` }}
                    />
                    <span className={cn(
                      "text-sm font-medium truncate",
                      topic.enabled ? "text-primary" : "text-muted"
                    )}>
                      {topic.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted truncate mt-0.5">
                    {topic.keywords.join(", ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(topic.id)}
                className="rounded p-1 text-muted/50 hover:text-danger hover:bg-danger/10 transition-all duration-fast flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new topic */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Adicionar Tópico
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do tópico"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-fast"
            />
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="Palavras-chave (separadas por vírgula)"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-fast"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-all duration-fast",
                      newColor === color
                        ? "scale-110"
                        : "hover:scale-105"
                    )}
                    style={{
                      backgroundColor: `rgb(${color})`,
                      boxShadow: newColor === color
                        ? `0 0 0 2px rgb(var(--c-surface)), 0 0 0 4px rgb(${color})`
                        : undefined,
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newKeywords.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-all duration-fast hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
