"use client";

import { TrendingUp, Sparkles } from "lucide-react";
import { TrendingTerm } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TrendingTopicsProps {
  terms: TrendingTerm[];
  emergingSignals: string[];
  onTermClick: (term: string) => void;
  isLoading: boolean;
}

export function TrendingTopics({
  terms,
  emergingSignals,
  onTermClick,
  isLoading,
}: TrendingTopicsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="skeleton h-4 w-4" />
            <div className="skeleton h-4 w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-7 rounded-full"
                style={{ width: `${60 + ((i * 17 + 7) % 40)}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...terms.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      {/* Trending Terms */}
      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Termos em Alta
          </h3>
        </div>

        {terms.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">
            Ainda coletando dados...
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {terms.map((term) => {
              const intensity = term.count / maxCount;
              const fontSize = 11 + intensity * 5;
              const opacity = 0.4 + intensity * 0.6;

              return (
                <button
                  key={term.term}
                  onClick={() => onTermClick(term.term)}
                  className="rounded-full border border-border/50 px-2.5 py-1 transition-all duration-fast hover:border-accent/40 hover:bg-accent/10"
                  style={{
                    fontSize: `${fontSize}px`,
                    opacity,
                  }}
                  title={`${term.count} artigos`}
                >
                  <span className="text-primary">{term.term}</span>
                  <span className="ml-1 text-[9px] text-muted tabular-nums">
                    {term.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Emerging Signals */}
      <div className="rounded-xl border border-accent-alt/20 bg-accent-alt/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-alt" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-accent-alt">
            Sinais Emergentes
          </h3>
        </div>

        {emergingSignals.length === 0 ? (
          <p className="text-xs text-muted py-2 text-center">
            Nenhum sinal novo detectado nas últimas 6h
          </p>
        ) : (
          <div className="space-y-1.5">
            {emergingSignals.map((signal) => (
              <button
                key={signal}
                onClick={() => onTermClick(signal)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-all duration-fast hover:bg-accent-alt/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-alt animate-pulse-soft" />
                <span className="text-primary">{signal}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
