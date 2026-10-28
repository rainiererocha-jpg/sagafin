// Agente de trading Sagafin — lê a tastytrade 4x por dia de pregão, monta candidatos por regra,
// pede à IA que selecione e redija estudos educacionais e publica no Supabase.
// Roda no GitHub Actions (.github/workflows/trading-agent.yml). Nunca executa ordens.
//
// Env obrigatórias: TASTY_CLIENT_ID, TASTY_CLIENT_SECRET, TASTY_REFRESH_TOKEN, ANTHROPIC_API_KEY,
//                   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Opcionais: SLOT (pre_open|mid_morning|mid_afternoon|post_close), DRY_RUN=true, FORCE_RUN=true,
//            PLAYWRIGHT=on, SITE_URL, MAX_CHAINS (default 14), SKIP_ACCOUNT=true
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fail, partesNoFuso, dormir } from "../lib/util.mjs";
import { carregarFeriados, diaDePregao } from "../lib/calendario.mjs";
import { marketMetrics, nestedChain, equityStreamerSymbols, watchlistSymbols, quoteToken, contaResumo } from "./tasty.mjs";
import { snapshotCotacoes, refPrice } from "./dxlink.mjs";
import { macroBrasil, yahooChart, tendencia } from "./brasil.mjs";
import { preTriagem, candidatosOpcoes, candidatosLongoPrazo, selecionarCandidatos, classeAtivo } from "./screen.mjs";
import { triagem, redigir, custoEstimadoUSD, MODEL_REDACAO } from "./llm.mjs";
import {
  registrarRun, finalizarRun, snapshotExiste, salvarSnapshot, carregarAbertos, streamersDosAbertos,
  marcarEAencerrar, publicarEstudos, salvarConta, publicarPostDia,
} from "./publish.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.env.DRY_RUN === "true";
const FORCE_RUN = process.env.FORCE_RUN === "true";
const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const MAX_CHAINS = Number(process.env.MAX_CHAINS || 14);
const MAX_EXP_POR_CADEIA = 5;
const JANELA_STRIKES = 6;

// Janelas em horário de Nova York (ET). Os dois crons UTC do workflow caem em uma única janela cada.
const JANELAS = {
  pre_open:      { ini: 8 * 60 + 45,  fim: 9 * 60 + 45 },
  mid_morning:   { ini: 10 * 60 + 45, fim: 11 * 60 + 45 },
  mid_afternoon: { ini: 13 * 60 + 45, fim: 14 * 60 + 45 },
  post_close:    { ini: 16 * 60 + 5,  fim: 17 * 60 + 0 },
};

function slotAtual() {
  const et = partesNoFuso("America/New_York");
  const min = et.hora * 60 + et.minuto;
  for (const [slot, j] of Object.entries(JANELAS)) if (min >= j.ini && min <= j.fim) return slot;
  return null;
}

const log = (s) => console.log(s);

