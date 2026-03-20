"use client";

import { RefreshCw, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshIndicatorProps {
  autoRefresh: boolean;
  secondsUntilRefresh: number;
  isLoading: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
}

export function RefreshIndicator({
  autoRefresh,
  secondsUntilRefresh,
  isLoading,
  onToggleAutoRefresh,
  onRefresh,
}: RefreshIndicatorProps) {
  const minutes = Math.floor(secondsUntilRefresh / 60);
  const seconds = secondsUntilRefresh % 60;

  return (
    <div className="flex items-center gap-2">
      {autoRefresh && !isLoading && (
        <span className="text-xs font-mono text-muted tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      )}

      <button
        onClick={onToggleAutoRefresh}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-normal",
          autoRefresh
            ? "bg-accent-alt/15 text-accent-alt border border-accent-alt/30"
            : "bg-elevated text-muted border border-border hover:text-secondary"
        )}
        title={autoRefresh ? "Pausar atualização automática" : "Ativar atualização automática"}
      >
        {autoRefresh ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        Auto
      </button>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className={cn(
          "flex items-center justify-center rounded-lg p-1.5 border border-border text-muted transition-all duration-normal",
          "hover:bg-elevated hover:text-secondary",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        title="Atualizar agora"
      >
        <RefreshCw
          className={cn("h-4 w-4", isLoading && "animate-spin")}
        />
      </button>
    </div>
  );
}
