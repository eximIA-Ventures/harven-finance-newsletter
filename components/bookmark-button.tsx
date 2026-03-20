"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

export function BookmarkButton({
  isBookmarked,
  onClick,
  size = "sm",
}: BookmarkButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex-shrink-0 rounded-md p-1 transition-all duration-fast",
        isBookmarked
          ? "text-accent hover:text-accent/80"
          : "text-muted/40 hover:text-muted"
      )}
      title={isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Bookmark
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          isBookmarked && "fill-current"
        )}
      />
    </button>
  );
}
