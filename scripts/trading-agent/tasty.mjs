// Cliente mínimo da tastytrade Open API (REST). OAuth2 "personal grant":
// TASTY_CLIENT_ID + TASTY_CLIENT_SECRET + TASTY_REFRESH_TOKEN → access token (~15 min).
// Docs: https://developer.tastytrade.com/docs/authentication/oauth2/
import { env, fetchJson, fail, dormir } from "../lib/util.mjs";

const BASE = (process.env.TASTY_BASE_URL || "https://api.tastyworks.com").replace(/\/$/, "");
const UA = "sagafin-trading-agent/1.0 (+https://sagafin.com.br)";

let _token = null;
let _tokenExp = 0;

export async function accessToken() {
  if (_token && Date.now() < _tokenExp - 60_000) return _token;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: env("TASTY_REFRESH_TOKEN"),
    client_id: env("TASTY_CLIENT_ID"),
    client_secret: env("TASTY_CLIENT_SECRET"),
  });
  const r = await fetchJson(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body,
  });
  if (!r.ok || !r.json?.access_token) fail(`tastytrade OAuth HTTP ${r.status}: ${r.text.slice(0, 300)}`);
  _token = r.json.access_token;
  _tokenExp = Date.now() + (Number(r.json.expires_in) || 900) * 1000;
  return _token;
}

