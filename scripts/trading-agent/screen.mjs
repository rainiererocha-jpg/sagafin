// Triagem mecânica (sem LLM): decide quais símbolos merecem cadeia de opções e quais
// estruturas fazem sentido em cada horizonte. Regras inspiradas nos estudos da tastylive
// (45 DTE, 16Δ, IV rank ≥ 30 para vender prêmio, liquidez ≥ 3) e no material de benchmark.
import { HORIZONTES, escolherVencimento, expectedMove, montarEstrutura, earningsDentro } from "./calc.mjs";

const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

export function classeAtivo(sym, universe) {
  if (universe.adr_br.some((a) => a.symbol === sym)) return "adr_br";
  if (sym === "EWZ" || sym === "EWZS" || sym === "FLBR") return "etf_br";
  if (universe.etfs_core.includes(sym) || universe.alavancados_somente_estudo_de_risco.includes(sym)) return "etf_us";
  return "stock_us";
}

/** Ordena o universo por "interesse" e aplica o filtro de liquidez. */
export function preTriagem({ metrics, universe, trends = {}, adrPremios = {} }) {
  const min = universe.limites.liquidity_min ?? 3;
  const out = [];
  const todos = new Set([
    ...universe.etfs_core, ...universe.alavancados_somente_estudo_de_risco, ...universe.acoes_us,
    ...universe.adr_br.map((a) => a.symbol), ...(universe.watchlist || []),
  ]);
  for (const sym of todos) {
    const m = metrics[sym];
    if (!m) continue;
    const liq = m.liquidity;
    const core = universe.etfs_core.includes(sym);
    if (liq == null ? !core : liq < min) continue;
    const motivos = [];
    let score = 0;
    if (m.iv_rank != null) {
      const ext = Math.abs(m.iv_rank - 50) / 50;
      score += ext * 2;
      if (m.iv_rank >= 50) motivos.push(`IV rank alto (${r1(m.iv_rank)})`);
      if (m.iv_rank <= 15) motivos.push(`IV rank baixo (${r1(m.iv_rank)})`);
    }
    if (m.ivx != null && m.hv30 != null && m.ivx > m.hv30) { score += 1; motivos.push("IV acima da vol realizada"); }
    if (m.earnings_date) {
      const dias = Math.round((Date.parse(m.earnings_date) - Date.now()) / 86400000);
      if (dias >= 0 && dias <= 10) { score += 0.5; motivos.push(`resultado em ${dias} dia(s)`); }
    }
    const p = adrPremios[sym]?.premio_pct;
    if (p != null && Math.abs(p) >= 1.5) { score += 1.5; motivos.push(`${p > 0 ? "prêmio" : "desconto"} de ${r1(Math.abs(p))}% vs B3`); }
    const t = trends[sym];
    if (t?.ret_3m_pct != null && Math.abs(t.ret_3m_pct) >= 8) { score += 0.5; motivos.push(`tendência ${t.ret_3m_pct > 0 ? "de alta" : "de baixa"} (${r1(t.ret_3m_pct)}% em 3m)`); }
    if (liq === 4) score += 0.5;
    out.push({ symbol: sym, score: r2(score), liquidity: liq, asset_class: classeAtivo(sym, universe), motivos });
  }
  return out.sort((a, b) => b.score - a.score);
}

function direcaoTendencia(t) {
  if (!t) return "neutral";
  if (t.acima_mm200 && (t.ret_3m_pct ?? 0) > 0) return "bullish";
  if (t.acima_mm200 === false && (t.ret_3m_pct ?? 0) < 0) return "bearish";
  return "neutral";
}

function legsLiquidas(estrutura, maxSpread = 0.3) {
  return estrutura.legs.every((l) => l.right === "shares" || l.spread_rel == null || l.spread_rel <= maxSpread);
}

