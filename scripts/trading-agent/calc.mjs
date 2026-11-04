// Cálculos de opções: expected move (fórmula tastytrade), seleção de vencimento, strikes por delta,
// estruturas (spreads, condor, strangle, covered call) com risco máximo, lucro máximo, breakevens,
// POP teórica e efeito aproximado em buying power. Tudo é estimativa educacional.
import { refPrice } from "./dxlink.mjs";

export const HORIZONTES = {
  daily:      { dte_min: 0,   dte_max: 5,   dte_alvo: 2,   expira_dias: 1,   label: "Diário" },
  weekly:     { dte_min: 6,   dte_max: 16,  dte_alvo: 10,  expira_dias: 7,   label: "Semanal" },
  monthly:    { dte_min: 28,  dte_max: 60,  dte_alvo: 45,  expira_dias: 30,  label: "Mensal" },
  semiannual: { dte_min: 90,  dte_max: 220, dte_alvo: 150, expira_dias: 180, label: "Semestral" },
  long_term:  { dte_min: 250, dte_max: 800, dte_alvo: 365, expira_dias: 365, label: "Longo prazo" },
};

const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

export function mid(q) {
  if (!q) return null;
  if (q.bid != null && q.ask != null && q.ask > 0 && q.bid >= 0) return (q.bid + q.ask) / 2;
  if (q.last != null && q.last > 0) return q.last;
  return null;
}

/** Spread relativo bid/ask (0.1 = 10% do mid). */
export function spreadRel(q) {
  const m = mid(q);
  if (!m || q.bid == null || q.ask == null) return null;
  return (q.ask - q.bid) / m;
}

/** Vencimento dentro da faixa do horizonte, preferindo "Regular" e o mais próximo do alvo. */
export function escolherVencimento(chain, horizonte) {
  const h = HORIZONTES[horizonte];
  if (!chain || !h) return null;
  const cands = chain.expirations.filter((e) => e.dte != null && e.dte >= h.dte_min && e.dte <= h.dte_max && e.strikes.length >= 6);
  if (!cands.length) return null;
  cands.sort((a, b) => {
    const pa = (a.type === "Regular" ? 0 : 1) * 1000 + Math.abs(a.dte - h.dte_alvo);
    const pb = (b.type === "Regular" ? 0 : 1) * 1000 + Math.abs(b.dte - h.dte_alvo);
    return pa - pb;
  });
  return cands[0];
}

/** Índice do strike ATM (mais próximo do spot). */
function idxATM(strikes, spot) {
  let best = 0;
  for (let i = 1; i < strikes.length; i++) {
    if (Math.abs(strikes[i].strike - spot) < Math.abs(strikes[best].strike - spot)) best = i;
  }
  return best;
}

/**
 * Expected move da tastytrade: 0,6×straddle ATM + 0,3×strangle 1º OTM + 0,1×strangle 2º OTM.
 * `cot` = mapa streamer symbol → cotação (DXLink).
 */
export function expectedMove(exp, cot, spot) {
  if (!exp || !spot) return null;
  const s = exp.strikes;
  const i = idxATM(s, spot);
  const call = (k) => (s[k] ? mid(cot[s[k].call_streamer]) : null);
  const put = (k) => (s[k] ? mid(cot[s[k].put_streamer]) : null);
  const straddle = call(i) != null && put(i) != null ? call(i) + put(i) : null;
  if (straddle == null) return null;
  const st1 = call(i + 1) != null && put(i - 1) != null ? call(i + 1) + put(i - 1) : null;
  const st2 = call(i + 2) != null && put(i - 2) != null ? call(i + 2) + put(i - 2) : null;
  let em;
  if (st1 != null && st2 != null) em = 0.6 * straddle + 0.3 * st1 + 0.1 * st2;
  else if (st1 != null) em = 0.65 * straddle + 0.35 * st1;
  else em = 0.85 * straddle;
  return { em: r2(em), em_pct: r2((em / spot) * 100), straddle: r2(straddle), atm_strike: s[i].strike, dte: exp.dte, expiration: exp.expiration };
}

