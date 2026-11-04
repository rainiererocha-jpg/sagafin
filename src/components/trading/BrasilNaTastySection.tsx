import { type Contexto, fmtNum, fmtPct } from "@/lib/tradingClient";
import { BRASIL_INTRO } from "@/data/trading-metodologia";

const NOMES: Record<string, string> = {
  EWZ: "iShares MSCI Brazil", PBR: "Petrobras ON", "PBR.A": "Petrobras PN", VALE: "Vale", ITUB: "Itaú", BBD: "Bradesco", ABEV: "Ambev",
  ERJ: "Embraer", GGB: "Gerdau", SBS: "Sabesp", CIG: "Cemig", BSBR: "Santander BR", NU: "Nubank", MELI: "Mercado Livre", XP: "XP Inc.", STNE: "Stone", PAGS: "PagSeguro",
};

export function BrasilNaTastySection({ ctx }: { ctx: Contexto | null }) {
  const linhas = Object.entries(ctx?.brasil ?? {}).sort((a, b) => (b[1].liquidity ?? 0) - (a[1].liquidity ?? 0) || a[0].localeCompare(b[0]));
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{BRASIL_INTRO}</p>
      {linhas.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Ativo</th>
                <th className="text-right px-4 py-3">IV rank</th>
                <th className="text-right px-4 py-3">IVx</th>
                <th className="text-right px-4 py-3">Liquidez</th>
                <th className="text-right px-4 py-3">Prêmio/desc. vs B3</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(([sym, v]) => (
                <tr key={sym} className="border-t border-white/[0.05] tabular-nums">
                  <td className="px-4 py-3"><span className="text-foreground font-semibold">{sym}</span> <span className="text-muted-foreground text-xs ml-2">{NOMES[sym] ?? ""}</span></td>
                  <td className="px-4 py-3 text-right">{v.iv_rank != null ? fmtNum(v.iv_rank, 0) : "—"}</td>
                  <td className="px-4 py-3 text-right">{v.ivx != null ? `${fmtNum(v.ivx * 100, 0)}%` : "—"}</td>
                  <td className="px-4 py-3 text-right">{v.liquidity != null ? "★".repeat(v.liquidity) : "—"}</td>
                  <td className={`px-4 py-3 text-right ${v.premio_pct == null ? "" : v.premio_pct > 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(v.premio_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">A tabela é preenchida pelo agente a partir do primeiro snapshot do dia.</p>
      )}
      {ctx?.captured_at && (
        <p className="text-[11px] text-muted-foreground/70">Dados derivados do snapshot de {new Date(ctx.captured_at).toLocaleString("pt-BR")} (tastytrade, B3 via Yahoo, câmbio BCB). Sem cotação em tempo real.</p>
      )}
    </div>
  );
}
