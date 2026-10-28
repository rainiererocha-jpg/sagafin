import { useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { Candle, LiveQuotes } from "@/hooks/useLiveQuotes";

type Ativo = "ewz" | "usdbrl";

const ATIVOS: { id: Ativo; label: string; dec: number }[] = [
  { id: "ewz", label: "EWZ", dec: 2 },
  { id: "usdbrl", label: "USD/BRL", dec: 4 },
];

const toData = (c: Candle) => ({ ...c, time: c.time as UTCTimestamp });

export function LiveChart({ data }: { data: LiveQuotes | undefined }) {
  const [ativo, setAtivo] = useState<Ativo>("ewz");
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastTime = useRef<number | null>(null);

  const candles = data?.series?.[ativo] ?? [];
  const dec = ATIVOS.find((a) => a.id === ativo)!.dec;

  useEffect(() => {
    if (!boxRef.current) return;
    const chart = createChart(boxRef.current, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: "#9ca3af", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#d4af37", labelBackgroundColor: "#d4af37" }, horzLine: { color: "#d4af37", labelBackgroundColor: "#d4af37" } },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lastTime.current = null;
    };
  }, []);

  // troca de ativo: recarrega a série inteira
  useEffect(() => {
    const s = seriesRef.current;
    if (!s) return;
    s.applyOptions({ priceFormat: { type: "price", precision: dec, minMove: 1 / 10 ** dec } });
    s.setData([]);
    lastTime.current = null;
    chartRef.current?.timeScale().fitContent();
  }, [ativo, dec]);

  // cada poll: setData na primeira carga, update do último candle depois
  useEffect(() => {
    const s = seriesRef.current;
    if (!s || !candles.length) return;
    if (lastTime.current == null) {
      s.setData(candles.map(toData));
      chartRef.current?.timeScale().fitContent();
    } else {
      for (const c of candles.filter((x) => x.time >= lastTime.current!)) s.update(toData(c));
    }
    lastTime.current = candles[candles.length - 1].time;
  }, [candles, ativo]);

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Gráfico · velas de 5 min</span>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {ATIVOS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAtivo(a.id)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${ativo === a.id ? "bg-gold text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[320px] w-full">
        <div ref={boxRef} className="absolute inset-0" />
        {!candles.length && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {data ? "Série intradiária indisponível agora. Tentando de novo em instantes." : "Carregando o gráfico..."}
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground/60">
        Gráfico por{" "}
        <a href="https://github.com/tradingview/lightweight-charts" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">
          TradingView Lightweight Charts
        </a>
        . Dados com atraso de até 15 min.
      </p>
    </div>
  );
}