/** Strike cujo |delta| é o mais próximo do alvo (puts têm delta negativo). */
export function strikePorDelta(exp, cot, right, alvo) {
  let best = null;
  for (const st of exp.strikes) {
    const sym = right === "call" ? st.call_streamer : st.put_streamer;
    const q = cot[sym];
    if (!q || q.delta == null) continue;
    const d = Math.abs(q.delta);
    if (d <= 0.001 || d >= 0.999) continue;
    if (!best || Math.abs(d - alvo) < Math.abs(best.delta_abs - alvo)) {
      best = { strike: st.strike, streamer: sym, occ: right === "call" ? st.call : st.put, delta: q.delta, delta_abs: d, mid: mid(q), bid: q.bid, ask: q.ask, iv: q.iv, theta: q.theta, oi: q.oi, spread_rel: spreadRel(q) };
    }
  }
  return best;
}

/** Strike N posições OTM a partir de um strike (largura do spread). */
export function strikeDeslocado(exp, cot, right, strike, passos) {
  const idx = exp.strikes.findIndex((s) => s.strike === strike);
  if (idx < 0) return null;
  const j = right === "put" ? idx - passos : idx + passos;
  const st = exp.strikes[j];
  if (!st) return null;
  const sym = right === "call" ? st.call_streamer : st.put_streamer;
  const q = cot[sym] || {};
  return { strike: st.strike, streamer: sym, occ: right === "call" ? st.call : st.put, delta: q.delta ?? null, delta_abs: q.delta != null ? Math.abs(q.delta) : null, mid: mid(q), bid: q.bid ?? null, ask: q.ask ?? null, iv: q.iv ?? null, theta: q.theta ?? null, oi: q.oi ?? null, spread_rel: spreadRel(q) };
}

/** Quantos passos de strike dão aproximadamente `pctLargura` do spot. */
function passosPara(exp, spot, pctLargura) {
  const strikes = exp.strikes.map((s) => s.strike);
  const i = idxATM(exp.strikes, spot);
  const inc = Math.abs((strikes[i + 1] ?? strikes[i]) - (strikes[i - 1] ?? strikes[i])) / 2 || 1;
  return Math.max(1, Math.round((spot * pctLargura) / inc));
}

const leg = (side, right, s, qty = 1) => ({ side, right, strike: s.strike, expiration: null, delta: r2(s.delta), mid: r2(s.mid), occ: s.occ, streamer: s.streamer, qty });

/**
 * Monta a estrutura e calcula risco. Devolve null se faltarem dados.
 * tipos: short_put_spread | short_call_spread | iron_condor | short_strangle | covered_call | long_call_spread | long_put_spread
 */
