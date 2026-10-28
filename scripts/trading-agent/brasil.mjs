// Dados complementares (B3, câmbio, VIX, histórico) e prêmio/desconto de ADRs.
// Fontes: /api/quotes do próprio site (BCB + AwesomeAPI + Yahoo) e Yahoo Finance (histórico diário).
import { fetchJson } from "../lib/util.mjs";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SagaFin/1.0; +https://sagafin.com.br)" };

export async function cotacoesSite(siteUrl) {
  const r = await fetchJson(`${siteUrl.replace(/\/$/, "")}/api/quotes`, { headers: UA }, 15000);
  if (!r.ok || !r.json?.quotes) {
    console.warn(`⚠ /api/quotes indisponível (HTTP ${r.status}); seguindo sem macro Brasil.`);
    return {};
  }
  return r.json.quotes; // { IBOV:{value,change}, "USD/BRL":{...}, PETR4:{...}, ... }
}

/** Histórico diário do Yahoo (até 1 ano). Devolve { price, prev_close, closes[], change_pct }. */
export async function yahooChart(symbol, range = "1y") {
  try {
    const r = await fetchJson(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`,
      { headers: UA }, 12000,
    );
    const r0 = r.json?.chart?.result?.[0];
    if (!r.ok || !r0) throw new Error(`HTTP ${r.status}`);
    const meta = r0.meta || {};
    const closes = (r0.indicators?.quote?.[0]?.close ?? []).filter((c) => Number.isFinite(c));
    const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? null;
    const prev = meta.regularMarketPreviousClose ?? meta.previousClose ?? (closes.length >= 2 ? closes[closes.length - 2] : null);
    return {
      symbol,
      price,
      prev_close: prev,
      change_pct: prev ? ((price - prev) / prev) * 100 : null,
      closes,
      high_52w: meta.fiftyTwoWeekHigh ?? (closes.length ? Math.max(...closes) : null),
      low_52w: meta.fiftyTwoWeekLow ?? (closes.length ? Math.min(...closes) : null),
    };
  } catch (e) {
    console.warn(`⚠ Yahoo ${symbol}: ${e.message}`);
    return null;
  }
}

/** Indicadores de tendência a partir de uma série de fechamentos diários. */
export function tendencia(closes) {
  if (!closes || closes.length < 60) return null;
  const n = closes.length;
  const ult = closes[n - 1];
  const media = (k) => (n >= k ? closes.slice(n - k).reduce((a, b) => a + b, 0) / k : null);
  const ret = (k) => (n > k ? (ult / closes[n - 1 - k] - 1) * 100 : null);
  const mm50 = media(50);
  const mm200 = media(200);
  const max52 = Math.max(...closes.slice(-252));
  const min52 = Math.min(...closes.slice(-252));
  return {
    ret_1m_pct: ret(21),
    ret_3m_pct: ret(63),
    ret_6m_pct: ret(126),
    ret_12m_pct: ret(252),
    mm50,
    mm200,
    dist_mm200_pct: mm200 ? (ult / mm200 - 1) * 100 : null,
    acima_mm200: mm200 ? ult > mm200 : null,
    pos_52w_pct: max52 > min52 ? ((ult - min52) / (max52 - min52)) * 100 : null, // 0 = na mínima, 100 = na máxima
    max_52w: max52,
    min_52w: min52,
  };
}

/** Prêmio (+) ou desconto (−) do ADR frente à ação na B3, em %. */
export function premioADR({ adrPrice, ratio, b3Price, usdbrl }) {
  if (![adrPrice, ratio, b3Price, usdbrl].every((v) => Number.isFinite(v) && v > 0)) return null;
  const paridade = (b3Price / usdbrl) * ratio; // valor do ADR em USD se não houvesse prêmio
  return ((adrPrice / paridade) - 1) * 100;
}

/**
 * Monta o bloco macro: IBOV, USD/BRL, Selic, VIX, SPY e prêmio dos ADRs com par na B3.
 * `adrs` = universe.adr_br; `precosADR` = { PBR: 13.2, ... } (ref price do DXLink).
 */
export async function macroBrasil({ siteUrl, adrs, precosADR }) {
  const site = await cotacoesSite(siteUrl);
  const usdbrl = site["USD/BRL"]?.value ?? null;
  const [vix, spx] = await Promise.all([yahooChart("^VIX", "3mo"), yahooChart("^GSPC", "3mo")]);

  const faltam = adrs.filter((a) => a.b3).map((a) => a.b3).filter((t) => !site[t.replace(".SA", "")]);
  const extras = {};
  for (const t of [...new Set(faltam)]) {
    const y = await yahooChart(t, "5d");
    if (y?.price) extras[t] = y.price;
  }

  const adr_premios = {};
  for (const a of adrs) {
    if (!a.b3 || !a.ratio) continue;
    const chaveSite = a.b3.replace(".SA", "");
    const b3Price = site[chaveSite]?.value ?? extras[a.b3] ?? null;
    const p = premioADR({ adrPrice: precosADR[a.symbol], ratio: a.ratio, b3Price, usdbrl });
    if (p != null) adr_premios[a.symbol] = { premio_pct: Math.round(p * 100) / 100, b3: a.b3, b3_price: b3Price };
  }

  return {
    ibov: site.IBOV ?? null,
    usdbrl: site["USD/BRL"] ?? null,
    selic: site.SELIC?.value ?? null,
    cdi: site.CDI?.value ?? null,
    vix: vix ? { value: vix.price, change: vix.change_pct } : null,
    spx: spx ? { value: spx.price, change: spx.change_pct } : null,
    adr_premios,
    fonte: "BCB/AwesomeAPI/Yahoo via /api/quotes; Yahoo Finance",
  };
}