/** Níveis numéricos de invalidação a partir da estrutura (usados pelo mark-to-market). */
function invalidacao(estrutura, spot, em) {
  const t = estrutura.strategy_type;
  const strikeVendido = (right) => estrutura.legs.find((l) => l.side === "sell" && l.right === right)?.strike ?? null;
  if (t === "short_put_spread") return { below: strikeVendido("put") };
  if (t === "short_call_spread") return { above: strikeVendido("call") };
  if (t === "iron_condor" || t === "short_strangle") return { below: strikeVendido("put"), above: strikeVendido("call") };
  if (t === "covered_call") return { below: r2(spot * 0.9) };
  if (t === "long_call_spread") return { below: r2(spot - (em?.em ?? spot * 0.05)) };
  if (t === "long_put_spread") return { above: r2(spot + (em?.em ?? spot * 0.05)) };
  return {};
}

/**
 * Candidatos de um símbolo com cadeia carregada.
 * ctx: { symbol, assetClass, metrics, chain, cot, spot, trend, adrPremio, universe, refTime }
 */
export function candidatosOpcoes(ctx) {
  const { symbol, assetClass, metrics: m, chain, cot, spot, trend, adrPremio, universe, refTime } = ctx;
  if (!chain || !spot || !m) return [];
  const core = universe.etfs_core.includes(symbol);
  const alavancado = universe.alavancados_somente_estudo_de_risco.includes(symbol);
  const dir = direcaoTendencia(trend);
  const premiumRich = (m.iv_rank ?? 0) >= 30 && m.ivx != null && m.hv30 != null && m.ivx > m.hv30;
  const out = [];

  for (const horizon of ["daily", "weekly", "monthly", "semiannual"]) {
    const exp = escolherVencimento(chain, horizon);
    if (!exp) continue;
    const em = expectedMove(exp, cot, spot);
    const earnings = earningsDentro(m, exp.expiration);
    const tipos = [];

    if (horizon === "daily") {
      // Diário = estudo de evento/curtíssimo prazo: só ETFs core muito líquidos ou véspera de resultado.
      if (!((core && m.liquidity === 4) || earnings)) continue;
      tipos.push(premiumRich ? "iron_condor" : dir === "bearish" ? "long_put_spread" : "long_call_spread");
    } else if (horizon === "weekly" || horizon === "monthly") {
      if (earnings) continue; // resultado dentro do DTE distorce o estudo
      if (alavancado) { if (horizon === "monthly" && premiumRich) tipos.push("iron_condor"); else continue; }
      else if (premiumRich) {
        if (dir === "bullish") tipos.push("short_put_spread");
        else if (dir === "bearish") tipos.push("short_call_spread");
        else tipos.push("iron_condor");
        if (horizon === "monthly" && core && m.liquidity === 4 && (m.iv_rank ?? 0) >= 40) tipos.push("short_strangle");
        if (horizon === "monthly" && (assetClass === "adr_br" || assetClass === "stock_us") && (m.dividend_yield ?? 0) > 0.02) tipos.push("covered_call");
      } else if ((m.iv_rank ?? 50) <= 20) {
        if (dir === "bullish") tipos.push("long_call_spread");
        else if (dir === "bearish") tipos.push("long_put_spread");
      } else if (m.ivx != null && m.hv30 != null && m.ivx > m.hv30 && horizon === "monthly") {
        tipos.push("iron_condor");
      }
    } else if (horizon === "semiannual") {
      if (alavancado) continue;
      if (premiumRich && assetClass !== "etf_us") tipos.push("covered_call");
      if (premiumRich && dir !== "bearish") tipos.push("short_put_spread");
      if (!premiumRich && (m.iv_rank ?? 50) <= 25 && dir === "bullish") tipos.push("long_call_spread");
      if (!premiumRich && (m.iv_rank ?? 50) <= 25 && dir === "bearish") tipos.push("long_put_spread");
    }

    for (const tipo of tipos) {
      const e = montarEstrutura(tipo, { exp, cot, spot, mult: chain.shares_per_contract || 100 });
      if (!e || !legsLiquidas(e)) continue;
      const direction = tipo.includes("put_spread") ? (tipo.startsWith("short") ? "bullish" : "bearish")
        : tipo.includes("call_spread") ? (tipo.startsWith("short") ? "bearish" : "bullish")
        : tipo === "covered_call" ? "bullish" : "neutral";
      // Pontuação: POP, prêmio relativo ao risco, liquidez, extremos de IV, prêmio de ADR.
      let score = (e.risk.pop_estimate ?? 50) / 100;
      if (e.risk.credit != null && e.risk.max_loss) score += Math.min(1, (e.risk.max_profit / e.risk.max_loss) * 2);
      if (m.liquidity === 4) score += 0.3;
      if (m.iv_rank != null) score += Math.abs(m.iv_rank - 50) / 100;
      if (adrPremio != null) score += Math.min(1, Math.abs(adrPremio) / 3);
      if (horizon === "monthly" && exp.dte >= 35 && exp.dte <= 55) score += 0.3;
      out.push({
        id: `${symbol}-${horizon}-${tipo}`.toLowerCase(),
        symbol, asset_class: assetClass, horizon, strategy_type: tipo, direction,
        legs: e.legs,
        risk: { ...e.risk, invalidation: invalidacao(e, spot, em), result_base: e.risk.max_loss ?? (e.risk.credit != null ? Math.round(e.risk.credit * 100 * 2) : e.risk.max_loss) },
        metrics: {
          ivx: m.ivx == null ? null : r1(m.ivx * 100), iv_rank: r1(m.iv_rank), iv_pct: r1(m.iv_pct),
          hv30: m.hv30 == null ? null : r1(m.hv30 * 100), liquidity: m.liquidity, beta: r2(m.beta),
          dte: exp.dte, expiration: exp.expiration,
          expected_move: em?.em ?? null, expected_move_pct: em?.em_pct ?? null,
          ref_price: r2(spot), ref_time: refTime,
          earnings_within_dte: earnings, earnings_date: m.earnings_date,
          dividend_yield: m.dividend_yield == null ? null : r2(m.dividend_yield * 100),
          adr_premio_pct: adrPremio ?? null,
          trend: trend ? { ret_1m_pct: r1(trend.ret_1m_pct), ret_3m_pct: r1(trend.ret_3m_pct), ret_6m_pct: r1(trend.ret_6m_pct), ret_12m_pct: r1(trend.ret_12m_pct), dist_mm200_pct: r1(trend.dist_mm200_pct), acima_mm200: trend.acima_mm200, pos_52w_pct: r1(trend.pos_52w_pct) } : null,
        },
        score: r2(score),
      });
    }
  }
  return out;
}

