import { ArrowRight, Globe2, Info, MessageCircle, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MarketDigestModal } from "@/components/MarketDigestModal";
import { PriceCone } from "@/components/trading/charts/PriceCone";
import { FxFocus } from "@/components/trading/charts/FxFocus";
import { Base100 } from "@/components/trading/charts/Base100";
import { type Panel, type Contexto, type StudyPublic, type SerieStats, fmtNum, fmtPct, STRATEGY_LABEL, HORIZON_LABEL } from "@/lib/tradingClient";

const WA_EXTERIOR =
  "https://wa.me/5562994160930?text=" +
  encodeURIComponent("Olá Rainiere, vi o painel de EWZ e dólar no sagafin.com.br/trading e quero entender como investir no exterior pela XP.");

function Chip({ label, v }: { label: string; v: number | null | undefined }) {
  const cls = v == null ? "text-muted-foreground" : v >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <span className="inline-flex items-baseline gap-1 text-xs">
      <span className="text-muted-foreground/70">{label}</span>
      <span className={`font-semibold tabular-nums ${cls}`}>{fmtPct(v)}</span>
    </span>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{label}</div>
      <div className="text-sm font-semibold text-foreground tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground/60">{hint}</div>}
    </div>
  );
}

function fmtData(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function CardAtivo({ titulo, subtitulo, stats, children, grid, rodape }: { titulo: string; subtitulo: string; stats: SerieStats | null; children: React.ReactNode; grid: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">{titulo}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitulo}</div>
        </div>
        {stats?.last != null && (
          <div className="text-right">
            <div className="text-3xl font-serif text-foreground tabular-nums leading-none">{fmtNum(stats.last, titulo.startsWith("EWZ") ? 2 : 3)}</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 mt-2">
              <Chip label="dia" v={stats.change_1d_pct} />
              <Chip label="1 m" v={stats.change_1m_pct} />
              <Chip label="12 m" v={stats.change_12m_pct} />
            </div>
          </div>
        )}
      </div>
      {stats ? children : <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Série indisponível no momento.</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{grid}</div>
      {rodape}
    </div>
  );
}

export function PanelExterior({ panel, ctx, studies }: { panel: Panel | null; ctx: Contexto | null; studies: StudyPublic[] }) {
  const ewz = panel?.ewz ?? null;
  const usd = panel?.usdbrl ?? null;
  const ewzCtx = ctx?.brasil?.EWZ;
  const iv = ewzCtx?.ivx ?? null;
  const fx = panel?.focus?.cambio ?? {};
  const selicF = panel?.focus?.selic ?? {};
  const ipcaF = panel?.focus?.ipca ?? {};
  const dataFocus = fx["2026"]?.data ?? fx["2027"]?.data ?? null;
  const brStudies = studies.filter((s) => s.status === "open" && (s.asset_class === "adr_br" || s.asset_class === "etf_br")).slice(0, 3);
  const c = panel?.correl;
  const h = panel?.hedge;
  const d12 = panel?.decomp12m;

  return (
    <div className="grid gap-8">
      {/* 1. Dois cards: EWZ | Dólar */}
      <div className="grid lg:grid-cols-2 gap-5">
        <CardAtivo
          titulo="EWZ · Brasil em dólar"
          subtitulo="iShares MSCI Brazil ETF (NYSE). Preço em US$, fechamento de referência."
          stats={ewz}
          grid={
            <>
              <Mini label="52 semanas" value={ewz ? `${fmtNum(ewz.low_52w)} – ${fmtNum(ewz.high_52w)}` : "—"} />
              <Mini label="Vol. 30 d" value={ewz?.vol30_pct != null ? `${fmtNum(ewz.vol30_pct, 0)}%` : "—"} hint="realizada, anualizada" />
              <Mini label="IV rank" value={ewzCtx?.iv_rank != null ? fmtNum(ewzCtx.iv_rank, 0) : "—"} hint={iv != null ? `IVx ${fmtNum(iv * 100, 0)}%` : "tastytrade"} />
              <Mini label="Em reais" value={ewz?.ewz_brl != null ? `R$ ${fmtNum(ewz.ewz_brl)}` : "—"} hint="preço × câmbio" />
            </>
          }
          rodape={
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Área dourada: faixa teórica de 30 dias implícita nas opções (1σ ≈ 68% e 2σ ≈ 95%). Não é projeção de preço. Índice MSCI Brazil 25/50, ~50 empresas, taxa 0,59% a.a.{ewz?.dist_mm200_pct != null ? ` · ${fmtPct(ewz.dist_mm200_pct)} vs MM200` : ""}
            </p>
          }
        >
          <PriceCone series={ewz?.series ?? []} mm200={ewz?.mm200 ?? null} iv={iv} />
        </CardAtivo>

        <CardAtivo
          titulo="Dólar · USD/BRL"
          subtitulo="Câmbio de referência (fechamento). Linhas tracejadas: mediana do Boletim Focus."
          stats={usd}
          grid={
            <>
              <Mini label="52 semanas" value={usd ? `${fmtNum(usd.low_52w, 2)} – ${fmtNum(usd.high_52w, 2)}` : "—"} />
              <Mini label="Vol. 30 d" value={usd?.vol30_pct != null ? `${fmtNum(usd.vol30_pct, 0)}%` : "—"} hint="realizada, anualizada" />
              <Mini label="Selic / CDI" value={panel?.juros?.selic != null ? `${fmtNum(panel.juros.selic, 2)}%` : "—"} hint={panel?.juros?.cdi != null ? `CDI ${fmtNum(panel.juros.cdi, 2)}%` : undefined} />
              <Mini label="Focus fim-2026" value={fx["2026"]?.mediana != null ? `R$ ${fmtNum(fx["2026"].mediana, 2)}` : "—"} hint={dataFocus ? `pesquisa de ${fmtData(dataFocus)}` : undefined} />
            </>
          }
          rodape={
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  <tr><th className="text-left py-1.5">Expectativa do mercado (Focus)</th><th className="text-right py-1.5">Atual</th><th className="text-right py-1.5">Fim 2026</th><th className="text-right py-1.5">Fim 2027</th></tr>
                </thead>
                <tbody className="tabular-nums">
                  <tr className="border-t border-white/[0.05]"><td className="py-1.5 text-foreground">Dólar (R$)</td><td className="py-1.5 text-right">{usd?.last != null ? fmtNum(usd.last, 2) : "—"}</td><td className="py-1.5 text-right">{fx["2026"]?.mediana != null ? fmtNum(fx["2026"].mediana, 2) : "—"}</td><td className="py-1.5 text-right">{fx["2027"]?.mediana != null ? fmtNum(fx["2027"].mediana, 2) : "—"}</td></tr>
                  <tr className="border-t border-white/[0.05]"><td className="py-1.5 text-foreground">Selic (% a.a.)</td><td className="py-1.5 text-right">{panel?.juros?.selic != null ? fmtNum(panel.juros.selic, 2) : "—"}</td><td className="py-1.5 text-right">{selicF["2026"]?.mediana != null ? fmtNum(selicF["2026"].mediana, 2) : "—"}</td><td className="py-1.5 text-right">{selicF["2027"]?.mediana != null ? fmtNum(selicF["2027"].mediana, 2) : "—"}</td></tr>
                  <tr className="border-t border-white/[0.05]"><td className="py-1.5 text-foreground">IPCA (% no ano)</td><td className="py-1.5 text-right">—</td><td className="py-1.5 text-right">{ipcaF["2026"]?.mediana != null ? fmtNum(ipcaF["2026"].mediana, 2) : "—"}</td><td className="py-1.5 text-right">{ipcaF["2027"]?.mediana != null ? fmtNum(ipcaF["2027"].mediana, 2) : "—"}</td></tr>
                </tbody>
              </table>
              <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
                Fonte: BCB – Expectativas de Mercado (Focus){dataFocus ? `, pesquisa de ${fmtData(dataFocus)}` : ""}{fx["2026"]?.n ? `, ${fx["2026"].n} instituições` : ""}. Mediana das projeções do mercado, não previsão deste site.
              </p>
            </div>
          }
        >
          <FxFocus series={usd?.series ?? []} focus={fx} />
        </CardAtivo>
      </div>

      {/* 2. Base 100 */}
      {panel?.base100?.length ? (
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">O mesmo ano, três moedas</div>
              <div className="text-xs text-muted-foreground mt-0.5">Base 100 há 12 meses. O S&P 500 convertido em reais mostra o que o investidor brasileiro teria visto na conta.</div>
            </div>
            {d12 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <Chip label="S&P em R$" v={panel.base100.length ? (panel.base100[panel.base100.length - 1].spx_brl - 100) : null} />
                <Chip label="Ibovespa" v={d12.ibov_brl_pct} />
                <Chip label="Dólar" v={d12.usdbrl_pct} />
                <Chip label="EWZ" v={d12.ewz_pct} />
              </div>
            )}
          </div>
          <Base100 data={panel.base100} />
          <p className="text-[11px] text-muted-foreground/70 mt-2">Leitura: EWZ em dólar ≈ Ibovespa em reais descontada a variação do câmbio (o índice do EWZ é o MSCI Brazil 25/50, parecido mas não igual ao Ibovespa).</p>
        </div>
      ) : null}

      {/* 3. Por que olhar para fora */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe2 className="w-4 h-4 text-gold" />
          <h3 className="text-xl font-serif text-foreground">Por que olhar para fora</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-3xl font-serif text-gradient-gold">0,25%</div>
            <div className="text-sm text-foreground font-semibold mt-1">é o peso do Brasil no mercado global de ações</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">MSCI ACWI IMI, junho de 2026. Uma carteira só em reais ignora 99,75% das empresas listadas no mundo.</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-3xl font-serif text-gradient-gold">{c?.usdbrl_ibov != null ? fmtNum(c.usdbrl_ibov, 2) : "—"}</div>
            <div className="text-sm text-foreground font-semibold mt-1">correlação entre dólar e Ibovespa nos últimos 12 meses</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Calculada em retornos diários. {h?.meses_ibov_queda ? `Em ${h.meses_dolar_subiu} dos ${h.meses_ibov_queda} meses em que o Ibovespa caiu, o dólar subiu.` : ""} A relação tende a ser negativa, mas não é garantida: já foi positiva em outros períodos.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-3xl font-serif text-gradient-gold">{c?.ewz_spx != null ? fmtNum(c.ewz_spx, 2) : "—"}</div>
            <div className="text-sm text-foreground font-semibold mt-1">correlação entre EWZ e S&P 500 nos últimos 12 meses</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Quanto menor, mais a diversificação geográfica reduz a oscilação da carteira. Diversificar não elimina risco: reduz a dependência de um único país.</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-3xl font-serif text-gradient-gold">16%</div>
            <div className="text-sm text-foreground font-semibold mt-1">piso de patrimônio no exterior estimado pela FGV</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Estudo FGVcef (set/2026) sobre proteção do consumo do brasileiro. Fundos locais com exposição externa somam ~15% do patrimônio (jul/2026). A proporção certa depende do seu perfil e objetivos.</p>
          </div>
        </div>
      </div>

      {/* 4. Ideias de estudo */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-gold" />
          <h3 className="text-xl font-serif text-foreground">Ideias de estudo com Brasil e dólar</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Dólar na carteira via ETF", d: "EWZ (Brasil em dólar) e SPY (S&P 500) são as duas pontas mais líquidas para estudar exposição cambial com opções. O estudo compara custo de carregar o ETF com vender puts cobertas abaixo do mercado." },
            { t: "Prêmio em EWZ quando o IV rank sobe", d: "Com IV rank acima de 30 e IV maior que a volatilidade realizada, o agente monta condors e put spreads de 45 dias em EWZ. O estudo mostra o que a estrutura ganha, perde e onde a hipótese morre." },
            { t: "ADR com desconto frente à B3", d: "Petrobras, Vale, Itaú e Bradesco negociam em Nova York e em São Paulo. A tabela abaixo mostra o prêmio ou desconto do ADR; diferenças acima de 1,5% viram tema de valor relativo." },
          ].map((i) => (
            <div key={i.t} className="rounded-xl border border-border bg-card/40 p-5">
              <div className="text-gold font-semibold text-sm mb-1">{i.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{i.d}</p>
            </div>
          ))}
        </div>
        {brStudies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {brStudies.map((s) => (
              <Link key={s.slug} to={`/trading/${s.slug}`} className="text-xs rounded-full border border-gold/30 bg-gold/10 text-gold px-3 py-1.5 hover:bg-gold/20">
                {s.symbol} · {STRATEGY_LABEL[s.strategy_type] ?? s.strategy_type} · {HORIZON_LABEL[s.horizon]} <ArrowRight className="inline w-3 h-3" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 5. CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-card/60 to-card/60 p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-2"><Shield className="w-3.5 h-3.5" /> Investir no exterior pela XP</div>
          <h3 className="text-2xl font-serif text-foreground">Quer entender como colocar parte do patrimônio em dólar?</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Conta internacional, ETFs, BDRs e fundos globais têm custos, impostos e riscos diferentes. Uma conversa de 20 minutos esclarece qual caminho combina com o seu perfil e objetivos.</p>
        </div>
        <div className="flex flex-col gap-3 min-w-[240px]">
          <a href={WA_EXTERIOR} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="lg" className="w-full"><MessageCircle className="w-4 h-4 mr-2" /> Falar com o assessor</Button>
          </a>
          <MarketDigestModal>
            <Button variant="goldOutline" size="lg" className="w-full">Receber os estudos por e-mail</Button>
          </MarketDigestModal>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed flex gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {panel?.fontes ?? "Yahoo Finance; BCB – Expectativas de Mercado (Focus); BCB SGS."} {panel?.updatedAt ? `Atualizado ${new Date(panel.updatedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}.` : ""} IV e liquidez de EWZ via tastytrade{ctx?.captured_at ? ` (snapshot ${new Date(ctx.captured_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })})` : ""}. Conteúdo educacional; não constitui recomendação. Rentabilidade passada não garante resultados futuros; diversificação não elimina risco. O assessor é remunerado pela distribuição de produtos (Res. CVM 179/23).
        </span>
      </p>
    </div>
  );
}
