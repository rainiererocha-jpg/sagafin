import { useMemo } from "react";
import type { LiveQuotes } from "@/hooks/useLiveQuotes";
import { fmtNum } from "@/lib/tradingClient";

const pct = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${fmtNum(v, 2)}%`;
const cor = (v: number | null | undefined) =>
  v == null ? "text-muted-foreground" : v >= 0 ? "text-emerald-400" : "text-red-400";

export function EwzComposition({ data }: { data: LiveQuotes | undefined }) {
  const holdings = data?.holdings ?? [];

  const { altas, setores, top10 } = useMemo(() => {
    const altas = holdings
      .filter((h) => h.changePct != null && h.changePct > 0)
      .sort((a, b) => (b.changePct as number) - (a.changePct as number))
      .slice(0, 5);
    const map = new Map<string, number>();
    for (const h of holdings) map.set(h.sector, (map.get(h.sector) ?? 0) + h.weight);
    const setores = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top10 = [...holdings].sort((a, b) => b.weight - a.weight).slice(0, 10).reduce((s, h) => s + h.weight, 0);
    return { altas, setores, top10 };
  }, [holdings]);

  if (!holdings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Composição do EWZ indisponível agora.
      </div>
    );
  }

  const maxW = Math.max(...holdings.map((h) => h.weight));

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Composição do EWZ</span>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">10 maiores ≈ {fmtNum(top10, 1)}%</span>
        </div>
        <ul className="space-y-2">
          {holdings.map((h) => (
            <li key={h.ticker} className="grid grid-cols-[4.5rem_1fr_3.5rem_4.5rem] items-center gap-3 text-sm">
              <span className="font-semibold text-foreground">{h.ticker}</span>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden" title={`${h.name} · ${h.sector}`}>
                <div className="h-full rounded-full bg-gold/80" style={{ width: `${(h.weight / maxW) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums text-muted-foreground">{fmtNum(h.weight, 1)}%</span>
              <span className={`text-right tabular-nums ${cor(h.changePct)}`}>{pct(h.changePct)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-muted-foreground/60">
          Pesos de {data?.holdingsAsOf ?? "—"}. Fonte: {data?.holdingsSource ?? "—"}. A variação é a do papel na B3 no dia.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Maiores altas do dia</span>
          {altas.length ? (
            <ul className="mt-3 space-y-2">
              {altas.map((h) => (
                <li key={h.ticker} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{h.ticker} <span className="text-muted-foreground/60 text-xs">{h.name}</span></span>
                  <span className={`tabular-nums ${cor(h.changePct)}`}>{pct(h.changePct)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {holdings.some((h) => h.changePct != null) ? "Nenhum papel em alta agora." : "Sem cotações dos papéis agora."}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Por setor</span>
          <ul className="mt-3 space-y-1.5">
            {setores.map(([s, w]) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s}</span>
                <span className="tabular-nums text-foreground">{fmtNum(w, 1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
