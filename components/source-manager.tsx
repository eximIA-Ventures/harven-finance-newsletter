"use client";

import { useState } from "react";
import { X, Plus, Rss, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { FeedSource, FeedHealth, FeedCategory } from "@/lib/types";
import { cn, categoryLabel } from "@/lib/utils";

interface SourceManagerProps {
  sources: FeedSource[];
  health: Record<string, FeedHealth>;
  onToggle: (id: string) => void;
  onAdd: (name: string, url: string, category: FeedCategory) => void;
  onRemove: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceManager({
  sources,
  health,
  onToggle,
  onAdd,
  onRemove,
  isOpen,
  onClose,
}: SourceManagerProps) {
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState<FeedCategory>("custom");

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    onAdd(newName.trim(), newUrl.trim(), newCategory);
    setNewName("");
    setNewUrl("");
    setNewCategory("custom");
  };

  const categories: FeedCategory[] = ["tech", "business", "brazil", "agro", "custom"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">
              Gerenciar Fontes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-primary transition-all duration-fast"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source list */}
        <div className="mb-6 space-y-1.5 max-h-[300px] overflow-y-auto">
          {sources.map((source) => {
            const sourceHealth = health[source.id];
            const hasError = sourceHealth?.lastError && !sourceHealth?.lastSuccess;
            const isHealthy = sourceHealth?.lastSuccess;

            return (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 hover:bg-elevated/50 transition-colors duration-fast"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onToggle(source.id)}
                    className={cn(
                      "h-4 w-4 rounded border-2 flex-shrink-0 transition-all duration-fast",
                      source.enabled
                        ? "border-accent-alt bg-accent-alt"
                        : "border-muted bg-transparent"
                    )}
                  >
                    {source.enabled && (
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          source.enabled ? "text-primary" : "text-muted"
                        )}
                      >
                        {source.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-muted px-1.5 py-0.5 rounded bg-elevated">
                        {categoryLabel(source.category)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted/60 truncate mt-0.5 font-mono">
                      {source.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {/* Health indicator */}
                  {sourceHealth && (
                    <span title={hasError ? `Erro: ${sourceHealth.lastError}` : "Operacional"}>
                      {hasError ? (
                        <XCircle className="h-3.5 w-3.5 text-danger" />
                      ) : isHealthy ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      )}
                    </span>
                  )}

                  {!source.isDefault && (
                    <button
                      onClick={() => onRemove(source.id)}
                      className="rounded p-1 text-muted/50 hover:text-danger hover:bg-danger/10 transition-all duration-fast"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new source */}
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Adicionar Fonte RSS
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da fonte"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-fast"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL do feed RSS"
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-fast font-mono"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-fast border",
                      newCategory === cat
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-transparent text-muted border-border hover:text-secondary"
                    )}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newUrl.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent transition-all duration-fast hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Adicionar Fonte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
