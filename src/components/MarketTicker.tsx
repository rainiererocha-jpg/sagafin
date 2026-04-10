import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  value: string;
  change: number;
}

const marketData: TickerItem[] = [
  { symbol: "IBOV", name: "Ibovespa", value: "127.450", change: 0.85 },
  { symbol: "USD/BRL", name: "Dólar", value: "5,08", change: -0.32 },
  { symbol: "EUR/BRL", name: "Euro", value: "5,52", change: -0.18 },
  { symbol: "XAU", name: "Ouro", value: "2.635,40", change: 1.24 },
  { symbol: "PETR4", name: "Petrobras", value: "38,45", change: 2.15 },
  { symbol: "VALE3", name: "Vale", value: "62,80", change: -0.95 },
  { symbol: "ITUB4", name: "Itaú", value: "34,22", change: 0.45 },
  { symbol: "BBDC4", name: "Bradesco", value: "14,85", change: -0.28 },
  { symbol: "SELIC", name: "Taxa Selic", value: "10,50%", change: 0 },
  { symbol: "CDI", name: "CDI Anual", value: "10,40%", change: 0 },
];

export function MarketTicker() {
  const doubled = [...marketData, ...marketData];

  return (
    <div className="w-full overflow-hidden bg-black/60 backdrop-blur-sm border-b border-white/[0.06] py-[9px]">
      <div className="ticker-animation flex items-center whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="flex items-center">
            <div className="flex items-center gap-2.5 px-5">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-gold/90">
                {item.symbol}
              </span>
              <span className="hidden md:inline text-[10px] text-white/25 tracking-wide">
                {item.name}
              </span>
              <span className="text-[11px] text-white/65 font-mono tabular-nums">
                {item.value}
              </span>
              {item.change !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-mono tabular-nums ${
                    item.change > 0 ? "text-emerald-400/70" : "text-red-400/70"
                  }`}
                >
                  {item.change > 0 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {item.change > 0 ? "+" : ""}
                  {item.change.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="h-3 w-px bg-white/[0.08]" />
          </div>
        ))}
      </div>
    </div>
  );
}
