// Persistência: snapshots, estudos, marcação a mercado, encerramentos, conta e log de execução.
import { sbSelect, sbInsert, sbUpdate } from "../lib/supabase.mjs";
import { escapeHtml } from "../lib/util.mjs";
import { AVISO_TRADING } from "../lib/compliance.mjs";
import { marcarEstrutura, refPrice, HORIZONTES } from "./calc.mjs";
import { somarDias } from "../lib/calendario.mjs";

const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);

// ---------------------------------------------------------------- runs

export async function registrarRun({ hoje, slot, dry }) {
  if (dry) return { id: null };
  const [row] = await sbInsert("trading_runs", [{ trade_date: hoje, slot, status: "running" }]);
  return row;
}

export async function finalizarRun(run, patch) {
  if (!run?.id) return;
  await sbUpdate("trading_runs", `id=eq.${run.id}`, { finished_at: new Date().toISOString(), ...patch });
}

// ---------------------------------------------------------------- snapshot

export async function snapshotExiste(hoje, slot) {
  const rows = await sbSelect("market_snapshots", `trade_date=eq.${hoje}&slot=eq.${slot}&select=id`);
  return rows.length > 0;
}

export async function salvarSnapshot({ hoje, slot, universe, metrics, macro }) {
  const [row] = await sbInsert("market_snapshots", [{ trade_date: hoje, slot, universe, metrics, macro }], { onConflict: "trade_date,slot" });
  return row;
}

// ---------------------------------------------------------------- estudos abertos → marcação e encerramento

export async function carregarAbertos() {
  return sbSelect("trade_studies", "status=eq.open&select=*&order=published_at.asc");
}

/** Streamer symbols (opções) que o DXLink precisa assinar para marcar os estudos abertos. */
export function streamersDosAbertos(abertos) {
  const s = new Set();
  for (const e of abertos) for (const l of e.legs || []) if (l.streamer) s.add(l.streamer);
  return [...s];
}

function cruzou(inv, ref) {
  if (!inv || ref == null) return false;
  if (inv.below != null && ref <= inv.below) return true;
  if (inv.above != null && ref >= inv.above) return true;
  return false;
}

/**
 * Marca a mercado cada estudo aberto e encerra pelos critérios mecânicos:
 * alvo (50% do lucro máximo), invalidação (preço cruza nível), vencimento, fim do horizonte.
 */
export async function marcarEAencerrar({ abertos, cot, eqStreamer, hoje, slot, dry }) {
  const marks = [];
  const encerrados = [];
  for (const e of abertos) {
    const ref = refPrice(cot[eqStreamer[e.symbol] || e.symbol]);
    const isShares = (e.legs || []).every((l) => l.right === "shares");
    let pnl_usd = null; let pnl_pct = null;
    if (isShares) {
      if (ref != null && e.entry_ref_price) {
        const sinal = e.direction === "bearish" ? -1 : 1;
        pnl_pct = r1(((ref / e.entry_ref_price) - 1) * 100 * sinal);
        pnl_usd = r2((ref - e.entry_ref_price) * 100 * sinal);
      }
    } else {
      const m = marcarEstrutura(e.legs, cot, { max_loss: e.risk?.max_loss ?? null, credit: e.risk?.credit ?? null, debit: e.risk?.debit ?? null });
      if (m) {
        pnl_usd = m.pnl_usd;
        const base = e.risk?.result_base ?? e.risk?.max_loss ?? null;
        pnl_pct = base ? r1((pnl_usd / base) * 100) : m.pnl_pct;
      }
    }
    marks.push({ study_id: e.id, slot, ref_price: r2(ref), pnl_pct, _slug: e.slug });

    // critérios de encerramento
    let motivo = null;
    if (!isShares && pnl_usd != null && e.risk?.max_profit && pnl_usd >= 0.5 * e.risk.max_profit) motivo = "target";
    else if (cruzou(e.risk?.invalidation, ref)) motivo = "invalidation";
    else if (e.risk?.expiration && hoje >= e.risk.expiration) motivo = "expiry";
    else if (e.expires_at && hoje >= e.expires_at) motivo = "horizon_end";
    if (motivo) {
      const result_pct = pnl_pct;
      encerrados.push({
        id: e.id, slug: e.slug, patch: {
          status: motivo === "invalidation" ? "invalidated" : "closed",
          closed_at: new Date().toISOString(), close_ref_price: r2(ref), close_reason: motivo, result_pct,
          result_note: `Encerrado por ${motivo === "target" ? "alvo (50% do lucro máximo)" : motivo === "invalidation" ? "invalidação do nível de referência" : motivo === "expiry" ? "vencimento" : "fim do horizonte"} em ${hoje} (${slot}), preço de referência ${r2(ref) ?? "n/d"}. Resultado hipotético, sem custos.`,
        },
      });
    }
  }
  if (!dry) {
    const validos = marks.filter((m) => m.ref_price != null || m.pnl_pct != null).map(({ _slug, ...m }) => m);
    if (validos.length) await sbInsert("trade_study_marks", validos);
    for (const c of encerrados) await sbUpdate("trade_studies", `id=eq.${c.id}`, c.patch);
  }
  return { marks, encerrados };
}

