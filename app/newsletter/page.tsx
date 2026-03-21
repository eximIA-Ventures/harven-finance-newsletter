"use client";

import { useState, useEffect } from "react";
import { Loader2, Sun, Moon, ChevronRight, Calendar, FileText } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

interface BriefingArticle {
  title: string;
  summary: string;
  source: string;
  link: string;
  publishedAt: string;
  topic: string;
  image: string | null;
}

interface BriefingSection {
  topic: string;
  label: string;
  emoji: string;
  items: BriefingArticle[];
}

interface Edition {
  id: string;
  date: string;
  dateLabel: string;
  headline: string;
  articleCount: number;
  sections: BriefingSection[];
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function NewsletterPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<"home" | "edition">("home");
  const [openEditionId, setOpenEditionId] = useState<string | null>(null);
  const [editionFilter, setEditionFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");

  useEffect(() => {
    async function loadEditions() {
      try {
        // GET = instant read from stored editions (no generation)
        const res = await fetch("/api/newsletter/briefing");
        if (!res.ok) return;
        const data = await res.json();
        setEditions(data.editions || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  const latestEdition = editions[0] || null;
  const pastEditions = editions.slice(1);
  const openEdition = openEditionId
    ? editions.find((e) => e.id === openEditionId) || null
    : null;

  function openEd(id: string) {
    setOpenEditionId(id);
    setView("edition");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setView("home");
    setOpenEditionId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const t = useTheme(dark);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.bg, transition: "background-color 0.3s" }}>
      {/* ─── Topbar ───────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: t.bg,
        borderBottom: `1px solid ${t.border}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0 24px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Left: Logo */}
          <button
            onClick={goHome}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 14 }}
          >
            <img
              src={t.logo}
              alt="Harven Finance"
              style={{ height: 54, width: "auto", transform: "translateX(-4px)" }}
            />
            <span style={{
              width: 1,
              height: 24,
              background: t.border,
              display: "block",
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: t.gold,
            }}>
              Newsletter
            </span>
          </button>

          {/* Right: Nav + Theme */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {view === "edition" && (
              <button
                onClick={goHome}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: t.muted,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = t.gold)}
                onMouseLeave={(e) => (e.currentTarget.style.color = t.muted)}
              >
                Edições
              </button>
            )}
            <button
              onClick={() => setDark(!dark)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1px solid ${t.cardBorder}`,
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {dark ? (
                <Sun style={{ width: 14, height: 14, color: t.gold }} />
              ) : (
                <Moon style={{ width: 14, height: 14, color: t.muted }} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Edition Detail ─────────────────────────────────── */}
      {view === "edition" && openEdition && (() => {
        const isDigest = openEdition.id.includes("-W") || openEdition.id.includes("-M");
        const editionType = openEdition.id.includes("-W") ? "Resumo Semanal" : openEdition.id.includes("-M") ? "Resumo Mensal" : "Briefing Diário";

        return (
          <>
            {/* Edition header */}
            <div style={{ maxWidth: isDigest ? 800 : 680, margin: "0 auto", padding: "48px 24px 0", textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: t.gold, margin: 0 }}>
                {editionType}
              </p>
              <p style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: t.muted, textTransform: "capitalize" }}>
                {openEdition.dateLabel}
              </p>
              {isDigest && (
                <p style={{ marginTop: 6, fontSize: 13, color: t.body }}>
                  {openEdition.articleCount} matérias analisadas · {openEdition.sections.length} editorias
                </p>
              )}
              <div style={{ width: 40, height: 1, background: t.gold, margin: "20px auto 0", opacity: 0.3 }} />
            </div>

            {isDigest ? (
              /* Digest: full-width, no sidebars */
              <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
                <EditionContent sections={openEdition.sections} t={t} />
                <SubscribeBox t={t} />
              </main>
            ) : (
              /* Daily: 3-column with sidebars */
              <div style={{
                maxWidth: 1400,
                margin: "0 auto",
                padding: "0 24px",
                display: "flex",
                justifyContent: "center",
                gap: 32,
                position: "relative",
              }}>
                <SidebarLeft edition={openEdition} t={t} />
                <main style={{ width: "100%", maxWidth: 680, minWidth: 0 }}>
                  <EditionContent sections={openEdition.sections} t={t} />
                  <SubscribeBox t={t} />
                </main>
                <SidebarRight edition={openEdition} t={t} />
              </div>
            )}

            <Footer t={t} />
          </>
        );
      })()}

      {/* ─── Home View ────────────────────────────────────── */}
      {view === "home" && (() => {
        const allItems = latestEdition?.sections.flatMap((s) => s.items) || [];
        const heroArticle = allItems.find((a) => a.image && !a.image.toLowerCase().includes("logo") && !a.image.endsWith(".svg")) || allItems[0];
        const heroSection = latestEdition?.sections.find((s) => s.items.includes(heroArticle));
        const validImage = (img: string | null) => img && !img.toLowerCase().includes("logo") && !img.endsWith(".svg");

        return (
          <>
            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "120px 0", gap: 16 }}>
                <Loader2 style={{ width: 20, height: 20, color: t.gold, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: t.muted }}>Carregando edições...</span>
              </div>
            )}

            {/* ─── Hero Tagline ──────────────────────────────── */}
            {!loading && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "56px 24px 0" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: t.gold, margin: 0 }}>
                  Harven Finance Newsletter
                </p>
                <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, color: t.title, margin: "16px 0 0", letterSpacing: "-0.02em" }}>
                  O briefing que{" "}
                  <span style={{ color: t.gold }}>antecipa o mercado.</span>
                </h1>
                <p style={{ fontSize: 15, color: t.muted, margin: "14px 0 0", lineHeight: 1.6, maxWidth: 480 }}>
                  Agronegócio, finanças e geopolítica analisados com IA. Para quem decide, não para quem assiste.
                </p>

                {/* Category pills */}
                <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" as const }}>
                  {["Agronegócio", "Finanças", "Geopolítica"].map((cat) => (
                    <span key={cat} style={{
                      fontSize: 12,
                      color: t.muted,
                      border: `1px solid ${t.cardBorder}`,
                      borderRadius: 20,
                      padding: "6px 14px",
                      fontWeight: 500,
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Em Destaque (featured article — horizontal card) */}
            {!loading && latestEdition && heroArticle && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ marginTop: 56 }}>
                  <SectionLabel text="Em destaque" t={t} />

                  <button
                    onClick={() => openEd(latestEdition.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: t.cardBg,
                      border: `1px solid ${t.cardBorder}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${t.shadow}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", flexDirection: window.innerWidth < 640 ? "column" : "row" as any }}>
                      {/* Image */}
                      {validImage(heroArticle.image) && (
                        <div style={{ flexShrink: 0, width: "50%", minHeight: 220, overflow: "hidden" }}>
                          <img
                            src={heroArticle.image!}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block", minHeight: 220 }}
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                          />
                        </div>
                      )}
                      {/* Content */}
                      <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                          <span style={{ fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: t.gold }}>{heroSection?.label}</span>
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, color: t.title, margin: "10px 0 0", letterSpacing: "-0.01em" }}>
                          {heroArticle.title}
                        </h2>
                        <p style={{ fontSize: 13, color: t.body, margin: "10px 0 0", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                          {heroArticle.summary.split("\n\n")[0]}
                        </p>
                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: t.muted }}>
                          <span style={{ textTransform: "capitalize" }}>{latestEdition.dateLabel}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ─── Subscribe CTA ────────────────────────────── */}
            {!loading && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
                <SubscribeBox t={t} />
              </div>
            )}

            {/* ─── Edições (com filtros) ─────────────────────── */}
            {!loading && editions.length > 0 && (() => {
              const isDaily = (id: string) => !id.includes("W") && !id.includes("M");
              const isWeekly = (id: string) => id.includes("-W");
              const isMonthly = (id: string) => id.includes("-M");

              const filtered = editions.filter((ed) => {
                if (editionFilter === "daily") return isDaily(ed.id);
                if (editionFilter === "weekly") return isWeekly(ed.id);
                if (editionFilter === "monthly") return isMonthly(ed.id);
                return true;
              });

              const getTypeBadge = (id: string) => {
                if (isWeekly(id)) return "Semanal";
                if (isMonthly(id)) return "Mensal";
                return "Diário";
              };

              return (
                <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
                  <div style={{ marginTop: 56 }}>
                    {/* Header + Filters */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <SectionLabel text="Edições" t={t} />
                      <div style={{ display: "flex", gap: 4 }}>
                        {([
                          { key: "all", label: "Todas" },
                          { key: "daily", label: "Diário" },
                          { key: "weekly", label: "Semanal" },
                          { key: "monthly", label: "Mensal" },
                        ] as const).map((f) => (
                          <button
                            key={f.key}
                            onClick={() => setEditionFilter(f.key)}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              background: editionFilter === f.key ? t.gold : "transparent",
                              color: editionFilter === f.key ? "#fff" : t.muted,
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                      {filtered.slice(0, 9).map((edition) => {
                        const coverItem = edition.sections.flatMap((s) => s.items).find((a) => validImage(a.image));
                        const badge = getTypeBadge(edition.id);
                        return (
                          <button
                            key={edition.id}
                            onClick={() => openEd(edition.id)}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              background: t.cardBg,
                              border: `1px solid ${t.cardBorder}`,
                              borderRadius: 14,
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              padding: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${t.shadow}`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                          >
                            {coverItem?.image && (
                              <div style={{ width: "100%", height: 160, overflow: "hidden", position: "relative" }}>
                                <img src={coverItem.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                                {badge !== "Diário" && (
                                  <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: t.gold, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{badge}</span>
                                )}
                              </div>
                            )}
                            <div style={{ padding: "16px 20px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: t.muted }}>
                                <span style={{ textTransform: "capitalize" }}>{edition.dateLabel}</span>
                                {!coverItem?.image && badge !== "Diário" && (
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${t.gold}20`, color: t.gold }}>{badge}</span>
                                )}
                              </div>
                              <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: t.title, margin: "8px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{edition.headline}</h3>
                              <p style={{ fontSize: 12, color: t.muted, margin: "8px 0 0" }}>{edition.articleCount} matérias · {edition.sections.map((s) => s.label).join(", ")}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {filtered.length === 0 && (
                      <p style={{ textAlign: "center", fontSize: 13, color: t.muted, padding: "40px 0" }}>
                        Nenhuma edição {editionFilter === "weekly" ? "semanal" : editionFilter === "monthly" ? "mensal" : ""} disponível ainda.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ─── Por que assinar ──────────────────────────── */}
            {!loading && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ marginTop: 64, textAlign: "center" }}>
                  <SectionLabel text="Por que assinar" t={t} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 8 }}>
                    {[
                      { title: "Curadoria com IA", desc: "Cada notícia é lida, analisada e resumida por inteligência artificial. Nada de achismo." },
                      { title: "Decisão, não ruído", desc: "Escrevemos para quem precisa agir, não para quem quer apenas se manter atualizado." },
                      { title: "Três territórios", desc: "Agronegócio, finanças e geopolítica — pela lente de quem decide." },
                    ].map((item) => (
                      <div key={item.title} style={{ textAlign: "center", padding: "16px 8px" }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: t.title, margin: 0 }}>{item.title}</h4>
                        <p style={{ fontSize: 12, color: t.muted, margin: "8px 0 0", lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && editions.length === 0 && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: t.muted }}>Nenhuma edição disponível.</p>
              </div>
            )}

            <Footer t={t} />
          </>
        );
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1100px) {
          .sidebar-visible { display: block !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Shared Components ────────────────────────────────── */

function SubscribeBox({ t }: { t: ReturnType<typeof useTheme> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setMessage("Erro ao processar. Tente novamente.");
      setStatus("error");
    }
  }

  return (
    <div style={{
      maxWidth: 480,
      margin: "56px auto 0",
      padding: "36px 32px",
      background: t.cardBg,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 16,
      textAlign: "center",
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: t.gold, margin: 0 }}>
        Fique por dentro
      </p>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: t.title, margin: "12px 0 0", lineHeight: 1.3 }}>
        Receba o briefing diário no seu email
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
        Agro, Finanças e Geopolítica — todos os dias às 9h.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="Seu melhor email"
          required
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: 14,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 10,
            background: t.bg,
            color: t.title,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = t.gold)}
          onBlur={(e) => (e.target.style.borderColor = t.cardBorder)}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            padding: "12px 24px",
            fontSize: 13,
            fontWeight: 600,
            color: "#FFFFFF",
            background: t.gold,
            border: "none",
            borderRadius: 10,
            cursor: status === "loading" ? "wait" : "pointer",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap" as const,
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {status === "loading" ? "..." : "Assinar"}
        </button>
      </form>

      {status !== "idle" && status !== "loading" && (
        <p style={{
          marginTop: 12,
          fontSize: 13,
          color: status === "success" ? "#4CAF50" : "#EF4444",
          fontWeight: 500,
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

function Footer({ t }: { t: ReturnType<typeof useTheme> }) {
  return (
    <footer style={{ marginTop: 72, borderTop: `1px solid ${t.border}`, padding: "40px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 11, color: t.muted, margin: 0 }}>Harven Finance Newsletter</p>
      <p style={{ marginTop: 4, fontSize: 10, color: t.footerDim }}>Agro · Finanças · Geopolítica</p>
      <div style={{ width: 40, height: 1, background: t.gold, margin: "16px auto", opacity: 0.2 }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4 }}>
        <a href="/dashboard" style={{ fontSize: 11, color: t.muted, textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.muted)}>
          Dashboard
        </a>
        <span style={{ color: t.footerDim }}>·</span>
        <a href="https://portal.harvenfinance.com.br" style={{ fontSize: 11, color: t.muted, textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.muted)}>
          Portal Finance
        </a>
      </div>
    </footer>
  );
}

function SectionLabel({ text, t }: { text: string; t: ReturnType<typeof useTheme> }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: t.gold, marginBottom: 16 }}>
      {text}
    </p>
  );
}

/* ─── Edition Content ──────────────────────────────────── */

function EditionContent({ sections, t }: { sections: BriefingSection[]; t: ReturnType<typeof useTheme> }) {
  // Filter out bad images (too small, icons, placeholders)
  function isValidImage(url: string | null): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Filter out common bad patterns
    if (lower.includes("logo")) return false;
    if (lower.includes("favicon")) return false;
    if (lower.includes("icon")) return false;
    if (lower.includes("avatar")) return false;
    if (lower.includes("placeholder")) return false;
    if (lower.includes("default")) return false;
    if (lower.includes("1x1")) return false;
    if (lower.includes("pixel")) return false;
    if (lower.endsWith(".svg")) return false;
    if (lower.endsWith(".gif")) return false;
    if (lower.includes("badge")) return false;
    if (lower.includes("widget")) return false;
    return true;
  }

  return (
    <>
      {sections.map((section, sIdx) => (
        <section key={section.topic}>
          <div style={{ paddingTop: 40, paddingBottom: 14, borderBottom: `2px solid ${t.borderSection}`, marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: t.gold, margin: 0 }}>
              {section.label}
            </p>
          </div>

          {section.items.map((article, articleIdx) => (
            <article key={article.link || `${section.topic}-${articleIdx}`} style={{ paddingBottom: 36, marginBottom: 36, borderBottom: `1px solid ${t.border}` }}>
              <h3 style={{
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1.25,
                color: t.title,
                margin: "24px 0 0",
                letterSpacing: "-0.01em",
              }}>
                {article.title}
              </h3>

              {/* Image — only if valid, object-position top to avoid face crops */}
              {isValidImage(article.image) && (
                <div style={{
                  marginTop: 20,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: t.cardBorder,
                  maxHeight: 380,
                }}>
                  <img
                    src={article.image!}
                    alt=""
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: 380,
                      objectFit: "cover",
                      objectPosition: "center top",
                      display: "block",
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              )}

              {article.summary && (
                <div style={{ marginTop: 20 }}>
                  {article.summary.split("\n\n").map((paragraph, pIdx) => {
                    if (paragraph.startsWith("────")) {
                      const label = paragraph.replace(/─/g, "").trim();
                      return (
                        <div key={pIdx} style={{ marginTop: 28, marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: t.gold, margin: 0 }}>{label}</p>
                          <div style={{ height: 1, background: t.borderSection, marginTop: 8 }} />
                        </div>
                      );
                    }
                    if (paragraph.startsWith("•")) {
                      return (
                        <p key={pIdx} style={{
                          fontSize: 14,
                          lineHeight: 1.75,
                          color: t.body,
                          margin: 0,
                          marginTop: 10,
                          paddingLeft: 16,
                          borderLeft: `2px solid ${t.borderSection}`,
                        }}>
                          {paragraph.slice(1).trim()}
                        </p>
                      );
                    }
                    return (
                      <p key={pIdx} style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                        color: t.body,
                        margin: 0,
                        marginTop: pIdx > 0 ? 14 : 0,
                      }}>
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              )}

              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  color: t.gold,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Leia na íntegra — {article.source}
                <ChevronRight style={{ width: 14, height: 14 }} />
              </a>
            </article>
          ))}

          {sIdx < sections.length - 1 && <div style={{ height: 4 }} />}
        </section>
      ))}
    </>
  );
}

/* ─── Theme ────────────────────────────────────────────── */

/* ─── Left Sidebar ─────────────────────────────────────── */

function SidebarLeft({ edition, t }: { edition: Edition; t: ReturnType<typeof useTheme> }) {
  const allItems = edition.sections.flatMap((s) => s.items);
  const numberMatch = allItems[0]?.summary.match(/(R\$\s?[\d.,]+|US\$\s?[\d.,]+\s?\w+|[\d.,]+%|[\d.,]+\s?(bilh|milh|trilh)[õo])/i);
  const keyNumber = numberMatch ? numberMatch[0] : null;

  const [quotes, setQuotes] = useState<{ label: string; value: string; change: string; up: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then((d) => { if (d.quotes?.length) setQuotes(d.quotes); })
      .catch(() => {});
  }, []);

  return (
    <aside style={{ width: 240, flexShrink: 0, alignSelf: "flex-start", display: "none" }} className="sidebar-visible">

      {/* Cotações (dados reais + mini chart) */}
      <SidebarCard t={t} title="Cotações do dia">
        {quotes.length > 0 ? quotes.map((q) => (
          <QuoteRow key={q.label} quote={q} t={t} />
        )) : (
          <p style={{ fontSize: 11, color: t.muted, margin: 0 }}>Carregando...</p>
        )}
      </SidebarCard>

      {/* O número do dia */}
      {keyNumber && (
        <SidebarCard t={t} title="O número do dia">
          <p style={{ fontSize: 26, fontWeight: 800, color: t.title, margin: 0, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em", textAlign: "center" }}>{keyNumber}</p>
          <p style={{ fontSize: 11, color: t.muted, margin: "8px 0 0", lineHeight: 1.5, textAlign: "center" }}>{allItems[0]?.title.slice(0, 80)}</p>
        </SidebarCard>
      )}

      {/* Para acompanhar */}
      <SidebarCard t={t} title="Fontes originais">
        {allItems.slice(0, 5).map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", fontSize: 11, color: t.body, textDecoration: "none", padding: "6px 0", borderBottom: `1px solid ${t.border}`, lineHeight: 1.4, transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.gold)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.body)}>
            <span style={{ color: t.muted }}>{item.source}</span> — {item.title.length > 40 ? item.title.slice(0, 40) + "..." : item.title}
          </a>
        ))}
      </SidebarCard>
    </aside>
  );
}

/* ─── Right Sidebar ────────────────────────────────────── */

function SidebarRight({ edition, t }: { edition: Edition; t: ReturnType<typeof useTheme> }) {
  const allItems = edition.sections.flatMap((s) => s.items);

  return (
    <aside style={{ width: 240, flexShrink: 0, alignSelf: "flex-start", display: "none" }} className="sidebar-visible">

      {/* Índice */}
      <SidebarCard t={t} title="Nesta edição">
        {edition.sections.map((section) => (
          <div key={section.topic} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: t.gold, margin: "0 0 5px", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{section.label}</p>
            {section.items.map((item, i) => (
              <p key={i} style={{ fontSize: 11, color: t.body, margin: "0 0 3px", lineHeight: 1.35, paddingLeft: 8, borderLeft: `2px solid ${t.border}` }}>
                {item.title.length > 50 ? item.title.slice(0, 50) + "..." : item.title}
              </p>
            ))}
          </div>
        ))}
      </SidebarCard>

      {/* Insights por seção */}
      <SidebarCard t={t} title="Destaques">
        {edition.sections.map((section) => {
          const top = section.items[0];
          if (!top) return null;
          return (
            <div key={section.topic} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: t.gold, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{section.label}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: t.title, margin: "4px 0 0", lineHeight: 1.35 }}>{top.title.length > 60 ? top.title.slice(0, 60) + "..." : top.title}</p>
              <p style={{ fontSize: 11, color: t.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{top.summary.split("\n\n")[0]?.slice(0, 100)}...</p>
            </div>
          );
        })}
      </SidebarCard>

      {/* Info card */}
      <SidebarCard t={t} title="Sobre">
        <p style={{ fontSize: 11, color: t.body, lineHeight: 1.6, margin: 0 }}>
          Curadoria automatizada com IA. Cada matéria é lida na íntegra e resumida em 4 parágrafos: fatos, contexto, impacto e perspectiva.
        </p>
        <div style={{ marginTop: 12, padding: "10px 0 0", borderTop: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 10, color: t.muted, margin: 0 }}>Edições: {edition.articleCount} matérias</p>
          <p style={{ fontSize: 10, color: t.muted, margin: "2px 0 0" }}>Seções: {edition.sections.map(s => s.label).join(", ")}</p>
        </div>
      </SidebarCard>
    </aside>
  );
}

/* ─── Quote Row (clickable with sparkline) ─────────────── */

function QuoteRow({ quote, t }: { quote: { label: string; value: string; change: string; up: boolean }; t: ReturnType<typeof useTheme> }) {
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState<"1d" | "7d" | "30d">("7d");
  const [chartCache, setChartCache] = useState<Record<string, { date: string; value: number }[]>>({});
  const [loadingChart, setLoadingChart] = useState(false);

  const chartData = chartCache[period] || null;

  function handleClick() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (!chartCache[period]) loadPeriod(period);
  }

  function loadPeriod(p: "1d" | "7d" | "30d") {
    setPeriod(p);
    if (chartCache[p]) return;
    setLoadingChart(true);
    fetch(`/api/market/history?label=${encodeURIComponent(quote.label)}&period=${p}`)
      .then((r) => r.json())
      .then((d) => setChartCache((prev) => ({ ...prev, [p]: d.points || [] })))
      .catch(() => setChartCache((prev) => ({ ...prev, [p]: [] })))
      .finally(() => setLoadingChart(false));
  }

  function selectPeriod(p: "1d" | "7d" | "30d") {
    setPeriod(p);
    loadPeriod(p);
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 0",
          borderBottom: `1px solid ${t.border}`,
          cursor: "pointer",
          transition: "background-color 0.15s",
          borderRadius: 4,
          marginLeft: -4,
          marginRight: -4,
          paddingLeft: 4,
          paddingRight: 4,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = t.hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <div>
          <p style={{ fontSize: 10, color: t.muted, margin: 0 }}>{quote.label}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: t.title, margin: "1px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>{quote.value}</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: quote.up ? "#4CAF50" : "#EF4444" }}>{quote.change}</span>
      </div>

      {expanded && (
        <div style={{ padding: "8px 0 6px", borderBottom: `1px solid ${t.border}` }}>
          {/* Period selector */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {(["1d", "7d", "30d"] as const).map((p) => (
              <button
                key={p}
                onClick={(e) => { e.stopPropagation(); selectPeriod(p); }}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: period === p ? t.gold : "transparent",
                  color: period === p ? "#fff" : t.muted,
                }}
              >
                {p === "1d" ? "24h" : p === "7d" ? "7d" : "30d"}
              </button>
            ))}
          </div>

          {loadingChart ? (
            <p style={{ fontSize: 10, color: t.muted, textAlign: "center", margin: 0 }}>Carregando...</p>
          ) : chartData && chartData.length > 1 ? (
            <Sparkline data={chartData} color={quote.up ? "#4CAF50" : "#EF4444"} t={t} />
          ) : (
            <p style={{ fontSize: 10, color: t.muted, textAlign: "center", margin: 0 }}>Sem dados</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── SVG Sparkline Chart ──────────────────────────────── */

function Sparkline({ data, color, t }: { data: { date: string; value: number }[]; color: string; t: ReturnType<typeof useTheme> }) {
  const w = 210;
  const h = 70;
  const pad = 4;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d.value - min) / range) * (h - pad * 2 - 16);
    return { x, y, date: d.date, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${h - 16} L ${points[0].x.toFixed(1)} ${h - 16} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const firstDate = data[0]?.date?.slice(5).replace("-", "/");
  const lastDate = data[data.length - 1]?.date?.slice(5).replace("-", "/");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={0.08} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Start dot */}
        <circle cx={points[0].x} cy={points[0].y} r={2} fill={color} />
        {/* End dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={color} />
      </svg>
      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 9, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>{firstDate} · {typeof first === "number" ? first.toFixed(2) : first}</span>
        <span style={{ fontSize: 9, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{lastDate} · {typeof last === "number" ? last.toFixed(2) : last}</span>
      </div>
    </div>
  );
}

/* ─── Sidebar Card (shared) ────────────────────────────── */

function SidebarCard({ t, title, children }: { t: ReturnType<typeof useTheme>; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: t.gold, margin: "0 0 12px" }}>{title}</p>
      {children}
    </div>
  );
}

/* ─── Theme ────────────────────────────────────────────── */

function useTheme(dark: boolean) {
  return dark
    ? {
        bg: "#050505",
        cardBg: "#0A0A0A",
        cardBorder: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.04)",
        borderSection: "rgba(184,161,107,0.2)",
        title: "#F5F5F5",
        body: "#B0B0B0",
        muted: "#5A5A5A",
        gold: "#B8A16B",
        goldFaint: "rgba(184,161,107,0.25)",
        hoverBg: "rgba(255,255,255,0.015)",
        footerDim: "#333333",
        logo: "/harven-finance-logo.png",
        dateBadge: "rgba(184,161,107,0.08)",
        shadow: "rgba(0,0,0,0.4)",
      }
    : {
        bg: "#F8F7F4",
        cardBg: "#FFFFFF",
        cardBorder: "rgba(0,0,0,0.07)",
        border: "rgba(0,0,0,0.06)",
        borderSection: "rgba(156,138,85,0.3)",
        title: "#1A1A1A",
        body: "#444444",
        muted: "#999999",
        gold: "#9C8A55",
        goldFaint: "rgba(156,138,85,0.25)",
        hoverBg: "rgba(0,0,0,0.012)",
        footerDim: "#C0C0C0",
        logo: "/harven-finance-logo-dark.png",
        dateBadge: "rgba(156,138,85,0.07)",
        shadow: "rgba(0,0,0,0.08)",
      };
}
