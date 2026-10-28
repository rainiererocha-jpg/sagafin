// Painel ao vivo da página /trading: EWZ, USD/BRL, séries intradiárias e maiores pesos do EWZ.
// Fontes: Yahoo Finance (EWZ, B3, fallback do dólar) e AwesomeAPI (USD/BRL).
// Yahoo tem atraso de até ~15 min; o front exibe o horário do dado. Cada fonte falha de forma isolada.

import { EWZ_HOLDINGS, EWZ_AS_OF, EWZ_SOURCE } from "../config/ewz-holdings.js";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SagaFin/1.0)" };

async function getJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const settled = (name, p) =>
  p.then(
    (v) => v,
    (e) => {
      console.error(`live-quotes: fonte ${name} falhou: ${e?.message ?? e}`);
      return null;
    }
  );

// Série de 5 min do pregão atual + preço e variação contra o fechamento anterior.
async function yahooIntraday(symbol) {
  const d = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`
  );
  const r0 = d.chart.result[0];
  const m = r0.meta;
  const ts = r0.timestamp ?? [];
  const q = r0.indicators?.quote?.[0] ?? {};
  const series = [];
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i];
    if (!Number.isFinite(c)) continue;
    series.push({
      time: ts[i],
      open: q.open?.[i] ?? c,
      high: q.high?.[i] ?? c,
      low: q.low?.[i] ?? c,
      close: c,
    });
  }
  const price = m.regularMarketPrice ?? series[series.length - 1]?.close;
  const prev = m.chartPreviousClose ?? m.previousClose ?? null;
  const change = prev ? price - prev : 0;
  return {
    price,
    change,
    changePct: prev ? (change / prev) * 100 : 0,
    ts: m.regularMarketTime ?? series[series.length - 1]?.time ?? null,
    series,
  };
}

async function awesomeUsd() {
  const d = await getJson("https://economia.awesomeapi.com.br/json/last/USD-BRL");
  const u = d.USDBRL;
  return {
    price: parseFloat(u.bid),
    change: parseFloat(u.varBid),
    changePct: parseFloat(u.pctChange),
    ts: parseInt(u.timestamp, 10),
  };
}

// Variação em janela curta a partir da série de 5 min (null se a série não alcança).
function varJanela(series, minutos) {
  if (!series?.length) return null;
  const last = series[series.length - 1];
  const alvo = last.time - minutos * 60;
  let ref = null;
  for (const p of series) {
    if (p.time <= alvo) ref = p;
    else break;
  }
  if (!ref || !ref.close) return null;
  return ((last.close - ref.close) / ref.close) * 100;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

  const [ewz, fxSeries, fxSpot, ...hold] = await Promise.all([
    settled("ewz", yahooIntraday("EWZ")),
    settled("usdbrl-yahoo", yahooIntraday("BRL=X")),
    settled("awesomeapi", awesomeUsd()),
    ...EWZ_HOLDINGS.map((h) => settled(h.ticker, yahooIntraday(h.yahoo))),
  ]);

  const serie = fxSeries?.series ?? [];
  const spot = fxSpot ?? (fxSeries ? { price: fxSeries.price, change: fxSeries.change, changePct: fxSeries.changePct, ts: fxSeries.ts } : null);
  const usdbrl = spot
    ? {
        ...spot,
        source: fxSpot ? "AwesomeAPI" : "Yahoo Finance",
        var5m: varJanela(serie, 5),
        var1h: varJanela(serie, 60),
        varDia: spot.changePct,
      }
    : null;

  res.status(200).json({
    now: Math.floor(Date.now() / 1000),
    ewz: ewz && { price: ewz.price, change: ewz.change, changePct: ewz.changePct, ts: ewz.ts },
    usdbrl,
    series: { ewz: ewz?.series ?? [], usdbrl: serie },
    holdings: EWZ_HOLDINGS.map((h, i) => ({
      ticker: h.ticker,
      name: h.name,
      sector: h.sector,
      weight: h.weight,
      price: hold[i]?.price ?? null,
      changePct: hold[i]?.changePct ?? null,
    })),
    holdingsAsOf: EWZ_AS_OF,
    holdingsSource: EWZ_SOURCE,
  });
}
