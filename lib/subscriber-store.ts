import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ─── Types ────────────────────────────────────────────
export interface Subscriber {
  email: string;
  subscribedAt: string;
  active: boolean;
}

interface SubscriberRow {
  email: string;
  subscribed_at: string;
  active: boolean;
}

function rowToSubscriber(row: SubscriberRow): Subscriber {
  return { email: row.email, subscribedAt: row.subscribed_at, active: row.active };
}

// ─── Public API (same interface as before) ────────────

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getSupabase()
    .from("subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (error) {
    console.error("[SUBSCRIBERS] Fetch failed:", error.message);
    return [];
  }
  return (data as SubscriberRow[]).map(rowToSubscriber);
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getSupabase()
    .from("subscribers")
    .select("*")
    .eq("active", true)
    .order("subscribed_at", { ascending: false });

  if (error) {
    console.error("[SUBSCRIBERS] Fetch active failed:", error.message);
    return [];
  }
  return (data as SubscriberRow[]).map(rowToSubscriber);
}

export async function addSubscriber(email: string): Promise<{ success: boolean; message: string }> {
  const normalized = email.toLowerCase().trim();

  if (!normalized || !normalized.includes("@")) {
    return { success: false, message: "Email inválido." };
  }

  // Check if already exists
  const { data: existing } = await getSupabase()
    .from("subscribers")
    .select("email, active")
    .eq("email", normalized)
    .single();

  if (existing) {
    if (existing.active) {
      return { success: false, message: "Este email já está inscrito." };
    }
    // Reactivate
    const { error } = await getSupabase()
      .from("subscribers")
      .update({ active: true, subscribed_at: new Date().toISOString() })
      .eq("email", normalized);

    if (error) return { success: false, message: "Erro ao reativar inscrição." };
    return { success: true, message: "Inscrição reativada!" };
  }

  // New subscriber
  const { error } = await getSupabase()
    .from("subscribers")
    .insert({ email: normalized, subscribed_at: new Date().toISOString(), active: true });

  if (error) {
    console.error("[SUBSCRIBERS] Insert failed:", error.message);
    return { success: false, message: "Erro ao processar inscrição." };
  }
  return { success: true, message: "Inscrito com sucesso!" };
}

export async function removeSubscriber(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();

  const { error } = await getSupabase()
    .from("subscribers")
    .update({ active: false })
    .eq("email", normalized);

  if (error) {
    console.error("[SUBSCRIBERS] Remove failed:", error.message);
    return false;
  }
  return true;
}
