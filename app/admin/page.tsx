"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Mail, Trash2, RefreshCw, Lock } from "lucide-react";

interface Subscriber {
  email: string;
  subscribedAt: string;
  active: boolean;
}

const ADMIN_PASSWORD = "harven2026";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
      loadSubscribers();
    } else {
      setError("Senha incorreta");
    }
  }

  async function loadSubscribers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function removeSubscriber(email: string) {
    setActionLoading(email);
    try {
      await fetch(`/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`);
      await loadSubscribers();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function triggerEdition() {
    setActionLoading("generate");
    try {
      const res = await fetch("/api/newsletter/briefing", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`Edição gerada: ${data.edition?.id}\nArtigos: ${data.articleCount}\nEmails: ${data.email?.sent || 0} enviados`);
      }
    } catch {
      alert("Erro ao gerar edição");
    } finally {
      setActionLoading(null);
    }
  }

  async function triggerDigest(type: "weekly" | "monthly") {
    setActionLoading(type);
    try {
      const res = await fetch("/api/newsletter/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Resumo ${type} gerado: ${data.edition?.id}`);
      }
    } catch {
      alert("Erro ao gerar resumo");
    } finally {
      setActionLoading(null);
    }
  }

  const active = subscribers.filter((s) => s.active);
  const inactive = subscribers.filter((s) => !s.active);

  // ─── Login ──────────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 16, padding: "40px 36px", width: 360, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <Lock style={{ width: 24, height: 24, color: "#9C8A55", margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px" }}>Admin</h1>
          <p style={{ fontSize: 12, color: "#999", margin: "0 0 24px" }}>Harven Finance Newsletter</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Senha"
            style={{ width: "100%", padding: "12px 16px", fontSize: 14, border: "1px solid #E6E4DE", borderRadius: 10, outline: "none", marginBottom: 12 }}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" style={{ width: "100%", padding: "12px", fontSize: 13, fontWeight: 600, color: "#fff", background: "#9C8A55", border: "none", borderRadius: 10, cursor: "pointer" }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ─── Dashboard ──────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E6E4DE", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/harven-finance-logo-dark.png" alt="" style={{ height: 28 }} />
          <span style={{ width: 1, height: 20, background: "#E6E4DE" }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#9C8A55" }}>Admin</span>
        </div>
        <a href="/newsletter" style={{ fontSize: 12, color: "#999", textDecoration: "none" }}>← Newsletter</a>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          <StatCard icon={<Users style={{ width: 18, height: 18, color: "#9C8A55" }} />} value={active.length} label="Inscritos ativos" />
          <StatCard icon={<Mail style={{ width: 18, height: 18, color: "#9C8A55" }} />} value={inactive.length} label="Descadastrados" />
          <StatCard icon={<Users style={{ width: 18, height: 18, color: "#9C8A55" }} />} value={subscribers.length} label="Total histórico" />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" as const }}>
          <ActionButton label="Gerar edição + enviar" loading={actionLoading === "generate"} onClick={triggerEdition} />
          <ActionButton label="Resumo semanal" loading={actionLoading === "weekly"} onClick={() => triggerDigest("weekly")} />
          <ActionButton label="Resumo mensal" loading={actionLoading === "monthly"} onClick={() => triggerDigest("monthly")} />
          <button onClick={loadSubscribers} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 12, fontWeight: 500, color: "#999", background: "#fff", border: "1px solid #E6E4DE", borderRadius: 8, cursor: "pointer" }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Atualizar
          </button>
        </div>

        {/* Subscribers list */}
        <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E6E4DE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#9C8A55", margin: 0 }}>Inscritos</p>
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>{active.length} ativos</p>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Loader2 style={{ width: 20, height: 20, color: "#9C8A55", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            </div>
          ) : subscribers.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#999" }}>Nenhum inscrito ainda.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0EDE7" }}>
                  <th style={{ textAlign: "left", padding: "10px 20px", fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Email</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Data</th>
                  <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Status</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.email} style={{ borderBottom: "1px solid #F8F7F4" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{sub.email}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#999", fontFamily: "monospace" }}>
                      {new Date(sub.subscribedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 600,
                        background: sub.active ? "rgba(76,175,80,0.1)" : "rgba(239,68,68,0.1)",
                        color: sub.active ? "#4CAF50" : "#EF4444",
                      }}>
                        {sub.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {sub.active && (
                        <button
                          onClick={() => removeSubscriber(sub.email)}
                          disabled={actionLoading === sub.email}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#CCC", transition: "color 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#CCC")}
                        >
                          {actionLoading === sub.email ? (
                            <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Trash2 style={{ width: 14, height: 14 }} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E6E4DE", borderRadius: 12, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(156,138,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
        <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>{label}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 18px",
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: "#9C8A55",
        border: "none",
        borderRadius: 8,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {loading && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
      {label}
    </button>
  );
}