/** Candidatos de longo prazo (ações/ETFs sem opções): tendência e valor relativo de ADR. */
export function candidatosLongoPrazo({ symbol, assetClass, metrics: m, spot, trend, adrPremio, refTime, universe }) {
  if (!spot || !trend || universe.alavancados_somente_estudo_de_risco.includes(symbol)) return [];
  // Balanço iminente distorce qualquer estudo de longo prazo (gap de resultado): pula.
  if (m?.earnings_date) {
    const dias = Math.round((Date.parse(m.earnings_date) - Date.now()) / 86400000);
    if (dias >= 0 && dias <= (universe.limites?.earnings_dias_longo_prazo ?? 7)) return [];
  }
  const nucleo = universe.etfs_core.includes(symbol) || universe.acoes_us.includes(symbol) || assetClass === "adr_br" || assetClass === "etf_br";
  const out = [];
  const base = {
    symbol, asset_class: assetClass, horizon: "long_term",
    legs: [{ side: "buy", right: "shares", strike: null, expiration: null, delta: 1, mid: r2(spot), occ: null, streamer: null, qty: 100 }],
    metrics: {
      ivx: m?.ivx == null ? null : r1(m.ivx * 100), iv_rank: r1(m?.iv_rank), iv_pct: r1(m?.iv_pct), liquidity: m?.liquidity ?? null,
      beta: r2(m?.beta), pe: r2(m?.pe), dividend_yield: m?.dividend_yield == null ? null : r2(m.dividend_yield * 100),
      dte: null, expiration: null, expected_move: null, expected_move_pct: null, ref_price: r2(spot), ref_time: refTime,
      earnings_within_dte: false, earnings_date: m?.earnings_date ?? null, adr_premio_pct: adrPremio ?? null,
      trend: { ret_1m_pct: r1(trend.ret_1m_pct), ret_3m_pct: r1(trend.ret_3m_pct), ret_6m_pct: r1(trend.ret_6m_pct), ret_12m_pct: r1(trend.ret_12m_pct), dist_mm200_pct: r1(trend.dist_mm200_pct), acima_mm200: trend.acima_mm200, pos_52w_pct: r1(trend.pos_52w_pct), mm200: r2(trend.mm200), max_52w: r2(trend.max_52w), min_52w: r2(trend.min_52w) },
    },
  };
  const risco = (below) => ({
    credit_or_debit: `débito ${r2(spot)} por ação`, credit: null, debit: r2(spot),
    max_loss: Math.round(spot * 100), max_profit: null, undefined_risk: false, breakevens: [r2(spot)],
    pop_estimate: null, bp_effect: Math.round(spot * 100), theta_day: null, dte: null, expiration: null,
    invalidation: { below: r2(below) }, result_base: null,
  });
  if (trend.acima_mm200 && (trend.ret_6m_pct ?? 0) > 0 && (trend.pos_52w_pct ?? 0) >= 60) {
    out.push({ ...base, id: `${symbol}-long_term-shares_trend`.toLowerCase(), strategy_type: "shares_trend", direction: "bullish",
      risk: risco(trend.mm200), score: r2(1 + (trend.ret_12m_pct ?? 0) / 50 + (m?.liquidity === 4 ? 0.3 : 0)) });
  }
  if (assetClass === "adr_br" && adrPremio != null && adrPremio <= -3 && trend.acima_mm200 !== false) {
    out.push({ ...base, id: `${symbol}-long_term-adr_discount`.toLowerCase(), strategy_type: "shares_relative_value", direction: "bullish",
      risk: risco(trend.min_52w), score: r2(1 + Math.abs(adrPremio) / 3) });
  }
  // Reversão à média só em nome conhecido (núcleo ou ADR BR) e com liquidez máxima: é o estudo mais arriscado.
  if (nucleo && m?.liquidity === 4 && trend.acima_mm200 === false && (trend.ret_6m_pct ?? 0) <= -15 && (m?.iv_rank ?? 0) >= 50 && (trend.pos_52w_pct ?? 100) <= 20) {
    out.push({ ...base, id: `${symbol}-long_term-shares_mean_reversion`.toLowerCase(), strategy_type: "shares_mean_reversion", direction: "bullish",
      risk: risco(trend.min_52w * 0.9), score: r2(0.8 + (m?.iv_rank ?? 0) / 100) });
  }
  return out;
}

/** Mantém no máximo N candidatos por horizonte, com no máximo 2 por símbolo. Brasil (EWZ/ADR) com POP ≥ 65 e liquidez 4 tem prioridade. */
export function selecionarCandidatos(cands, maxPorHorizonte = 8) {
  const porH = {};
  const prioridade = (c) => ((c.asset_class === "adr_br" || c.asset_class === "etf_br") && (c.risk?.pop_estimate ?? 0) >= 65 && c.metrics?.liquidity === 4 ? 1 : 0);
  for (const c of [...cands].sort((a, b) => prioridade(b) - prioridade(a) || b.score - a.score)) {
    const lista = (porH[c.horizon] ||= []);
    if (lista.length >= maxPorHorizonte) continue;
    if (lista.filter((x) => x.symbol === c.symbol).length >= 2) continue;
    lista.push(c);
  }
  return Object.values(porH).flat();
}

export { HORIZONTES };
