import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Supabase Client (lazy init — env vars not available at build time)
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ─── Types ────────────────────────────────────────────
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

// DB row shape (snake_case) → app shape (camelCase)
interface EditionRow {
  id: string;
  date: string;
  date_label: string;
  headline: string;
  article_count: number;
  market_data: StoredEdition["marketData"] | null;
  sections: StoredEdition["sections"];
}

function rowToEdition(row: EditionRow): StoredEdition {
  return {
    id: row.id,
    date: row.date,
    dateLabel: row.date_label,
    headline: row.headline,
    articleCount: row.article_count,
    marketData: row.market_data || undefined,
    sections: row.sections,
  };
}

function editionToRow(edition: StoredEdition): EditionRow {
  return {
    id: edition.id,
    date: edition.date,
    date_label: edition.dateLabel,
    headline: edition.headline,
    article_count: edition.articleCount,
    market_data: edition.marketData || null,
    sections: edition.sections,
  };
}

// ─── Public API (same interface as before) ────────────

export async function getAllEditions(): Promise<StoredEdition[]> {
  const { data, error } = await getSupabase()
    .from("editions")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[STORE] Failed to fetch editions:", error.message);
    return [];
  }

  return (data as EditionRow[]).map(rowToEdition);
}

export async function getEdition(id: string): Promise<StoredEdition | null> {
  const { data, error } = await getSupabase()
    .from("editions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return rowToEdition(data as EditionRow);
}

export async function saveEdition(edition: StoredEdition): Promise<void> {
  const row = editionToRow(edition);

  const { error } = await getSupabase()
    .from("editions")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("[STORE] Failed to save edition:", error.message);
    throw new Error(`Failed to save edition: ${error.message}`);
  }
}
