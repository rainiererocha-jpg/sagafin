import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MessageCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ManualGate } from "@/components/trading/ManualGate";
import { FunilAssessoria, BarraMobileAssessoria } from "@/components/trading/FunilAssessoria";
import { BrasilNaTastySection } from "@/components/trading/BrasilNaTastySection";
import { getContexto, getSubscriberEmail, type Contexto, fmtNum } from "@/lib/tradingClient";
import { MANUAL_TITULO, MANUAL_CAPITULOS, MANUAL_PROXIMO_PASSO, type CapituloManual } from "@/data/manual-tastytrade";
import { TASTY_REFERRAL_URL, TASTY_REFERRAL_DISCLOSURE, WA_ASSESSORIA_URL } from "@/data/tastytrade-referral";
import { AVISO_CURTO } from "@/data/trading-metodologia";

function MacroAoVivo({ ctx }: { ctx: Contexto | null }) {
  const m = (ctx?.macro ?? {}) as Record<string, { value?: number; iv_rank?: number | null } | null>;
  const items: [string, string][] = [
    ["S&P 500", m.spx?.value != null ? fmtNum(m.spx.value, 0) : "—"],
    ["VIX", m.vix?.value != null ? fmtNum(m.vix.value, 1) : "—"],
    ["USD/BRL", m.usdbrl?.value != null ? fmtNum(m.usdbrl.value, 2) : "—"],
    ["EWZ IV rank", m.ewz?.iv_rank != null ? fmtNum(m.ewz.iv_rank, 0) : "—"],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {items.map(([l, v]) => (
        <div key={l} className="rounded-xl border border-border bg-card/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{l}</div>
          <div className="text-xl font-semibold tabular-nums text-foreground">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Capitulo({ c }: { c: CapituloManual }) {
  return (
    <section id={c.id} className="scroll-mt-32 py-10 border-t border-white/[0.06]">
      <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-2">{c.titulo}</h2>
      <p className="text-sm text-gold/80 mb-6">{c.resumo}</p>
      <div className="space-y-4 max-w-3xl">
        {c.paragrafos.map((p, i) => <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">{p}</p>)}
        {c.id === "abertura" && (
          <a
            href={TASTY_REFERRAL_URL} target="_blank" rel="noopener sponsored"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-gold text-accent-foreground font-bold text-sm hover:shadow-lg"
          >
            Abrir conta na tastytrade pelo link de indicação <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {c.passos && (
          <ol className={`space-y-2 ${c.id === "glossario" ? "list-none" : "list-decimal pl-5"}`}>
            {c.passos.map((s, i) => <li key={i} className="text-[15px] leading-relaxed text-foreground/90">{s}</li>)}
          </ol>
        )}
        {c.links && (
          <div className="flex flex-wrap gap-3 pt-2">
            {c.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                {l.rotulo} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}
        {c.avisos?.map((a, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{a}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ManualTastytrade() {
  const [email, setEmail] = useState<string | null>(() => getSubscriberEmail());
  const [ctx, setCtx] = useState<Contexto | null>(null);

  useEffect(() => {
    document.title = "Manual: investir em dólar pela tastytrade | Sagafin";
    getContexto().then(setCtx).catch(() => setCtx(null));
    return () => { document.title = "Sagafin"; };
  }, []);

  const liberado = !!email;
  const sumario = [...MANUAL_CAPITULOS.map((c) => ({ id: c.id, t: c.titulo })), { id: "ao-vivo", t: "Exemplo ao vivo: Brasil na tastytrade" }, { id: "proximo-passo", t: MANUAL_PROXIMO_PASSO.titulo }];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="fixed top-0 left-0 right-0 z-50"><div className="h-[42px]" /></div>
      <div className="pt-[42px]"><Header /></div>

      <section className="pt-28 pb-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/trading" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Destaques de Trading
          </Link>
          <span className="block text-gold font-semibold text-sm tracking-widest uppercase mb-4">Guia educacional · gratuito com cadastro</span>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-5 max-w-4xl">
            {MANUAL_TITULO.replace(" pela tastytrade", "")} <span className="text-gradient-gold">pela tastytrade</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Onze capítulos, do cadastro ao imposto de renda, escritos para quem nunca investiu fora do Brasil. Com exemplo ao vivo lido do snapshot da tastytrade e as mesmas regras que o agente da Sagafin usa nos estudos.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {liberado ? (
            <div className="rounded-2xl border border-border bg-card/40 p-6">
              <span className="text-label">Sumário</span>
              <ol className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
                {sumario.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="text-sm text-muted-foreground hover:text-gold">{s.t}</a></li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card/40 p-6 mb-8">
                <span className="text-label">O que você vai encontrar</span>
                <ol className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
                  {sumario.map((s) => <li key={s.id} className="text-sm text-muted-foreground">{s.t}</li>)}
                </ol>
              </div>
              <ManualGate onUnlocked={(e) => setEmail(e)} />
            </>
          )}
        </div>
      </section>

      {liberado && (
        <>
          <section className="pb-6">
            <div className="container mx-auto px-4 max-w-5xl">
              {MANUAL_CAPITULOS.map((c) => <Capitulo key={c.id} c={c} />)}

              <section id="ao-vivo" className="scroll-mt-32 py-10 border-t border-white/[0.06]">
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-2">Exemplo ao vivo: o Brasil na tastytrade agora</h2>
                <p className="text-sm text-gold/80 mb-6">
                  {ctx?.captured_at
                    ? `Snapshot do agente em ${new Date(ctx.captured_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}.`
                    : "Aguardando o primeiro snapshot do agente."}
                </p>
                <MacroAoVivo ctx={ctx} />
                <p className="text-[15px] leading-relaxed text-muted-foreground max-w-3xl mb-6">
                  Como ler a tabela: IV rank acima de 30 e liquidez de 3 ou 4 estrelas são as condições do capítulo 7 para estudar venda de prêmio. Prêmio ou desconto frente à B3 mostra se o ADR está mais caro ou mais barato que a ação no Brasil, convertida pelo câmbio do dia.
                </p>
                <BrasilNaTastySection ctx={ctx} />
              </section>

              <section id="proximo-passo" className="scroll-mt-32 py-10 border-t border-white/[0.06]">
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">{MANUAL_PROXIMO_PASSO.titulo}</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground max-w-3xl mb-8">{MANUAL_PROXIMO_PASSO.texto}</p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <a href={WA_ASSESSORIA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-gold text-accent-foreground font-bold text-sm hover:shadow-lg">
                    <MessageCircle className="w-4 h-4" /> Falar com Rainiere no WhatsApp
                  </a>
                  <a href={TASTY_REFERRAL_URL} target="_blank" rel="noopener sponsored" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg border border-gold/50 text-gold font-semibold text-sm hover:bg-gold/10">
                    Abrir conta na tastytrade <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <FunilAssessoria compacto />
              </section>
            </div>
          </section>
        </>
      )}

      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-[11px] leading-relaxed text-muted-foreground/60">{AVISO_CURTO}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground/60 mt-3">{TASTY_REFERRAL_DISCLOSURE}</p>
        </div>
      </section>

      <BarraMobileAssessoria />
      <Footer />
    </div>
  );
}
