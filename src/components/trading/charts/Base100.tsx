import { Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Panel } from "@/lib/tradingClient";

const SERIES: { key: keyof Panel["base100"][number]; label: string; color: string; width: number }[] = [
  { key: "spx_brl", label: "S&P 500 em R$", color: "hsl(42 85% 60%)", width: 2 },
  { key: "ewz", label: "EWZ (US$)", color: "hsl(160 60% 55%)", width: 1.6 },
  { key: "ibov", label: "Ibovespa (R$)", color: "hsl(200 70% 65%)", width: 1.6 },
  { key: "usdbrl", label: "Dólar", color: "rgba(255,255,255,0.55)", width: 1.2 },
];

/** Quatro séries com base 100 no início do período: o mesmo ano visto em três moedas. */
export function Base100({ data }: { data: Panel["base100"] }) {
  if (!data?.length) return null;
  const fmtD = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="d" tickFormatter={fmtD} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            formatter={(val: number, name: string) => [val.toFixed(1), SERIES.find((s) => s.key === name)?.label ?? name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} formatter={(v) => SERIES.find((s) => s.key === v)?.label ?? v} />
          <ReferenceLine y={100} stroke="rgba(255,255,255,0.2)" />
          {SERIES.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={s.width} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
