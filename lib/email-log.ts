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
export type EmailStatus = "sent" | "delivered" | "bounced" | "complained" | "failed";

export interface EmailLogEntry {
  id?: number;
  edition_id: string;
  email: string;
  resend_id: string | null;
  status: EmailStatus;
  error: string | null;
  sent_at: string;
  delivered_at: string | null;
  updated_at: string;
}

export interface DeliveryReport {
  edition_id: string;
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  delivery_rate: number;
  details: EmailLogEntry[];
}

// ─── Write ────────────────────────────────────────────

export async function logEmailSend(
  editionId: string,
  email: string,
  resendId: string | null,
  status: EmailStatus,
  error?: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error: dbError } = await getSupabase().from("email_logs").insert({
    edition_id: editionId,
    email,
    resend_id: resendId,
    status,
    error: error || null,
    sent_at: now,
    delivered_at: status === "delivered" ? now : null,
    updated_at: now,
  });

  if (dbError) {
    console.error("[EMAIL-LOG] Insert failed:", dbError.message);
  }
}

export async function updateEmailStatus(
  resendId: string,
  status: EmailStatus,
  timestamp?: string
): Promise<void> {
  const updates: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "delivered") {
    updates.delivered_at = timestamp || new Date().toISOString();
  }

  const { error } = await getSupabase()
    .from("email_logs")
    .update(updates)
    .eq("resend_id", resendId);

  if (error) {
    console.error("[EMAIL-LOG] Update failed:", error.message);
  }
}

// ─── Read ─────────────────────────────────────────────

export async function getDeliveryReport(editionId: string): Promise<DeliveryReport> {
  const { data, error } = await getSupabase()
    .from("email_logs")
    .select("*")
    .eq("edition_id", editionId)
    .order("sent_at", { ascending: true });

  const entries = (data || []) as EmailLogEntry[];

  const counts = { sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0 };
  for (const e of entries) {
    if (e.status in counts) counts[e.status as keyof typeof counts]++;
  }

  return {
    edition_id: editionId,
    total: entries.length,
    ...counts,
    delivery_rate: entries.length > 0 ? Math.round((counts.delivered / entries.length) * 100) : 0,
    details: entries,
  };
}

export async function getRecentReports(limit = 7): Promise<Omit<DeliveryReport, "details">[]> {
  const { data, error } = await getSupabase()
    .from("email_logs")
    .select("edition_id, status")
    .order("sent_at", { ascending: false })
    .limit(5000);

  if (error || !data) return [];

  // Group by edition
  const byEdition: Record<string, EmailLogEntry[]> = {};
  for (const row of data as Pick<EmailLogEntry, "edition_id" | "status">[]) {
    if (!byEdition[row.edition_id]) byEdition[row.edition_id] = [];
    byEdition[row.edition_id].push(row as EmailLogEntry);
  }

  return Object.entries(byEdition)
    .slice(0, limit)
    .map(([edition_id, entries]) => {
      const counts = { sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0 };
      for (const e of entries) {
        if (e.status in counts) counts[e.status as keyof typeof counts]++;
      }
      return {
        edition_id,
        total: entries.length,
        ...counts,
        delivery_rate: entries.length > 0 ? Math.round((counts.delivered / entries.length) * 100) : 0,
      };
    });
}
