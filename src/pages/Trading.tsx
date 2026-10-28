import { useEffect, useMemo, useState } from "react";
import { Loader2, ArrowRight, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketDigestModal } from "@/components/MarketDigestModal";
import { TradeStudyCard } from "@/components/trading/TradeStudyCard";
import { TrackRecordTable } from "@/components/trading/TrackRecordTable";
import { MethodologySection } from "@/components/trading/MethodologySection";
import { BrasilNaTastySection } from "@/components/trading/BrasilNaTastySection";
import {
  listStudies, getTrackRecord, getContexto, type StudyPublic, type TrackRecord, type Contexto, type Horizon,
  HORIZON_LABEL, HORIZON_ORDER, fmtNum, fmtPct,
} from "@/lib/tradingClient";

const AVISO_CURTO =
  "Os Destaques de Trading Sagafin são estudos de caráter exclusivamente educacional, elaborados com apoio de inteligência artificial a partir de dados da tastytrade e fontes públicas. Não constituem recomendação de investimento, relatório de análise (Resolução CVM 20) nem consultoria de valores mobiliários. Resultados exibidos são hipotéticos, sem custos, e não representam operações reais. Operações com opções podem gerar perdas superiores ao capital investido. Rainiere Rocha é assessor de investimentos vinculado à InvestSmart (XP), registrado na CVM conforme a Resolução CVM 178/23, e não pode recomendar, administrar ou gerir investimentos.";

function ContextBar({ ctx }: { ctx: Contexto | null }) {
  const m = (ctx?.macro ?? {}) as Record<string, { value?: number; change?: number; iv_rank?: number | null } | null>;
  const items: [string, string][] = [
    ["S&P 500", m.spx?.value != null ? fmtNum(m.spx.value, 0) : "—"],
    ["VIX", m.vix?.value != null ? fmtNum(m.vix.value, 1) : "—"],
    ["EWZ IV rank", m.ewz?.iv_rank != null ? fmtNum(m.ewz.iv_rank, 0) : "—"],
    ["USD/BRL", m.usdbrl?.value != null ? fmtNum(m.usdbrl.value, 2) : "—"],
    ["Ibovespa", m.ibov?.value != null ? fmtNum(m.ibov.value, 0) : "—"],
    ["Selic", m.selic != null ? `${fmtNum(m.selic as unknown as number, 2)}%` : "—"],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
      {items.map(([l, v]) => (
        <div key={l} className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{l}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{v}</span>
        </div>
      ))}
      <span className="ml-auto text-[11px] text-muted-foreground/60">
        {ctx?.captured_at ? `Snapshot ${new Date(ctx.captured_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Aguardando o primeiro snapshot do agente"}
      </span>
    </div>
  );
}

export default function Trading() {
  const [studies, setStudies] = useState<StudyPublic[]>([]);
  const [tr, setTr] = useState<TrackRecord | null>(null);
  const [ctx, setCtx] = useState<Contexto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Horizon>("monthly");

  useEffect(() => {
    Promise.allSettled([listStudies(), getTrackRecord(), getContexto()]).then(([s, t, c]) => {
      if (s.status === "fulfilled") setStudies(s.value);
      if (t.status === "fulfilled") setTr(t.value);
      if (c.status === "fulfilled") setCtx(c.value);
      setLoading(false);
    });
  }, []);

  const abertos = useMemo(() => studies.filter((s) => s.status === "open"), [studies]);
  const encerrados = useMemo(() => studies.filter((s) => s.status !== "open"), [studies]);
  const porHorizonte = useMemo(() => {
    const m = {} as Record<Horizon, StudyPublic[]>;
    for (const h of HORIZON_ORDER) m[h] = abertos.filter((s) => s.horizon === h);
    return m;
  }, [abertos]);

  useEffect(() => {
    if (loading) return;
    if (porHorizonte[tab]?.length) return;
    const primeiro = HORIZON_ORDER.find((h) => porHorizonte[h]?.length);
    if (primeiro) setTab(primeiro);
  }, [loading, porHorizonte, tab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50"><div className="h-[42px]" /></div>
      <div className="pt-[42px]"><Header /></div>

      <section className="pt-32 pb-12 bg-background">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">Estudo educacional · não é recomendação</span>
          <h1 className="text-5xl md:text-6xl font-serif text-foreground mb-6">
            Destaques de Trading <span className="text-gradient-gold">Sagafin</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Quatro vezes por dia de pregão, um agente lê a tastytrade, aplica as regras das melhores referências de mercado e transforma o que encontra em estudos de opções e ações no exterior, por horizonte: diário, semanal, mensal, semestral e longo prazo. Com Brasil incluído, via ADRs e EWZ.
          </p>
        </div>
      </section>

      <section className="pb-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <ContextBar ctx={ctx} />
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {loading ? (
            <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as Horizon)}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-card/40 border border-border p-1 rounded-xl mb-8">
                {HORIZON_ORDER.map((h) => (
                  <TabsTrigger key={h} value={h} className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-gold data-[state=active]:text-accent-foreground">
                    {HORIZON_LABEL[h]} <span className="ml-2 text-[10px] opacity-70 tabular-nums">{porHorizonte[h].length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {HORIZON_ORDER.map((h) => (
                <TabsContent key={h} value={h}>
                  {porHorizonte[h].length ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {porHorizonte[h].map((s, i) => <TradeStudyCard key={s.slug} study={s} index={i} />)}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
                      <Info className="w-5 h-5 mx-auto mb-3 text-gold/70" />
                      Nenhum estudo {HORIZON_LABEL[h].toLowerCase()} em acompanhamento agora. O agente só publica quando as regras de volatilidade, liquidez e risco são atendidas.
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </section>

      <section id="brasil" className="py-20 border-t border-white/[0.06]">
        <div className="container mx-auto px-4 max-w-6xl">
          <span className="text-label">Brasil na tastytrade</span>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mt-3 mb-8">ADRs e EWZ: o Brasil com <em className="not-italic text-gradient-gold font-semibold">opções em dólar</em></h2>
          <BrasilNaTastySection ctx={ctx} />
        </div>
      </section>

      <section id="metodologia" className="py-20 border-t border-white/[0.06]">
        <div className="container mx-auto px-4 max-w-6xl">
          <span className="text-label">Metodologia</span>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mt-3 mb-8">Como as melhores referências fazem, <em className="not-italic text-gradient-gold font-semibold">e o que o agente copia delas</em></h2>
          <MethodologySection />
        </div>
      </section>

      <section id="encerrados" className="py-20 border-t border-white/[0.06]">
        <div className="container mx-auto px-4 max-w-6xl">
          <span className="text-label">Histórico</span>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mt-3 mb-8">Estudos encerrados e <em className="not-italic text-gradient-gold font-semibold">resultado hipotético</em></h2>
          <TrackRecordTable tr={tr} encerrados={encerrados} />
          {tr && tr.abertos > 0 && <p className="text-xs text-muted-foreground mt-4">{fmtNum(tr.abertos, 0)} em acompanhamento · média geral {fmtPct(tr.total.media)}</p>}
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center p-12 bg-card/50 rounded-2xl border border-border">
            <h3 className="text-2xl font-serif text-foreground mb-4">Quer o estudo completo de cada card <span className="text-gradient-gold">no seu e-mail</span>?</h3>
            <p className="text-muted-foreground mb-6">Assine o Diário Saga. O cadastro libera a tese completa, os strikes e a gestão de risco de todos os estudos.</p>
            <MarketDigestModal>
              <Button variant="gold" size="lg">Assinar e liberar os estudos <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </MarketDigestModal>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground/60 mt-10">{AVISO_CURTO}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
