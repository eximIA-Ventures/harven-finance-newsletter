"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Mail, Trash2, RefreshCw, Lock, Send, Calendar, BarChart3, Clock, ChevronRight, FileText } from "lucide-react";

interface Subscriber {
  email: string;
  subscribedAt: string;
  active: boolean;
}

interface EditionSummary {
  id: string;
  dateLabel: string;
  headline: string;
  articleCount: number;
}

const ADMIN_PASSWORD = "harven2026";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"subscribers" | "editions" | "actions">("subscribers");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
      loadData();
    } else {
      setError("Senha incorreta");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [subRes, edRes] = await Promise.all([
        fetch("/api/admin/subscribers"),
        fetch("/api/newsletter/briefing"),
      ]);
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscribers(data.subscribers || []);
      }
      if (edRes.ok) {
        const data = await edRes.json();
        setEditions((data.editions || []).map((e: any) => ({
          id: e.id,
          dateLabel: e.dateLabel,
          headline: e.headline,
          articleCount: e.articleCount,
        })));
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function removeSubscriber(email: string) {
    setActionLoading(email);
    try {
      await fetch(`/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`);
      await loadData();
    } catch {} finally {
      setActionLoading(null);
    }
  }

  async function triggerAction(action: string, fetchOpts: RequestInit) {
    setActionLoading(action);
    try {
      const res = await fetch(
        action === "daily" ? "/api/newsletter/briefing" : "/api/newsletter/digest",
        fetchOpts
      );
      if (res.ok) {
        const data = await res.json();
        await loadData();
        return data;
      }
    } catch {} finally {
      setActionLoading(null);
    }
  }

  const active = subscribers.filter((s) => s.active);
  const inactive = subscribers.filter((s) => !s.active);

  // ─── Login ──────────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", borderRadius: 20, padding: "48px 40px", width: 380, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(156,138,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock style={{ width: 24, height: 24, color: "#9C8A55" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>Admin</h1>
          <p style={{ fontSize: 13, color: "#999", margin: "0 0 28px" }}>Harven Finance Newsletter</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Senha de acesso"
            style={{ width: "100%", padding: "14px 18px", fontSize: 14, border: "1px solid #E6E4DE", borderRadius: 12, outline: "none", marginBottom: 14, transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = "#9C8A55")}
            onBlur={(e) => (e.target.style.borderColor = "#E6E4DE")}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 14px" }}>{error}</p>}
          <button type="submit" style={{ width: "100%", padding: "14px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#9C8A55", border: "none", borderRadius: 12, cursor: "pointer", transition: "opacity 0.15s" }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ─── Admin Dashboard ────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E6E4DE" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/harven-finance-logo-dark.png" alt="" style={{ height: 32 }} />
            <span style={{ width: 1, height: 22, background: "#E6E4DE" }} />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#9C8A55" }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#999", background: "none", border: "1px solid #E6E4DE", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> Atualizar
            </button>
            <a href="/newsletter" style={{ fontSize: 12, color: "#9C8A55", textDecoration: "none", fontWeight: 500 }}>Newsletter →</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard icon={<Users />} value={active.length} label="Ativos" color="#4CAF50" />
          <StatCard icon={<Mail />} value={inactive.length} label="Inativos" color="#EF4444" />
          <StatCard icon={<FileText />} value={editions.length} label="Edições" color="#9C8A55" />
          <StatCard icon={<BarChart3 />} value={subscribers.length} label="Total" color="#666" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #E6E4DE" }}>
          {([
            { key: "subscribers", label: "Inscritos", icon: <Users style={{ width: 14, height: 14 }} /> },
            { key: "editions", label: "Edições", icon: <Calendar style={{ width: 14, height: 14 }} /> },
            { key: "actions", label: "Ações", icon: <Send style={{ width: 14, height: 14 }} /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: tab === t.key ? "#9C8A55" : "#999",
                borderBottom: tab === t.key ? "2px solid #9C8A55" : "2px solid transparent",
                marginBottom: -2,
                transition: "all 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Subscribers */}
        {tab === "subscribers" && (
          <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 14, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <Loader2 style={{ width: 20, height: 20, color: "#9C8A55", animation: "spin 1s linear infinite", margin: "0 auto" }} />
              </div>
            ) : subscribers.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <Users style={{ width: 32, height: 32, color: "#E6E4DE", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "#999" }}>Nenhum inscrito ainda.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    <TH>Email</TH>
                    <TH>Inscrito em</TH>
                    <TH align="center">Status</TH>
                    <th style={{ width: 50 }} />
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.email} style={{ borderBottom: "1px solid #F5F4F0" }}>
                      <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{sub.email}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#999", fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(sub.subscribedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: sub.active ? "rgba(76,175,80,0.08)" : "rgba(239,68,68,0.08)",
                          color: sub.active ? "#4CAF50" : "#EF4444",
                        }}>
                          {sub.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {sub.active && (
                          <button
                            onClick={() => removeSubscriber(sub.email)}
                            disabled={actionLoading === sub.email}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#DDD", borderRadius: 6, transition: "all 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#DDD"; e.currentTarget.style.background = "none"; }}
                          >
                            {actionLoading === sub.email ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Editions */}
        {tab === "editions" && (
          <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 14, overflow: "hidden" }}>
            {editions.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <Calendar style={{ width: 32, height: 32, color: "#E6E4DE", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "#999" }}>Nenhuma edição gerada.</p>
              </div>
            ) : (
              <div>
                {editions.map((ed) => {
                  const isWeekly = ed.id.includes("-W");
                  const isMonthly = ed.id.includes("-M");
                  const badge = isWeekly ? "Semanal" : isMonthly ? "Mensal" : "Diário";
                  const badgeColor = isWeekly ? "#2196F3" : isMonthly ? "#9C27B0" : "#9C8A55";
                  return (
                    <div key={ed.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #F5F4F0" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${badgeColor}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Calendar style={{ width: 16, height: 16, color: badgeColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ed.headline}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: "#999", textTransform: "capitalize" }}>{ed.dateLabel}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${badgeColor}15`, color: badgeColor }}>{badge}</span>
                          <span style={{ fontSize: 11, color: "#CCC" }}>{ed.articleCount} matérias</span>
                        </div>
                      </div>
                      <a href={`/newsletter`} style={{ color: "#CCC", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#9C8A55")} onMouseLeave={(e) => (e.currentTarget.style.color = "#CCC")}>
                        <ChevronRight style={{ width: 16, height: 16 }} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Actions */}
        {tab === "actions" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            <ActionCard
              icon={<Send style={{ width: 20, height: 20 }} />}
              title="Gerar edição diária"
              desc="Busca notícias, gera resumos com IA e envia para todos os inscritos."
              buttonLabel="Gerar + Enviar"
              loading={actionLoading === "daily"}
              onClick={() => triggerAction("daily", { method: "POST" })}
            />
            <ActionCard
              icon={<Calendar style={{ width: 20, height: 20 }} />}
              title="Resumo semanal"
              desc="Sintetiza todas as edições da semana em panorama + destaques + perspectiva."
              buttonLabel="Gerar semanal"
              loading={actionLoading === "weekly"}
              onClick={() => triggerAction("weekly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "weekly" }) })}
            />
            <ActionCard
              icon={<BarChart3 style={{ width: 20, height: 20 }} />}
              title="Resumo mensal"
              desc="Reúne o mês inteiro em análise macro por editoria."
              buttonLabel="Gerar mensal"
              loading={actionLoading === "monthly"}
              onClick={() => triggerAction("monthly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "monthly" }) })}
            />
            <ActionCard
              icon={<Clock style={{ width: 20, height: 20 }} />}
              title="Atualizar cotações"
              desc="Força refresh dos dados de mercado (USD, Ibovespa, commodities)."
              buttonLabel="Atualizar"
              loading={actionLoading === "market"}
              onClick={async () => {
                setActionLoading("market");
                try { await fetch("/api/market?refresh=true"); } catch {} finally { setActionLoading(null); }
              }}
            />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Shared ───────────────────────────────────────────── */

function TH({ children, align }: { children: React.ReactNode; align?: string }) {
  return (
    <th style={{ textAlign: (align || "left") as any, padding: "12px 20px", fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.08em", textTransform: "uppercase" as const, borderBottom: "1px solid #E6E4DE" }}>
      {children}
    </th>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 14, padding: "20px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
        <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, buttonLabel, loading, onClick }: {
  icon: React.ReactNode; title: string; desc: string; buttonLabel: string; loading: boolean; onClick: () => void;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 14, padding: "24px", display: "flex", flexDirection: "column" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(156,138,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9C8A55", marginBottom: 16 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", margin: "0 0 6px" }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#999", lineHeight: 1.5, margin: "0 0 20px", flex: 1 }}>{desc}</p>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          padding: "11px",
          fontSize: 13,
          fontWeight: 600,
          color: "#fff",
          background: "#9C8A55",
          border: "none",
          borderRadius: 10,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {loading && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
        {buttonLabel}
      </button>
    </div>
  );
}
