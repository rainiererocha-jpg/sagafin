import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  value: string;
  change: number;
}

const META: { symbol: string; name: string }[] = [
  { symbol: "IBOV", name: "Ibovespa" },
  { symbol: "USD/BRL", name: "Dólar" },
  { symbol: "EUR/BRL", name: "Euro" },
  { symbol: "XAU", name: "Ouro (US$/oz)" },
  { symbol: "PETR4", name: "Petrobras" },
  { symbol: "VALE3", name: "Vale" },
  { symbol: "ITUB4", name: "Itaú" },
  { symbol: "BBDC4", name: "Bradesco" },
  { symbol: "SELIC", name: "Meta Selic" },
  { symbol: "CDI", name: "CDI Anual" },
];

const PERCENT = new Set(["SELIC", "CDI"]);
const REFRESH_MS = 5 * 60 * 1000;

interface Quote {
  value: number;
  change: number;
}

function format(symbol: string, value: number) {
  if (PERCENT.has(symbol)) return `${value.toFixed(2).replace(".", ",")}%`;
  const digits = symbol === "IBOV" ? 0 : 2;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Usado apenas se /api/quotes estiver indisponível.
const FALLBACK: Record<string, Quote> = {
  SELIC: { value: 13.75, change: 0 },
  CDI: { value: 13.65, change: 0 },
};

function useQuotes() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(FALLBACK);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/quotes");
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (alive && d?.quotes && Object.keys(d.quotes).length) {
          setQuotes(d.quotes);
          setUpdatedAt(new Date(d.updatedAt));
        }
      } catch {
        /* mantém o último valor conhecido */
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { quotes, updatedAt };
}

export function MarketTicker() {
  const { quotes, updatedAt } = useQuotes();
  const items: TickerItem[] = META.filter((m) => quotes[m.symbol]).map((m) => ({
    ...m,
    value: format(m.symbol, quotes[m.symbol].value),
    change: quotes[m.symbol].change,
  }));
  const doubled = [...items, ...items];
  const hora = updatedAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

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
      {hora && (
        <span className="sr-only" aria-live="off">
          Cotações atualizadas às {hora}
        </span>
      )}
    </div>
  );
}
