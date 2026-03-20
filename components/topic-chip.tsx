"use client";

import { cn } from "@/lib/utils";
import { Topic } from "@/lib/types";
import { X } from "lucide-react";

interface TopicChipProps {
  topic: Topic;
  active?: boolean;
  showRemove?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function TopicChip({
  topic,
  active = true,
  showRemove = false,
  onClick,
  onRemove,
  size = "md",
}: TopicChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-normal",
        size === "sm"
          ? "px-2.5 py-0.5 text-xs"
          : "px-3 py-1 text-sm",
        active
          ? "border-transparent bg-opacity-20"
          : "border-border bg-transparent opacity-50 hover:opacity-75"
      )}
      style={{
        backgroundColor: active
          ? `rgb(${topic.color} / 0.15)`
          : undefined,
        color: active
          ? `rgb(${topic.color})`
          : `rgb(var(--c-muted))`,
        borderColor: active
          ? `rgb(${topic.color} / 0.3)`
          : undefined,
      }}
    >
      <span
        className={cn("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")}
        style={{ backgroundColor: `rgb(${topic.color})` }}
      />
      {topic.name}
      {showRemove && onRemove && (
        <X
          className={cn(
            "cursor-pointer opacity-60 hover:opacity-100",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
