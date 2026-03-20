"use client";

import {
  Newspaper,
  Rss,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  const items = [
    {
      icon: Newspaper,
      label: "Artigos Hoje",
      value: stats.totalArticles.toString(),
      color: "100 181 246",
    },
    {
      icon: Rss,
      label: "Fontes Ativas",
      value: `${stats.activeSources}/${stats.totalSources}`,
      color: "76 175 80",
    },
    {
      icon: Activity,
      label: "Fonte mais ativa",
      value: stats.mostActiveSource || "—",
      color: "196 168 130",
    },
    {
      icon: TrendingUp,
      label: "Tópico Dominante",
      value: stats.dominantTopic || "—",
      color: "124 158 143",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `rgb(${item.color} / 0.1)`,
            }}
          >
            <item.icon
              className="h-4 w-4"
              style={{ color: `rgb(${item.color})` }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted">
              {item.label}
            </p>
            {isLoading ? (
              <div className="skeleton mt-1 h-4 w-16" />
            ) : (
              <p className="text-sm font-semibold text-primary truncate">
                {item.value}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