// ---------------------------------------------------------------- novos estudos

function slugDe(c, hoje, slot) {
  const sym = c.symbol.toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = `${hoje}-${c.horizon}-${sym}-${c.strategy_type}`.replace(/_/g, "-");
  return c.horizon === "daily" ? `${base}-${slot.replace(/_/g, "-")}` : base;
}

/**
 * Publica os estudos redigidos, respeitando: nenhum estudo aberto com o mesmo símbolo+horizonte,
 * no máximo N novos por horizonte por dia (diário pode renovar a cada slot).
 */
export async function publicarEstudos({ prontos, abertos, snapshotId, hoje, slot, limites, dry, model }) {
  const hojeCount = {};
  if (!dry) {
    const deHoje = await sbSelect("trade_studies", `published_at=gte.${hoje}T00:00:00Z&select=horizon`);
    for (const r of deHoje) hojeCount[r.horizon] = (hojeCount[r.horizon] || 0) + 1;
  }
  const max = limites.max_estudos_novos_por_horizonte_por_dia ?? 1;
  const linhas = [];
  for (const { candidato: c, texto: t } of prontos) {
    if (abertos.some((a) => a.symbol === c.symbol && a.horizon === c.horizon)) { console.log(`ℹ ${c.symbol}/${c.horizon}: já existe estudo aberto; pulando.`); continue; }
    if (c.horizon !== "daily" && (hojeCount[c.horizon] || 0) >= max) { console.log(`ℹ ${c.horizon}: limite diário de estudos atingido; pulando ${c.symbol}.`); continue; }
    const h = HORIZONTES[c.horizon];
    linhas.push({
      slug: slugDe(c, hoje, slot),
      status: "open", horizon: c.horizon, symbol: c.symbol, asset_class: c.asset_class,
      strategy_type: c.strategy_type, direction: c.direction,
      title: t.title.trim().slice(0, 90), thesis_public: t.thesis_public.trim().slice(0, 320), thesis_full: `${t.thesis_full.trim()}\n\nO que este estudo ensina: ${t.aprendizado.trim()}`,
      legs: c.legs, metrics: c.metrics, risk: c.risk,
      invalidation: t.invalidation.trim(), management: t.management.trim(), confidence: t.confidence,
      scenario_bull: t.scenario_bull.trim(), scenario_base: t.scenario_base.trim(), scenario_bear: t.scenario_bear.trim(),
      snapshot_id: snapshotId, entry_ref_price: c.metrics.ref_price,
      expires_at: c.risk.expiration || somarDias(hoje, h.expira_dias),
      model, reviewed: false,
    });
    hojeCount[c.horizon] = (hojeCount[c.horizon] || 0) + 1;
  }
  if (dry || !linhas.length) return linhas;
  return sbInsert("trade_studies", linhas, { onConflict: "slug", ignoreDuplicates: true });
}

