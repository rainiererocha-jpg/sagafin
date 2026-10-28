import { useQuery } from "@tanstack/react-query";

export interface Candle { time: number; open: number; high: number; low: number; close: number }
export interface Quote { price: number; change: number; changePct: number; ts: number | null }
export interface UsdQuote extends Quote {
  source: string;
  var5m: number | null;
  var1h: number | null;
  varDia: number;
}
export interface Holding {
  ticker: string; name: string; sector: string; weight: number;
  price: number | null; changePct: number | null;
}
export interface LiveQuotes {
  now: number;
  ewz: Quote | null;
  usdbrl: UsdQuote | null;
  series: { ewz: Candle[]; usdbrl: Candle[] };
  holdings: Holding[];
  holdingsAsOf: string;
  holdingsSource: string;
}

async function fetchLive(): Promise<LiveQuotes> {
  const r = await fetch("/api/live-quotes");
  if (!r.ok) throw new Error(`live-quotes ${r.status}`);
  return r.json();
}

export function useLiveQuotes() {
  return useQuery({
    queryKey: ["live-quotes"],
    queryFn: fetchLive,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: 1,
  });
}
