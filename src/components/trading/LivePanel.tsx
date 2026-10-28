import { ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";
import type { Quote, UsdQuote, LiveQuotes } from "@/hooks/useLiveQuotes";
import { fmtNum } from "@/lib/tradingClient";
import { DollarCta } from "@/components/trading/DollarCta";
import { AdvisorCta } from "@/components/trading/AdvisorCta";

function hora(ts: number | null | undefined) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Pct({ v, label }: { v: number | null | undefined; label?: string }) {
  if (v == null) return <span className="text-muted-foreground/60">—</span>;
  const up = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {up ? "+" : ""}{fmtNum(v, 2)}%{label ? <span className="text-muted-foreground/60 ml-1">{label}</span> : null}
    </span>
  );
}

function QuoteCard({ title, subtitle, q, prefix, extra }: {
  title: string; subtitle: string; q: Quote | UsdQuote | null; prefix: string; extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[11px] text-muted-foreground/60">{subtitle}</span>
      </div>
      {q ? (
        <>
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums text-foreground">{prefix} {fmtNum(q.price, 2)}</span>
            <Pct v={q.changePct} label="no dia" />
          </div>
          {extra}
          <p className="mt-3 text-[11px] text-muted-foreground/60">Dado das {hora(q.ts)} · atraso de até 15 min</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Cotação indisponível no momento.</p>
      )}
    </div>
  );
}

export function LivePanel({ data, loading, error }: { data?: LiveQuotes; loading: boolean; error: boolean }) {
  const usd = data?.usdbrl ?? null;
  const msgUsd = usd
    ? `Olá Rainiere, quero comprar dólar. [Origem: site /trading · USD/BRL ${fmtNum(usd.price, 2)} às ${hora(usd.ts)}]\nValor aproximado: \nFinalidade (viagem, investimento, proteção): \nPrazo: `
    : "Olá Rainiere, quero comprar dólar. [Origem: site /trading]\nValor aproximado: \nFinalidade (viagem, investimento, proteção): \nPrazo: ";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-gold" />
        <h2 className="text-lg font-semibold text-foreground">Cotações ao vivo</h2>
        <span className="text-[11px] text-muted-foreground/60">atualiza a cada 15 s</span>
      </div>
      {error && !data ? (
        <p className="text-sm text-muted-foreground rounded-2xl border border-border bg-card/40 p-5">
          Não foi possível carregar as cotações agora. Tentaremos novamente em instantes.
        </p>
      ) : (
        <div className={`grid gap-4 md:grid-cols-2 ${loading && !data ? "opacity-60" : ""}`}>
          <QuoteCard title="EWZ" subtitle="iShares MSCI Brazil · US$" q={data?.ewz ?? null} prefix="US$" />
          <QuoteCard
            title="Dólar comercial" subtitle={`USD/BRL · ${usd?.source ?? "—"}`} q={usd} prefix="R$"
            extra={usd ? (
              <div className="mt-2 flex gap-4 text-xs">
                <Pct v={usd.var5m} label="5 min" />
                <Pct v={usd.var1h} label="1 h" />
              </div>
            ) : null}
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <DollarCta message={msgUsd} />
        <AdvisorCta />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/60">
        Cotações de referência, com atraso de até 15 minutos. O preço final do câmbio é definido na execução; não há promessa de taxa.
      </p>
    </div>
  );
}