export function montarEstrutura(tipo, { exp, cot, spot, mult = 100 }) {
  if (!exp || !spot) return null;
  const passos = passosPara(exp, spot, 0.025); // largura ≈ 2,5% do spot
  const fix = (legs) => legs.map((l) => ({ ...l, expiration: exp.expiration }));
  let legs = []; let credit = null; let debit = null; let max_loss = null; let max_profit = null; let breakevens = []; let pop = null; let bp = null; let undefined_risk = false;

  if (tipo === "short_put_spread" || tipo === "short_call_spread") {
    const right = tipo === "short_put_spread" ? "put" : "call";
    const curta = strikePorDelta(exp, cot, right, 0.25);
    const longa = curta && strikeDeslocado(exp, cot, right, curta.strike, passos);
    if (!curta || !longa || curta.mid == null || longa.mid == null) return null;
    credit = curta.mid - longa.mid;
    const width = Math.abs(curta.strike - longa.strike);
    if (credit <= 0 || credit >= width) return null;
    max_profit = credit * mult; max_loss = (width - credit) * mult; bp = max_loss;
    breakevens = [right === "put" ? curta.strike - credit : curta.strike + credit];
    pop = 1 - credit / width;
    legs = fix([leg("sell", right, curta), leg("buy", right, longa)]);
  } else if (tipo === "iron_condor") {
    const sp = strikePorDelta(exp, cot, "put", 0.16);
    const sc = strikePorDelta(exp, cot, "call", 0.16);
    const lp = sp && strikeDeslocado(exp, cot, "put", sp.strike, passos);
    const lc = sc && strikeDeslocado(exp, cot, "call", sc.strike, passos);
    if (!sp || !sc || !lp || !lc || [sp, sc, lp, lc].some((x) => x.mid == null)) return null;
    credit = sp.mid - lp.mid + sc.mid - lc.mid;
    const width = Math.max(Math.abs(sp.strike - lp.strike), Math.abs(sc.strike - lc.strike));
    if (credit <= 0 || credit >= width) return null;
    max_profit = credit * mult; max_loss = (width - credit) * mult; bp = max_loss;
    breakevens = [sp.strike - credit, sc.strike + credit];
    pop = 1 - credit / width;
    legs = fix([leg("sell", "put", sp), leg("buy", "put", lp), leg("sell", "call", sc), leg("buy", "call", lc)]);
  } else if (tipo === "short_strangle") {
    const sp = strikePorDelta(exp, cot, "put", 0.16);
    const sc = strikePorDelta(exp, cot, "call", 0.16);
    if (!sp || !sc || sp.mid == null || sc.mid == null) return null;
    credit = sp.mid + sc.mid;
    max_profit = credit * mult; max_loss = null; undefined_risk = true;
    bp = Math.round(0.2 * spot * mult); // aproximação Reg-T para strangle
    breakevens = [sp.strike - credit, sc.strike + credit];
    pop = 1 - sp.delta_abs - sc.delta_abs;
    legs = fix([leg("sell", "put", sp), leg("sell", "call", sc)]);
  } else if (tipo === "covered_call") {
    const sc = strikePorDelta(exp, cot, "call", 0.30);
    if (!sc || sc.mid == null) return null;
    credit = sc.mid;
    max_profit = (sc.strike - spot + credit) * mult; max_loss = (spot - credit) * mult; bp = (spot - credit) * mult;
    breakevens = [spot - credit];
    pop = 1 - sc.delta_abs; // prob. de a call expirar OTM (ação mantida com prêmio)
    legs = fix([{ side: "buy", right: "shares", strike: null, expiration: null, delta: 1, mid: r2(spot), occ: null, streamer: null, qty: mult }, leg("sell", "call", sc)]);
  } else if (tipo === "long_call_spread" || tipo === "long_put_spread") {
    const right = tipo === "long_call_spread" ? "call" : "put";
    const longa = strikePorDelta(exp, cot, right, 0.50);
    const curta = longa && strikeDeslocado(exp, cot, right, longa.strike, passos);
    if (!longa || !curta || longa.mid == null || curta.mid == null) return null;
    debit = longa.mid - curta.mid;
    const width = Math.abs(curta.strike - longa.strike);
    if (debit <= 0 || debit >= width) return null;
    max_loss = debit * mult; max_profit = (width - debit) * mult; bp = max_loss;
    breakevens = [right === "call" ? longa.strike + debit : longa.strike - debit];
    pop = debit / width;
    legs = fix([leg("buy", right, longa), leg("sell", right, curta)]);
  } else {
    return null;
  }

  const theta_total = legs.reduce((a, l) => {
    const q = l.streamer ? cot[l.streamer] : null;
    if (!q || q.theta == null) return a;
    return a + (l.side === "sell" ? -q.theta : q.theta) * mult;
  }, 0);

  return {
    strategy_type: tipo,
    legs,
    risk: {
      credit_or_debit: credit != null ? `crédito ${r2(credit)}` : `débito ${r2(debit)}`,
      credit: r2(credit), debit: r2(debit),
      max_loss: max_loss == null ? null : Math.round(max_loss),
      max_profit: max_profit == null ? null : Math.round(max_profit),
      undefined_risk,
      breakevens: breakevens.map(r2),
      pop_estimate: pop == null ? null : r1(Math.max(0, Math.min(1, pop)) * 100),
      bp_effect: bp == null ? null : Math.round(bp),
      theta_day: r2(theta_total),
      dte: exp.dte,
      expiration: exp.expiration,
    },
  };
}

/** Marca a mercado uma estrutura (P&L hipotético em % do risco máximo ou do crédito). */
export function marcarEstrutura(legs, cotAtual, { max_loss, credit, debit, mult = 100 }) {
  let valor = 0; let faltou = false;
  for (const l of legs) {
    if (l.right === "shares") continue;
    const q = l.streamer ? cotAtual[l.streamer] : null;
    const m = mid(q);
    if (m == null) { faltou = true; break; }
    valor += (l.side === "sell" ? -m : m) * (l.qty || 1);
  }
  if (faltou) return null;
  // P&L = (valor de abertura) - (valor atual) para crédito; inverso para débito.
  let pnl;
  if (credit != null) pnl = (credit + valor) * mult;      // valor é negativo para posição vendida
  else if (debit != null) pnl = (valor - debit) * mult;
  else return null;
  const base = max_loss ?? (credit != null ? credit * mult * 2 : debit * mult);
  return { pnl_usd: r2(pnl), pnl_pct: base ? r1((pnl / base) * 100) : null, valor_atual: r2(valor) };
}

export function earningsDentro(metrics, expiration) {
  const d = metrics?.earnings_date;
  if (!d || !expiration) return false;
  return d <= expiration;
}

export { refPrice };