async function main() {
  const t0 = Date.now();
  const et = partesNoFuso("America/New_York");
  const hoje = et.iso;
  const slot = process.env.SLOT || slotAtual();
  log(`Agente de trading — ${hoje} ET ${String(et.hora).padStart(2, "0")}:${String(et.minuto).padStart(2, "0")} · slot=${slot || "fora de janela"}${DRY_RUN ? " [DRY RUN]" : ""}${FORCE_RUN ? " [FORCE]" : ""}`);
  if (!slot) { if (!FORCE_RUN) { log("ℹ Fora das janelas de execução; nada a fazer."); return; } }
  const slotFinal = slot || "post_close";

  const feriados = await carregarFeriados(path.join(__dirname, "config", "feriados-nyse.json"));
  const cal = diaDePregao(hoje, feriados);
  if (!cal.rodar && !FORCE_RUN) { log(`ℹ Sem pregão na NYSE hoje (${cal.motivo}); nada a fazer.`); return; }
  if (!DRY_RUN && !FORCE_RUN && (await snapshotExiste(hoje, slotFinal))) { log("ℹ Snapshot deste slot já existe; execução anterior concluiu."); return; }

  const run = await registrarRun({ hoje, slot: slotFinal, dry: DRY_RUN });
  const resumo = { n_symbols: 0, n_candidates: 0, n_published: 0, n_closed: 0 };
  try {
    // 1. universo
    const universe = JSON.parse(await readFile(path.join(__dirname, "config", "universe.json"), "utf8"));
    universe.watchlist = await watchlistSymbols();
    const simbolos = [...new Set([...universe.etfs_core, ...universe.alavancados_somente_estudo_de_risco, ...universe.acoes_us, ...universe.adr_br.map((a) => a.symbol), ...universe.watchlist])];
    log(`✓ Universo: ${simbolos.length} símbolos (${universe.watchlist.length} da watchlist)`);

    // 2. métricas tastytrade
    const metrics = await marketMetrics(simbolos);
    resumo.n_symbols = Object.keys(metrics).length;
    log(`✓ market-metrics: ${resumo.n_symbols} símbolos`);

    // 3. estudos abertos (para marcar) + streamer symbols à vista
    const abertos = DRY_RUN ? [] : await carregarAbertos();
    const todosAVista = [...new Set([...simbolos, ...abertos.map((a) => a.symbol)])];
    const eqStreamer = await equityStreamerSymbols(todosAVista);

    // 4. cotações à vista (DXLink)
    const qt = await quoteToken();
    const cotAVista = await snapshotCotacoes(qt, Object.values(eqStreamer), { timeoutMs: 30000 });
    const spot = {}; for (const s of todosAVista) spot[s] = refPrice(cotAVista[eqStreamer[s]]);
    const refTime = new Date().toISOString();
    log(`✓ DXLink à vista: ${Object.values(spot).filter(Boolean).length}/${todosAVista.length} com preço`);

    // 5. tendência (Yahoo, 1 ano) para os símbolos com métricas e macro Brasil
    const trends = {};
    for (const s of Object.keys(metrics)) {
      const y = await yahooChart(s.replace(".", "-"), "1y");
      if (y?.closes?.length) trends[s] = tendencia(y.closes);
      await dormir(120);
    }
    const precosADR = {}; for (const a of universe.adr_br) if (spot[a.symbol]) precosADR[a.symbol] = spot[a.symbol];
    const macro = await macroBrasil({ siteUrl: SITE_URL, adrs: universe.adr_br, precosADR });
    macro.spy = spot.SPY ? { value: spot.SPY } : null;
    macro.ewz = spot.EWZ ? { value: spot.EWZ, iv_rank: metrics.EWZ?.iv_rank ?? null } : null;
    macro.ref_time = refTime;
    const adrPremios = {}; for (const [k, v] of Object.entries(macro.adr_premios || {})) adrPremios[k] = v;
    log(`✓ Macro: USD/BRL ${macro.usdbrl?.value ?? "n/d"} · VIX ${macro.vix?.value ?? "n/d"} · ${Object.keys(adrPremios).length} ADRs com paridade`);

    // 6. pré-triagem e cadeias de opções
    const ranking = preTriagem({ metrics, universe, trends, adrPremios });
    const paraCadeia = ranking.slice(0, MAX_CHAINS).map((r) => r.symbol);
    log(`✓ Pré-triagem: ${ranking.length} elegíveis; cadeias para ${paraCadeia.join(", ")}`);
    const chains = {};
    for (const s of paraCadeia) {
      try { chains[s] = await nestedChain(s); } catch (e) { console.warn(`⚠ cadeia ${s}: ${e.message}`); }
      await dormir(150);
    }
    // streamers das opções perto do dinheiro, nos vencimentos relevantes
    const optStreamers = new Set(streamersDosAbertos(abertos));
    for (const [s, ch] of Object.entries(chains)) {
      if (!ch || !spot[s]) continue;
      let nExp = 0;
      for (const exp of ch.expirations) {
        if (exp.dte == null || exp.dte > 230 || nExp >= MAX_EXP_POR_CADEIA) continue;
        nExp++;
        const idx = exp.strikes.reduce((b, st, i) => (Math.abs(st.strike - spot[s]) < Math.abs(exp.strikes[b].strike - spot[s]) ? i : b), 0);
        for (let i = Math.max(0, idx - JANELA_STRIKES); i <= Math.min(exp.strikes.length - 1, idx + JANELA_STRIKES); i++) {
          if (exp.strikes[i].call_streamer) optStreamers.add(exp.strikes[i].call_streamer);
          if (exp.strikes[i].put_streamer) optStreamers.add(exp.strikes[i].put_streamer);
        }
      }
    }
    log(`… DXLink opções: ${optStreamers.size} símbolos`);
    // A tastytrade derruba a sessão com muitas assinaturas de uma vez: uma sessão por grupo de símbolos.
    const cotOpcoes = {};
    const listaOpc = [...optStreamers];
    for (let i = 0; i < listaOpc.length; i += 250) {
      Object.assign(cotOpcoes, await snapshotCotacoes(qt, listaOpc.slice(i, i + 250), { timeoutMs: 45000, quietMs: 4000, lote: 100, espacoMs: 500 }));
      await dormir(500);
    }
    const cot = { ...cotAVista, ...cotOpcoes };
    log(`✓ DXLink opções: ${Object.keys(cotOpcoes).length}/${optStreamers.size} símbolos com dados`);

    // 7. marcação a mercado e encerramento dos estudos abertos
    const { marks, encerrados } = await marcarEAencerrar({ abertos, cot, eqStreamer, hoje, slot: slotFinal, dry: DRY_RUN });
    resumo.n_closed = encerrados.length;
    log(`✓ Marcados ${marks.length} estudos abertos; encerrados ${encerrados.length}`);

    // 8. candidatos
    let cands = [];
    for (const s of Object.keys(metrics)) {
      const assetClass = classeAtivo(s, universe);
      const adrPremio = adrPremios[s]?.premio_pct ?? null;
      if (chains[s]) cands.push(...candidatosOpcoes({ symbol: s, assetClass, metrics: metrics[s], chain: chains[s], cot, spot: spot[s], trend: trends[s], adrPremio, universe, refTime }));
      if (ranking.some((r) => r.symbol === s)) cands.push(...candidatosLongoPrazo({ symbol: s, assetClass, metrics: metrics[s], spot: spot[s], trend: trends[s], adrPremio, refTime, universe }));
    }
    cands = selecionarCandidatos(cands, universe.limites.max_candidatos_por_horizonte);
    resumo.n_candidates = cands.length;
    log(`✓ Candidatos: ${cands.length} (${Object.entries(cands.reduce((a, c) => ((a[c.horizon] = (a[c.horizon] || 0) + 1), a), {})).map(([k, v]) => `${k}=${v}`).join(", ")})`);

    // 9. snapshot
    const metricsResumo = {};
    for (const [s, m] of Object.entries(metrics)) metricsResumo[s] = { ivx: m.ivx, iv_rank: m.iv_rank, iv_pct: m.iv_pct, hv30: m.hv30, liquidity: m.liquidity, beta: m.beta, earnings_date: m.earnings_date, ref_price: spot[s] == null ? null : Math.round(spot[s] * 100) / 100, trend: trends[s] ? { ret_3m_pct: trends[s].ret_3m_pct, dist_mm200_pct: trends[s].dist_mm200_pct } : null };
    const snap = DRY_RUN ? { id: null } : await salvarSnapshot({ hoje, slot: slotFinal, universe: simbolos, metrics: metricsResumo, macro });

    // 10. IA: triagem + redação
    let publicados = [];
    if (cands.length) {
      const { selecionados, descartados_por_que } = await triagem({ candidatos: cands, macro, hoje, slot: slotFinal, max: universe.limites.max_estudos_publicados_por_slot });
      log(`✓ Triagem (${selecionados.length}): ${selecionados.map((s) => s.id).join(", ")} · ${descartados_por_que}`);
      const prontos = await redigir({ selecionados, macro, hoje });
      log(`✓ Redigidos e aprovados no compliance: ${prontos.length}`);
      // 10b. screenshots opcionais
      if (process.env.PLAYWRIGHT === "on" && prontos.length) {
        const { capturarGraficos } = await import("./screenshot.mjs");
        const urls = await capturarGraficos([...new Set(prontos.map((p) => p.candidato.symbol))], { hoje, slot: slotFinal });
        for (const p of prontos) if (urls[p.candidato.symbol]) p.candidato.chart_url = urls[p.candidato.symbol];
      }
      publicados = await publicarEstudos({ prontos, abertos, snapshotId: snap.id, hoje, slot: slotFinal, limites: universe.limites, dry: DRY_RUN, model: MODEL_REDACAO });
      if (!DRY_RUN) for (const p of prontos) if (p.candidato.chart_url) { const row = publicados.find((r) => r.symbol === p.candidato.symbol && r.horizon === p.candidato.horizon); if (row) await import("../lib/supabase.mjs").then((m) => m.sbUpdate("trade_studies", `id=eq.${row.id}`, { chart_url: p.candidato.chart_url })); }
      resumo.n_published = publicados.length;
    }

    // 11. conta (privado) e post do dia
    if (process.env.SKIP_ACCOUNT !== "true") {
      try { await salvarConta(await contaResumo(), DRY_RUN); log("✓ Conta salva (privado)"); } catch (e) { console.warn(`⚠ conta: ${e.message}`); }
    }
    if (slotFinal === "post_close") {
      const post = await publicarPostDia({ hoje, novos: publicados, encerrados, abertos: abertos.length - encerrados.length + publicados.length, siteUrl: SITE_URL, dry: DRY_RUN });
      if (post) log(`✓ Post do dia: ${post.slug}`);
    }

    if (DRY_RUN) {
      console.log("\n--- CANDIDATOS ---\n" + JSON.stringify(cands.map((c) => ({ id: c.id, score: c.score, risk: c.risk, metrics: c.metrics })), null, 1).slice(0, 6000));
      console.log("\n--- ESTUDOS (não publicados) ---\n" + JSON.stringify(publicados, null, 1).slice(0, 12000));
      console.log(`\nℹ DRY RUN: nada publicado. Custo estimado de IA: US$ ${custoEstimadoUSD()}`);
    }
    await finalizarRun(run, { status: DRY_RUN ? "dry_run" : "done", ...resumo, cost_usd_estimate: custoEstimadoUSD(), log: `ok em ${Math.round((Date.now() - t0) / 1000)}s` });
    log(`\nConcluído em ${Math.round((Date.now() - t0) / 1000)}s: ${resumo.n_published} estudo(s) publicado(s), ${resumo.n_closed} encerrado(s), custo IA ≈ US$ ${custoEstimadoUSD()}.`);
  } catch (e) {
    await finalizarRun(run, { status: "failed", ...resumo, error: String(e?.stack || e).slice(0, 2000), cost_usd_estimate: custoEstimadoUSD() });
    throw e;
  }
}

main().catch((e) => fail(e?.stack || String(e)));
