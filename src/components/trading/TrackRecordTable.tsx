import { type TrackRecord, type StudyPublic, HORIZON_LABEL, HORIZON_ORDER, STRATEGY_LABEL, fmtPct, fmtNum } from "@/lib/tradingClient";
import { Link } from "react-router-dom";

export function TrackRecordTable({ tr, encerrados }: { tr: TrackRecord | null; encerrados: StudyPublic[] }) {
  const n = tr?.total?.n ?? 0;
  const winRate = n ? Math.round(((tr?.total?.wins ?? 0) / n) * 100) : null;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Estudos encerrados", String(n)],
          ["Taxa de acerto", winRate != null ? `${winRate}%` : "—"],
          ["Resultado médio", fmtPct(tr?.total?.media ?? null)],
          ["Mediana", fmtPct(tr?.total?.mediana ?? null)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card/40 p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{l}</div>
            <div className="text-2xl font-serif text-foreground mt-1 tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {n > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Horizonte</th>
                <th className="text-right px-4 py-3">N</th>
                <th className="text-right px-4 py-3">Acertos</th>
                <th className="text-right px-4 py-3">Média</th>
                <th className="text-right px-4 py-3">Mediana</th>
                <th className="text-right px-4 py-3">Melhor</th>
                <th className="text-right px-4 py-3">Pior</th>
              </tr>
            </thead>
            <tbody>
              {HORIZON_ORDER.filter((h) => tr?.por_horizonte?.[h]).map((h) => {
                const p = tr!.por_horizonte[h];
                return (
                  <tr key={h} className="border-t border-white/[0.05] tabular-nums">
                    <td className="px-4 py-3 text-foreground">{HORIZON_LABEL[h]}</td>
                    <td className="px-4 py-3 text-right">{p.n}</td>
                    <td className="px-4 py-3 text-right">{p.n ? `${Math.round((p.wins / p.n) * 100)}%` : "—"}</td>
                    <td className="px-4 py-3 text-right">{fmtPct(p.media)}</td>
                    <td className="px-4 py-3 text-right">{fmtPct(p.mediana)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{fmtPct(p.melhor)}</td>
                    <td className="px-4 py-3 text-right text-red-400">{fmtPct(p.pior)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {encerrados.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Estudo</th>
                <th className="text-left px-4 py-3">Horizonte</th>
                <th className="text-left px-4 py-3">Estrutura</th>
                <th className="text-left px-4 py-3">Encerrado</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="text-right px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {encerrados.slice(0, 40).map((s) => (
                <tr key={s.slug} className="border-t border-white/[0.05]">
                  <td className="px-4 py-3"><Link to={`/trading/${s.slug}`} className="text-foreground hover:text-gold">{s.symbol} · {s.title}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{HORIZON_LABEL[s.horizon]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{STRATEGY_LABEL[s.strategy_type] ?? s.strategy_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.closed_at ? new Date(s.closed_at).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.close_reason ?? "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${(s.result_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(s.result_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não há estudos encerrados. Os primeiros aparecem aqui quando atingirem o alvo, a invalidação ou o vencimento.</p>
      )}
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{tr?.metodo ?? "Resultados hipotéticos, sem custos."} Média aritmética simples; {fmtNum(tr?.abertos ?? 0, 0)} estudo(s) em acompanhamento não entram no cálculo.</p>
    </div>
  );
}
