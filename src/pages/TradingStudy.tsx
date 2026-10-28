import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, ShieldAlert, Scale, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmailGate } from "@/components/trading/EmailGate";
import { PayoffChart } from "@/components/trading/PayoffChart";
import {
  getStudy, getSubscriberEmail, type StudyDetail, HORIZON_LABEL, STRATEGY_LABEL, DIRECTION_LABEL, ASSET_LABEL, fmtNum, fmtPct, fmtUSD,
} from "@/lib/tradingClient";

const DirIcon = { bullish: TrendingUp, bearish: TrendingDown, neutral: Minus } as const;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{label}</div>
      <div className="text-lg font-semibold text-foreground tabular-nums mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
}

function Bloco({ titulo, icon: Icon, children }: { titulo: string; icon: typeof Scale; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-3"><Icon className="w-3.5 h-3.5" /> {titulo}</div>
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </div>
  );
}

export default function TradingStudy() {
  const { slug } = useParams<{ slug: string }>();
  const [study, setStudy] = useState<StudyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState<string | null>(() => getSubscriberEmail());

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getStudy(slug, email)
      .then((s) => { if (!s) setNotFound(true); else setStudy(s); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, email]);

  const m = (study?.metrics ?? {}) as StudyDetail["metrics"];
  const r = study?.risk;
  const Icon = study ? DirIcon[study.direction] ?? Minus : Minus;
  const isShares = study?.strategy_type.startsWith("shares");

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50"><div className="h-[42px]" /></div>
      <div className="pt-[42px]"><Header /></div>

      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/trading" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-8"><ArrowLeft className="w-4 h-4" /> Todos os destaques</Link>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
          ) : notFound || !study ? (
            <div className="text-center py-24 text-muted-foreground">Estudo não encontrado.</div>
          ) : (
            <div className="grid gap-8">
              <header>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold bg-gold/10 px-2 py-1 rounded-full">Estudo</span>
                  <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{HORIZON_LABEL[study.horizon]}</span>
                  <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{ASSET_LABEL[study.asset_class]}</span>
                  <span className={`text-[10px] tracking-[0.18em] uppercase px-2 py-1 rounded-full ${study.status === "open" ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-white/5"}`}>
                    {study.status === "open" ? "Em acompanhamento" : study.status === "closed" ? "Encerrado" : "Invalidado"}
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-serif text-foreground">{study.symbol}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground"><Icon className="w-4 h-4" /> {DIRECTION_LABEL[study.direction]}</span>
                </div>
                <div className="text-gold mt-2">{STRATEGY_LABEL[study.strategy_type] ?? study.strategy_type}</div>
                <h1 className="text-2xl md:text-3xl font-serif text-foreground mt-4">{study.title}</h1>
                <p className="text-muted-foreground mt-3 leading-relaxed">{study.thesis_public}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-3">
                  Publicado em {new Date(study.published_at).toLocaleString("pt-BR")} · preço de referência {fmtNum(m.ref_price ?? null)}{m.ref_time ? ` (${new Date(m.ref_time as string).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})` : ""} · confiança {study.confidence ?? "—"}
                </p>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="IV rank" value={m.iv_rank != null ? fmtNum(m.iv_rank as number, 0) : "—"} hint="0 = mínima do ano, 100 = máxima" />
                <Stat label="IVx" value={m.ivx != null ? `${fmtNum(m.ivx as number, 0)}%` : "—"} hint="vol implícita 30 dias" />
                <Stat label="Mov. esperado" value={m.expected_move_pct != null ? `±${fmtNum(m.expected_move_pct as number, 1)}%` : "—"} hint={m.expected_move != null ? `±${fmtNum(m.expected_move as number)} até o vencimento` : undefined} />
                <Stat label="DTE" value={m.dte != null ? String(m.dte) : "—"} hint={m.expiration ? `vence ${m.expiration}` : undefined} />
                <Stat label="Risco máximo" value={study.unlocked ? (r?.max_loss != null ? fmtUSD(r.max_loss) : r?.undefined_risk ? "indefinido" : "—") : "🔒"} />
                <Stat label="Lucro máximo" value={study.unlocked ? (r?.max_profit != null ? fmtUSD(r.max_profit) : "—") : "🔒"} />
                <Stat label="POP teórica" value={study.unlocked ? (r?.pop_estimate != null ? `${fmtNum(r.pop_estimate, 0)}%` : "—") : "🔒"} hint="prob. de expirar fora do breakeven" />
                <Stat label={study.status === "open" ? "Expira em" : "Resultado"} value={study.status === "open" ? (study.expires_at ?? "—") : fmtPct(study.result_pct)} hint={study.status !== "open" ? study.close_reason ?? undefined : undefined} />
              </div>

              {!study.unlocked ? (
                <EmailGate onUnlocked={(e) => setEmail(e)} />
              ) : (
                <>
                  {study.legs && study.legs.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card/40 p-6">
                      <div className="text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-4">Estrutura</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                            <tr><th className="text-left py-2">Lado</th><th className="text-left py-2">Tipo</th><th className="text-right py-2">Strike</th><th className="text-right py-2">Vencimento</th><th className="text-right py-2">Delta</th><th className="text-right py-2">Mid na ref.</th></tr>
                          </thead>
                          <tbody>
                            {study.legs.map((l, i) => (
                              <tr key={i} className="border-t border-white/[0.05] tabular-nums">
                                <td className={`py-2 ${l.side === "sell" ? "text-red-300" : "text-emerald-300"}`}>{l.side === "sell" ? "Venda" : "Compra"}</td>
                                <td className="py-2">{l.right === "shares" ? `${l.qty ?? 100} ações` : l.right.toUpperCase()}</td>
                                <td className="py-2 text-right">{l.strike != null ? fmtNum(l.strike) : "—"}</td>
                                <td className="py-2 text-right">{l.expiration ?? "—"}</td>
                                <td className="py-2 text-right">{l.delta != null ? fmtNum(l.delta) : "—"}</td>
                                <td className="py-2 text-right">{l.mid != null ? fmtNum(l.mid) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground mt-4">
                        <span>{r?.credit_or_debit}</span>
                        {r?.breakevens?.length ? <span>Breakeven: {r.breakevens.map((b) => fmtNum(b)).join(" / ")}</span> : null}
                        {r?.bp_effect != null && <span>Buying power ≈ {fmtUSD(r.bp_effect)}</span>}
                        {r?.theta_day != null && !isShares && <span>Theta/dia ≈ US$ {fmtNum(r.theta_day)}</span>}
                      </div>
                      {!isShares && <div className="mt-6"><PayoffChart legs={study.legs} refPrice={m.ref_price ?? null} breakevens={r?.breakevens ?? []} /></div>}
                    </div>
                  )}

                  <Bloco titulo="Tese completa" icon={BookOpen}>
                    {(study.thesis_full ?? "").split(/\n+/).map((p, i) => <p key={i} className="mb-3 last:mb-0">{p}</p>)}
                  </Bloco>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Bloco titulo="Cenário altista" icon={TrendingUp}>{study.scenario_bull}</Bloco>
                    <Bloco titulo="Cenário base" icon={Minus}>{study.scenario_base}</Bloco>
                    <Bloco titulo="Cenário baixista" icon={TrendingDown}>{study.scenario_bear}</Bloco>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Bloco titulo="O que invalida" icon={ShieldAlert}>
                      {study.invalidation}
                      {r?.invalidation && (r.invalidation.below != null || r.invalidation.above != null) && (
                        <div className="text-xs text-muted-foreground mt-2">Nível mecânico: {r.invalidation.below != null ? `abaixo de ${fmtNum(r.invalidation.below)}` : ""}{r.invalidation.below != null && r.invalidation.above != null ? " ou " : ""}{r.invalidation.above != null ? `acima de ${fmtNum(r.invalidation.above)}` : ""}</div>
                      )}
                    </Bloco>
                    <Bloco titulo="Gestão" icon={Scale}>{study.management}</Bloco>
                  </div>

                  {study.marks && study.marks.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card/40 p-6">
                      <div className="text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-3">Acompanhamento (hipotético)</div>
                      <div className="flex flex-wrap gap-2">
                        {study.marks.slice(-24).map((mk, i) => (
                          <span key={i} className={`text-[11px] px-2 py-1 rounded-full bg-white/5 tabular-nums ${(mk.pnl_pct ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {new Date(mk.marked_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {fmtPct(mk.pnl_pct)}
                          </span>
                        ))}
                      </div>
                      {study.result_note && <p className="text-xs text-muted-foreground mt-3">{study.result_note}</p>}
                    </div>
                  )}
                  {study.chart_url && <img src={study.chart_url} alt={`Gráfico ${study.symbol}`} className="rounded-2xl border border-border w-full" loading="lazy" />}
                </>
              )}

              <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                Conteúdo educacional elaborado com apoio de inteligência artificial a partir de dados da tastytrade e fontes públicas. Não constitui recomendação de investimento, relatório de análise (Resolução CVM 20) nem consultoria de valores mobiliários. Resultados hipotéticos, sem custos. Operações com opções podem gerar perdas superiores ao capital investido.
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
