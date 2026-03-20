import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const EDITIONS_FILE = join(DATA_DIR, "editions.json");

export interface StoredEdition {
  id: string; // YYYY-MM-DD
  date: string;
  dateLabel: string;
  headline: string;
  articleCount: number;
  marketData?: { label: string; value: string; change: string; up: boolean }[];
  sections: {
    topic: string;
    label: string;
    emoji: string;
    items: {
      title: string;
      summary: string;
      source: string;
      link: string;
      publishedAt: string;
      topic: string;
      image: string | null;
    }[];
  }[];
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllEditions(): StoredEdition[] {
  ensureDataDir();
  if (!existsSync(EDITIONS_FILE)) return [];
  try {
    const raw = readFileSync(EDITIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getEdition(id: string): StoredEdition | null {
  const editions = getAllEditions();
  return editions.find((e) => e.id === id) || null;
}

export function saveEdition(edition: StoredEdition): void {
  ensureDataDir();
  const editions = getAllEditions();

  // Replace if same date exists, otherwise prepend
  const idx = editions.findIndex((e) => e.id === edition.id);
  if (idx >= 0) {
    editions[idx] = edition;
  } else {
    editions.unshift(edition);
  }

  // Keep max 30 editions
  const trimmed = editions.slice(0, 30);
  writeFileSync(EDITIONS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}
