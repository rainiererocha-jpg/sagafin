import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Candle } from "@/hooks/useLiveQuotes";

const hhmm = (t: number) => new Date(t * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Pregão do dia em barras de 5 minutos (fechamento de cada barra), com a referência do fechamento anterior. */
export function Intraday({ series, prevClose, decimals = 2 }: { series: Candle[]; prevClose: number | null; decimals?: number }) {
  if (!series?.length) {
    return <div className="h-52 flex items-center justify-center text-sm text-muted-foreground text-center px-6">Sem negociação registrada hoje ainda. Fora do pregão, use a aba 12 meses.</div>;
  }
  const data = series.map((c) => ({ t: c.time, v: c.close }));
  const vals = data.map((d) => d.v).concat(prevClose != null ? [prevClose] : []);
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 || hi * 0.002;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="intraFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42 85% 55%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(42 85% 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={hhmm} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis domain={[lo - pad, hi + pad]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => v.toFixed(decimals)} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(l) => `${hhmm(Number(l))} (Brasília)`}
            formatter={(val: number) => [val.toFixed(decimals + 1), "preço"]}
          />
          {prevClose != null && <ReferenceLine y={prevClose} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 4" label={{ value: "fech. anterior", fill: "rgba(255,255,255,0.5)", fontSize: 10, position: "insideTopLeft" }} />}
          <Area type="monotone" dataKey="v" stroke="hsl(42 85% 60%)" strokeWidth={1.8} fill="url(#intraFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
