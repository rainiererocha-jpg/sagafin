import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriePonto } from "@/lib/tradingClient";

/**
 * Série de preço (12 meses) + MM200 + cone teórico de 30 dias derivado da IV (1σ e 2σ).
 * O cone é a faixa implícita nas opções, não projeção de preço.
 */
export function PriceCone({ series, mm200, iv, dias = 30 }: { series: SeriePonto[]; mm200: number | null; iv: number | null; dias?: number }) {
  if (!series?.length) return null;
  const last = series[series.length - 1];
  const data: { d: string; v?: number; c1?: [number, number]; c2?: [number, number] }[] = series.map((p) => ({ d: p.d, v: p.v }));
  if (iv && iv > 0) {
    const base = new Date(`${last.d}T12:00:00Z`);
    for (let i = 1; i <= dias; i++) {
      const dt = new Date(base); dt.setUTCDate(dt.getUTCDate() + i);
      const s = iv * Math.sqrt(i / 365);
      data.push({ d: dt.toISOString().slice(0, 10), c1: [last.v * (1 - s), last.v * (1 + s)], c2: [last.v * (1 - 2 * s), last.v * (1 + 2 * s)] });
    }
    data[series.length - 1] = { ...data[series.length - 1], c1: [last.v, last.v], c2: [last.v, last.v] };
  }
  const fmtD = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="coneFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42 85% 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(42 85% 55%)" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" tickFormatter={fmtD} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(l) => String(l)}
            formatter={(val: number | [number, number], name: string) => {
              if (Array.isArray(val)) return [`${val[0].toFixed(2)} – ${val[1].toFixed(2)}`, name === "c1" ? "faixa 1σ (≈68%)" : "faixa 2σ (≈95%)"];
              return [val.toFixed(2), "fechamento"];
            }}
          />
          {mm200 != null && <ReferenceLine y={mm200} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 4" label={{ value: "MM200", fill: "rgba(255,255,255,0.5)", fontSize: 10, position: "insideTopLeft" }} />}
          <Area type="monotone" dataKey="c2" stroke="none" fill="url(#coneFill)" isAnimationActive={false} connectNulls={false} />
          <Area type="monotone" dataKey="c1" stroke="hsl(42 85% 55%)" strokeOpacity={0.5} strokeWidth={1} fill="hsl(42 85% 55%)" fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
          <Line type="monotone" dataKey="v" stroke="hsl(42 85% 60%)" strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