// ---------------------------------------------------------------- conta (privado)

export async function salvarConta(contas, dry) {
  if (dry || !contas?.length) return;
  await sbInsert("account_snapshots", contas.map((c) => ({
    account_number: c.account_number, net_liq: c.net_liq, option_bp: c.option_bp, stock_bp: c.stock_bp,
    pl_day: c.pl_day, pl_ytd: c.pl_ytd ?? null, positions: c.positions,
  })));
}

// ---------------------------------------------------------------- post diário no blog (slot post_close)

const LABEL_H = { daily: "Diário", weekly: "Semanal", monthly: "Mensal", semiannual: "Semestral", long_term: "Longo prazo" };
const LABEL_T = {
  short_put_spread: "venda de put spread", short_call_spread: "venda de call spread", iron_condor: "iron condor", short_strangle: "strangle vendido",
  covered_call: "covered call", long_call_spread: "compra de call spread", long_put_spread: "compra de put spread",
  shares_trend: "tendência (ações)", shares_relative_value: "valor relativo ADR × B3", shares_mean_reversion: "reversão à média (ações)",
};

export function htmlResumoDia({ hoje, novos, encerrados, abertos, siteUrl }) {
  const li = (e) => `<li><strong>${escapeHtml(e.symbol)}</strong> · ${escapeHtml(LABEL_H[e.horizon] || e.horizon)} · ${escapeHtml(LABEL_T[e.strategy_type] || e.strategy_type)} — ${escapeHtml(e.thesis_public)} <em>(<a href="${siteUrl}/trading/${e.slug}">ver estudo</a>)</em></li>`;
  const partes = [`<h2>Resumo do dia</h2><p>Estudos publicados nos Destaques de Trading em ${hoje}: ${novos.length} novo(s), ${encerrados.length} encerrado(s), ${abertos} em acompanhamento.</p>`];
  if (novos.length) partes.push(`<h2>Novos estudos</h2><ul>${novos.map(li).join("")}</ul>`);
  if (encerrados.length) partes.push(`<h2>Encerrados hoje</h2><ul>${encerrados.map((c) => `<li>${escapeHtml(c.slug)} — ${escapeHtml(c.patch.close_reason)}${c.patch.result_pct != null ? ` (${c.patch.result_pct > 0 ? "+" : ""}${c.patch.result_pct}% hipotético)` : ""}</li>`).join("")}</ul>`);
  partes.push(`<h2>Como ler</h2><p>Cada estudo mostra a estrutura, o risco máximo, a probabilidade teórica e o nível que invalida a hipótese. A página <a href="${siteUrl}/trading">Destaques de Trading</a> explica a metodologia e mantém o histórico dos estudos encerrados.</p>`);
  partes.push(`<hr /><p style="font-size:12px;opacity:.7">${escapeHtml(AVISO_TRADING)}</p>`);
  return partes.join("\n");
}

export async function publicarPostDia({ hoje, novos, encerrados, abertos, siteUrl, dry }) {
  const slug = `destaques-trading-${hoje}`;
  if (!novos.length && !encerrados.length) return null;
  const titulo = `Destaques de Trading · ${hoje.split("-").reverse().slice(0, 2).join("/")}: ${novos.length} estudo(s) novo(s)`;
  const body = {
    slug, titulo, resumo: `${novos.map((n) => n.symbol).join(", ") || "Sem novos estudos"} — estudos educacionais do dia com opções e ações no exterior.`,
    conteudo_html: htmlResumoDia({ hoje, novos, encerrados, abertos, siteUrl }),
    data_publicacao: hoje, tempo_leitura: "3 min", tags: ["destaques-trading"], destaque: false, status: "published", autor: "Rainiere Rocha",
  };
  if (dry) return body;
  const [row] = await sbInsert("posts", [body], { onConflict: "slug", ignoreDuplicates: true });
  return row || body;
}
