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
];

export function MarketTicker() {
  const duplicatedData = [...marketData, ...marketData];

  return (
    <div className="w-full bg-navy-deep overflow-hidden py-2.5 border-b border-navy-medium/50">
      <div className="ticker-animation flex items-center gap-8 whitespace-nowrap">
        {duplicatedData.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-gold font-semibold">{item.symbol}</span>
            <span className="text-primary-foreground/80">{item.name}</span>
            <span className="text-primary-foreground font-medium">
              {item.value}
            </span>
            <span
              className={`flex items-center gap-0.5 ${
                item.change >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {item.change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