/** GET autenticado com retry em 429/5xx (backoff 2s, 4s, 8s). Devolve `data`. */
export async function tastyGet(path, params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => qs.append(`${k}[]`, x));
    else if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ""}`;
  let ultimo = null;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const tok = await accessToken();
    const r = await fetchJson(url, {
      headers: { Authorization: `Bearer ${tok}`, Accept: "application/json", "User-Agent": UA },
    }, 30000);
    if (r.ok) return r.json?.data ?? r.json;
    ultimo = r;
    if (r.status === 429 || r.status >= 500) {
      await dormir(2000 * 2 ** tentativa);
      continue;
    }
    break;
  }
  const err = new Error(`tastytrade GET ${path} HTTP ${ultimo?.status}: ${ultimo?.text?.slice(0, 300)}`);
  err.status = ultimo?.status;
  throw err;
}

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};
// A tastytrade devolve volatilidade implícita em decimal (0.43 = 43%) e a histórica em
// percentual (84.5). Normaliza tudo para decimal para as regras ivx > hv30 funcionarem.
const vol = (v) => {
  const n = num(v);
  if (n == null) return null;
  return n > 3 ? n / 100 : n;
};
// Sentinelas da tasty (ex.: price-earnings-ratio = -99999.99) viram null.
const semSentinela = (v) => {
  const n = num(v);
  return n == null || Math.abs(n) >= 99999 ? null : n;
};

/** /market-metrics em lotes. Devolve mapa símbolo → métricas normalizadas. */
export async function marketMetrics(symbols) {
  const out = {};
  const lista = [...new Set(symbols)].filter(Boolean);
  for (let i = 0; i < lista.length; i += 40) {
    const lote = lista.slice(i, i + 40);
    let data;
    try {
      data = await tastyGet("/market-metrics", { symbols: lote.join(",") });
    } catch (e) {
      console.warn(`⚠ market-metrics lote ${i / 40 + 1}: ${e.message}`);
      continue;
    }
    for (const m of data?.items || []) {
      const ivr = num(m["implied-volatility-index-rank"]) ?? num(m["tw-implied-volatility-index-rank"]);
      const ivp = num(m["implied-volatility-percentile"]);
      out[m.symbol] = {
        symbol: m.symbol,
        ivx: num(m["implied-volatility-index"]),                 // ex.: 0.632 = 63,2%
        iv_rank: ivr == null ? null : Math.round(ivr * 1000) / 10, // 0–100
        iv_pct: ivp == null ? null : Math.round(ivp * 1000) / 10,  // 0–100
        iv30: vol(m["implied-volatility-30-day"]),
        hv30: vol(m["historical-volatility-30-day"]),
        hv90: vol(m["historical-volatility-90-day"]),
        iv_hv_diff: vol(m["iv-hv-30-day-difference"]),
        liquidity: num(m["liquidity-rating"]),                     // 0–4
        liquidity_value: num(m["liquidity-value"]),
        beta: num(m.beta),
        corr_spy_3m: num(m["corr-spy-3month"]),
        market_cap: num(m["market-cap"]),
        pe: semSentinela(m["price-earnings-ratio"]),
        dividend_yield: num(m["dividend-yield"]),
        earnings_date: m.earnings?.["expected-report-date"] || null,
        earnings_time: m.earnings?.["time-of-day"] || null,
        iv_por_vencimento: (m["option-expiration-implied-volatilities"] || []).map((x) => ({
          expiration: x["expiration-date"],
          iv: num(x["implied-volatility"]),
          type: x["option-chain-type"],
        })),
        updated_at: m["updated-at"] || null,
      };
    }
  }
  return out;
}

/** Cadeia de opções agrupada (vencimentos → strikes → OCC + streamer symbols). */
export async function nestedChain(symbol) {
  const data = await tastyGet(`/option-chains/${encodeURIComponent(symbol)}/nested`);
  const item = data?.items?.[0];
  if (!item) return null;
  return {
    symbol: item["underlying-symbol"] || symbol,
    root: item["root-symbol"],
    shares_per_contract: num(item["shares-per-contract"]) || 100,
    expirations: (item.expirations || []).map((e) => ({
      expiration: e["expiration-date"],
      dte: num(e["days-to-expiration"]),
      type: e["expiration-type"],          // Regular | Weekly | Quarterly | ...
      settlement: e["settlement-type"],
      strikes: (e.strikes || []).map((s) => ({
        strike: num(s["strike-price"]),
        call: s.call,
        put: s.put,
        call_streamer: s["call-streamer-symbol"],
        put_streamer: s["put-streamer-symbol"],
      })).filter((s) => s.strike != null),
    })),
  };
}

/** Streamer symbols dos ativos à vista (ex.: PBR.A → "PBR/A"). */
export async function equityStreamerSymbols(symbols) {
  const out = {};
  const lista = [...new Set(symbols)];
  for (let i = 0; i < lista.length; i += 50) {
    try {
      const data = await tastyGet("/instruments/equities", { symbol: lista.slice(i, i + 50) });
      for (const it of data?.items || []) out[it.symbol] = it["streamer-symbol"] || it.symbol;
    } catch (e) {
      console.warn(`⚠ instruments/equities: ${e.message}`);
    }
  }
  for (const s of lista) if (!out[s]) out[s] = s;
  return out;
}

/** Watchlists privadas do cliente → lista de símbolos de ações/ETFs. */
export async function watchlistSymbols() {
  try {
    const data = await tastyGet("/watchlists");
    const syms = new Set();
    for (const w of data?.items || []) {
      for (const e of w["watchlist-entries"] || []) {
        const t = (e["instrument-type"] || "").toLowerCase();
        if (!t || t === "equity") syms.add(e.symbol);
      }
    }
    return [...syms];
  } catch (e) {
    console.warn(`⚠ watchlists indisponíveis: ${e.message}`);
    return [];
  }
}

/** Token + URL do DXLink. */
export async function quoteToken() {
  const data = await tastyGet("/api-quote-tokens");
  if (!data?.token || !data["dxlink-url"]) throw new Error("api-quote-tokens sem token/url");
  return { token: data.token, url: data["dxlink-url"], level: data.level };
}

/** Contas, saldos e posições (PRIVADO — vai só para account_snapshots). */
export async function contaResumo() {
  const data = await tastyGet("/customers/me/accounts");
  const contas = (data?.items || []).map((x) => x.account || x).filter((a) => a["account-number"]);
  const out = [];
  for (const a of contas) {
    const acc = a["account-number"];
    let bal = {}; let pos = [];
    try { bal = await tastyGet(`/accounts/${acc}/balances`); } catch (e) { console.warn(`⚠ balances ${acc}: ${e.message}`); }
    try { pos = (await tastyGet(`/accounts/${acc}/positions`))?.items || []; } catch (e) { console.warn(`⚠ positions ${acc}: ${e.message}`); }
    out.push({
      account_number: acc,
      nickname: a.nickname || null,
      margin_or_cash: a["margin-or-cash"] || null,
      net_liq: num(bal["net-liquidating-value"]),
      option_bp: num(bal["derivative-buying-power"]),
      stock_bp: num(bal["equity-buying-power"]),
      cash: num(bal["cash-balance"]),
      pl_day: num(bal["realized-day-gain"]) ?? null,
      positions: pos.map((p) => ({
        symbol: p.symbol,
        underlying: p["underlying-symbol"],
        type: p["instrument-type"],
        qty: num(p.quantity),
        direction: p["quantity-direction"],
        avg_open: num(p["average-open-price"]),
        close_price: num(p["close-price"]),
        multiplier: num(p.multiplier),
        expires_at: p["expires-at"] || null,
      })),
    });
  }
  return out;
}
