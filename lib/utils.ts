import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay === 1) return "ontem";
  if (diffDay < 7) return `há ${diffDay} dias`;
  if (diffDay < 30) return `há ${Math.floor(diffDay / 7)} sem`;
  return `há ${Math.floor(diffDay / 30)} meses`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    agro: "Agro",
    business: "Finanças",
    brazil: "Geopolítica",
    custom: "Outros",
  };
  return labels[category] || category;
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    agro: "var(--c-accent)",
    business: "var(--c-accent)",
    brazil: "var(--c-accent)",
    custom: "var(--c-muted)",
  };
  return colors[category] || "var(--c-muted)";
}
