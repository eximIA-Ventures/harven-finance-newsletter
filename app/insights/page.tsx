"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  ArrowLeft,
  RefreshCw,
  Lock,
} from "lucide-react";
import Link from "next/link";

const ADMIN_PASSWORD = "harven2026";

interface DailyStats {
  date: string;
  views: number;
  visitors: number;
}

interface Stats {
  totalViews: number;
  uniqueVisitors: number;
  daily: DailyStats[];
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  devices: { mobile: number; desktop: number };
  articleClicks: number;
  period: { from: string; to: string };
}

export default function InsightsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(30);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Senha incorreta");
    }
  }

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/stats?days=${period}`);
      const data = await res.json();
      setStats(data);
    } catch {
      // silent fail
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) fetchStats();
  }, [period, authenticated]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-surface border border-border rounded-xl p-8 w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} className="text-accent" />
            <h1 className="text-xl font-bold font-display">Insights</h1>
          </div>
          <p className="text-muted text-sm mb-4">
            Área restrita. Insira a senha de administrador.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-fg mb-3 focus:outline-none focus:border-accent"
            autoFocus
          />
          {authError && (
            <p className="text-red-400 text-sm mb-3">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const maxViews = stats
    ? Math.max(...stats.daily.map((d) => d.views), 1)
    : 1;

  const totalDevices = stats
    ? stats.devices.mobile + stats.devices.desktop
    : 1;

  return (
    <div className="min-h-screen bg-bg text-fg p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display">Insights</h1>
            <p className="text-muted text-sm">
              Analytics de acesso da plataforma
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button
            onClick={fetchStats}
            className="p-2 rounded-lg bg-surface border border-border hover:bg-border transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-muted" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard
              icon={<Eye size={20} />}
              label="Page Views"
              value={stats.totalViews.toLocaleString("pt-BR")}
            />
            <KPICard
              icon={<Users size={20} />}
              label="Visitantes Únicos"
              value={stats.uniqueVisitors.toLocaleString("pt-BR")}
            />
            <KPICard
              icon={<MousePointerClick size={20} />}
              label="Cliques em Artigos"
              value={stats.articleClicks.toLocaleString("pt-BR")}
            />
            <KPICard
              icon={<BarChart3 size={20} />}
              label="Média/Dia"
              value={
                stats.daily.length > 0
                  ? Math.round(
                      stats.totalViews / stats.daily.length
                    ).toLocaleString("pt-BR")
                  : "0"
              }
            />
          </div>

          {/* Chart — Page Views per Day */}
          <div className="bg-surface border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-accent" />
              Views por Dia
            </h2>
            {stats.daily.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">
                Nenhum dado ainda. Os eventos aparecem conforme os usuários
                acessam a plataforma.
              </p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {stats.daily.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.views}
                    </span>
                    <div
                      className="w-full bg-accent/80 rounded-t hover:bg-accent transition-colors min-h-[2px]"
                      style={{
                        height: `${(day.views / maxViews) * 100}%`,
                      }}
                    />
                    <span className="text-[10px] text-muted -rotate-45 origin-top-left whitespace-nowrap">
                      {new Date(day.date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "2-digit" }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grid: Pages + Referrers + Devices */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Top Pages */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                Top Páginas
              </h2>
              {stats.topPages.length === 0 ? (
                <p className="text-muted text-sm">Sem dados</p>
              ) : (
                <ul className="space-y-3">
                  {stats.topPages.map((page) => (
                    <li key={page.path} className="flex justify-between text-sm">
                      <span className="text-fg truncate mr-2 font-mono text-xs">
                        {page.path}
                      </span>
                      <span className="text-muted shrink-0">
                        {page.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Referrers */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe size={18} className="text-accent" />
                Top Referrers
              </h2>
              {stats.topReferrers.length === 0 ? (
                <p className="text-muted text-sm">Sem dados</p>
              ) : (
                <ul className="space-y-3">
                  {stats.topReferrers.map((ref) => (
                    <li
                      key={ref.referrer}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-fg truncate mr-2">
                        {ref.referrer}
                      </span>
                      <span className="text-muted shrink-0">{ref.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Devices */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Monitor size={18} className="text-accent" />
                Dispositivos
              </h2>
              <div className="space-y-4">
                <DeviceBar
                  icon={<Monitor size={16} />}
                  label="Desktop"
                  count={stats.devices.desktop}
                  total={totalDevices}
                />
                <DeviceBar
                  icon={<Smartphone size={16} />}
                  label="Mobile"
                  count={stats.devices.mobile}
                  total={totalDevices}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted text-center py-16">
          Erro ao carregar analytics.
        </p>
      )}
    </div>
  );
}

// ── Components ──────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold font-display">{value}</p>
    </div>
  );
}

function DeviceBar({
  icon,
  label,
  count,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2">
          {icon} {label}
        </span>
        <span className="text-muted">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
