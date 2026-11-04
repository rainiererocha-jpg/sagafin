import { Area, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FocusItem, SeriePonto } from "@/lib/tradingClient";

/** USD/BRL (12 meses) com as medianas do Boletim Focus para fim de 2026 e 2027 como linhas de referência. */
export function FxFocus({ series, focus }: { series: SeriePonto[]; focus: Record<string, FocusItem> }) {
  if (!series?.length) return null;
  const fmtD = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const refs = Object.entries(focus || {}).filter(([, f]) => f?.mediana != null);
  const vals = series.map((p) => p.v).concat(refs.map(([, f]) => f.mediana as number));
  const lo = Math.min(...vals) * 0.98, hi = Math.max(...vals) * 1.02;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42 85% 55%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(42 85% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" tickFormatter={fmtD} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis domain={[lo, hi]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => v.toFixed(2)} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(val: number) => [`R$ ${val.toFixed(3)}`, "USD/BRL"]}
          />
          {refs.map(([ano, f]) => (
            <ReferenceLine
              key={ano}
              y={f.mediana as number}
              stroke="rgba(255,255,255,0.45)"
              strokeDasharray="4 4"
              label={{ value: `Focus fim-${ano}: ${(f.mediana as number).toFixed(2)}`, fill: "rgba(255,255,255,0.7)", fontSize: 10, position: "insideTopRight" }}
            />
          ))}
          <Area type="monotone" dataKey="v" stroke="hsl(42 85% 60%)" strokeWidth={1.8} fill="url(#fxFill)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
