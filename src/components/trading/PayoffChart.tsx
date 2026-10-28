import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Leg } from "@/lib/tradingClient";

/** Payoff no vencimento (por contrato, multiplicador 100) a partir das pernas; ações usam 100 unidades. */
export function PayoffChart({ legs, refPrice, breakevens = [] }: { legs: Leg[]; refPrice: number | null; breakevens?: number[] }) {
  if (!legs?.length || !refPrice) return null;
  const strikes = legs.map((l) => l.strike).filter((s): s is number => s != null);
  const lo = Math.min(refPrice * 0.8, ...(strikes.length ? [Math.min(...strikes) * 0.95] : []));
  const hi = Math.max(refPrice * 1.2, ...(strikes.length ? [Math.max(...strikes) * 1.05] : []));
  const pts: { s: number; pnl: number }[] = [];
  const n = 80;
  for (let i = 0; i <= n; i++) {
    const s = lo + ((hi - lo) * i) / n;
    let pnl = 0;
    for (const l of legs) {
      const qty = l.qty ?? 1;
      const sign = l.side === "sell" ? -1 : 1;
      if (l.right === "shares") { pnl += (s - refPrice) * qty * sign; continue; }
      const intr = l.right === "call" ? Math.max(0, s - (l.strike ?? 0)) : Math.max(0, (l.strike ?? 0) - s);
      pnl += (intr - (l.mid ?? 0)) * 100 * qty * sign;
    }
    pts.push({ s: Math.round(s * 100) / 100, pnl: Math.round(pnl) });
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42 85% 55%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(42 85% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="s" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`US$ ${v}`, "P&L no vencimento"]} labelFormatter={(l) => `Preço ${l}`}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
          <ReferenceLine x={pts.reduce((b, p) => (Math.abs(p.s - refPrice) < Math.abs(b.s - refPrice) ? p : b), pts[0]).s} stroke="hsl(42 85% 55%)" strokeDasharray="4 4" label={{ value: "ref.", fill: "hsl(42 85% 55%)", fontSize: 10 }} />
          {breakevens.map((b) => (
            <ReferenceLine key={b} x={pts.reduce((bb, p) => (Math.abs(p.s - b) < Math.abs(bb.s - b) ? p : bb), pts[0]).s} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 4" />
          ))}
          <Area type="monotone" dataKey="pnl" stroke="hsl(42 85% 55%)" strokeWidth={2} fill="url(#pnlFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
