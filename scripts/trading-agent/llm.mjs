// Etapa de IA: Sonnet 5.5 ranqueia candidatos; Opus 5.5 redige os estudos finais.
// Saída sempre em JSON validado por schema (structured outputs) e checada pelo compliance.
import { env, fetchJson } from "../lib/util.mjs";
import { checarCompliance } from "../lib/compliance.mjs";

export const MODEL_TRIAGEM = "claude-sonnet-5-5";
export const MODEL_REDACAO = "claude-opus-5-5";
const PRECO = { "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] }; // US$/1M tokens (entrada, saída)

const LABEL_H = { daily: "Diário (0–5 DTE, estudo de evento)", weekly: "Semanal (6–16 DTE)", monthly: "Mensal (28–60 DTE, alvo 45)", semiannual: "Semestral (90–220 DTE)", long_term: "Longo prazo (ações/ETFs, 6–12 meses)" };

const SYSTEM = `Você é o pesquisador-chefe dos "Destaques de Trading Sagafin", uma página de ESTUDO educacional sobre opções e ações nos EUA (via tastytrade) e ADRs/ETFs brasileiros, publicada por Rainiere Rocha, assessor de investimentos (InvestSmart | XP). O público é o investidor pessoa física brasileiro que estuda opções.

REGRAS DE COMPLIANCE (obrigatórias — Resolução CVM 178/23 e Resolução CVM 20; violação cancela a publicação):
- É ESTUDO, nunca recomendação. Jamais use imperativos de execução: "compre", "venda", "monte", "execute", "entre", "opere", "aposte", "hora de", "oportunidade imperdível". Prefira: "a estrutura ganha se…", "o estudo considera…", "a hipótese é…", "o cenário base supõe…".
- Nunca prometa resultado, nunca use "garantido", "lucro certo", "preço-alvo" ou "alvo de preço". Probabilidades são teóricas (POP ≈ prob. de expirar fora do breakeven) e devem ser chamadas de teóricas.
- Use SOMENTE os números fornecidos no JSON de entrada (strikes, crédito/débito, risco máximo, IV rank, expected move, DTE, preços de referência). Não invente números, notícias ou eventos. Se um dado faltar, não cite.
- Não cite produtos de corretoras pelo nome comercial além de "tastytrade" como fonte de dados. Não mencione a conta ou posições de ninguém.
- Sempre explique o lado que perde: cada estudo precisa de invalidação concreta (preço/evento) e regra de gestão.

ESTILO: português do Brasil, direto, sem emojis, sem markdown. Frases curtas. Tom de pesquisador experiente ensinando, não de vendedor. Vocabulário da tastylive traduzido (venda de prêmio, delta 16, gerenciar a 50% do lucro máximo ou 21 DTE, expected move, IV rank).`;

const SCHEMA_TRIAGEM = {
  type: "object",
  additionalProperties: false,
  properties: {
    selecionados: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { id: { type: "string" }, motivo: { type: "string" } },
        required: ["id", "motivo"],
      },
    },
    descartados_por_que: { type: "string" },
  },
  required: ["selecionados", "descartados_por_que"],
};

const SCHEMA_ESTUDOS = {
  type: "object",
  additionalProperties: false,
  properties: {
    estudos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          thesis_public: { type: "string" },
          thesis_full: { type: "string" },
          scenario_bull: { type: "string" },
          scenario_base: { type: "string" },
          scenario_bear: { type: "string" },
          invalidation: { type: "string" },
          management: { type: "string" },
          confidence: { type: "string", enum: ["baixa", "media", "alta"] },
          aprendizado: { type: "string" },
        },
        required: ["id", "title", "thesis_public", "thesis_full", "scenario_bull", "scenario_base", "scenario_bear", "invalidation", "management", "confidence", "aprendizado"],
      },
    },
  },
  required: ["estudos"],
};

let custoAcumulado = 0;
export function custoEstimadoUSD() { return Math.round(custoAcumulado * 10000) / 10000; }

async function chamar({ model, user, schema, max_tokens = 8000, effort = "medium" }) {
  const base = {
    model, max_tokens,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { effort, format: { type: "json_schema", schema } },
  };
  const post = (body) => fetchJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(body),
  }, 180000);

  let r = await post(base);
  if (!r.ok && r.status === 400 && /output_config|format|json_schema/i.test(r.text)) {
    // Fallback: sem structured outputs (modelo/versão sem suporte) — pede JSON puro.
    console.warn("⚠ structured outputs rejeitado; tentando sem schema.");
    const semSchema = { ...base, output_config: { effort } };
    semSchema.messages = [{ role: "user", content: `${user}\n\nResponda SOMENTE com JSON válido no formato: ${JSON.stringify(schema)}` }];
    r = await post(semSchema);
  }
  if (!r.ok) throw new Error(`Anthropic API HTTP ${r.status}: ${r.text.slice(0, 400)}`);
  const j = r.json;
  if (j.stop_reason === "refusal") throw new Error(`Modelo recusou (stop_details: ${JSON.stringify(j.stop_details)})`);
  if (j.stop_reason === "max_tokens") throw new Error("Resposta truncada por max_tokens");
  const u = j.usage || {};
  const [pi, po] = PRECO[model] || [0, 0];
  custoAcumulado += ((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) * 1.25 + (u.cache_read_input_tokens || 0) * 0.1) * pi / 1e6 + (u.output_tokens || 0) * po / 1e6;
  const texto = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  try { return JSON.parse(texto); } catch {
    const ini = texto.indexOf("{"); const fim = texto.lastIndexOf("}");
    if (ini >= 0 && fim > ini) return JSON.parse(texto.slice(ini, fim + 1));
    throw new Error(`Resposta do modelo não é JSON: ${texto.slice(0, 200)}`);
  }
}

function resumoCandidato(c) {
  return {
    id: c.id, symbol: c.symbol, asset_class: c.asset_class, horizon: c.horizon, strategy_type: c.strategy_type, direction: c.direction,
    legs: c.legs.map((l) => `${l.side} ${l.right}${l.strike != null ? ` ${l.strike}` : ""}${l.expiration ? ` ${l.expiration}` : ""}${l.delta != null ? ` (Δ ${l.delta})` : ""}`),
    risk: { credit_or_debit: c.risk.credit_or_debit, max_loss: c.risk.max_loss, max_profit: c.risk.max_profit, undefined_risk: c.risk.undefined_risk, breakevens: c.risk.breakevens, pop_estimate: c.risk.pop_estimate, bp_effect: c.risk.bp_effect, theta_day: c.risk.theta_day, invalidation: c.risk.invalidation },
    metrics: c.metrics, score: c.score,
  };
}

/** Etapa 1 — Sonnet escolhe até `max` candidatos (no máximo 1 por horizonte, símbolos diversos). */
export async function triagem({ candidatos, macro, hoje, slot, max = 5 }) {
  const user = `DATA: ${hoje} · SLOT: ${slot}
MACRO (contexto, só para raciocínio): ${JSON.stringify(macro)}
HORIZONTES: ${JSON.stringify(LABEL_H)}

CANDIDATOS (gerados por regras mecânicas; números reais do snapshot):
${JSON.stringify(candidatos.map(resumoCandidato))}

TAREFA: escolha até ${max} candidatos para virar estudo publicado agora. Critérios: (1) no máximo UM por horizonte; (2) símbolos diferentes entre si; (3) prefira liquidez 4, POP teórica ≥ 65% em venda de prêmio, relação lucro máximo/risco máximo razoável, expected move coerente com a estrutura, ausência de resultado dentro do DTE (exceto no horizonte diário, que é estudo de evento); (4) dê preferência a pelo menos um ativo brasileiro (ADR ou EWZ) quando houver candidato decente; (5) descarte o que tiver spread largo ou tese fraca. Explique em uma frase o motivo de cada escolha e, em "descartados_por_que", o critério geral que eliminou os demais.`;
  const out = await chamar({ model: MODEL_TRIAGEM, user, schema: SCHEMA_TRIAGEM, max_tokens: 3000, effort: "medium" });
  const ids = new Set(candidatos.map((c) => c.id));
  const porH = new Set();
  const sel = [];
  for (const s of out.selecionados || []) {
    const c = candidatos.find((x) => x.id === s.id);
    if (!c || !ids.has(s.id) || porH.has(c.horizon)) continue;
    porH.add(c.horizon);
    sel.push({ ...c, motivo_triagem: s.motivo });
    if (sel.length >= max) break;
  }
  return { selecionados: sel, descartados_por_que: out.descartados_por_que || "" };
}

/** Etapa 2 — Opus redige os estudos. Devolve só os que passaram na validação. */
export async function redigir({ selecionados, macro, hoje }) {
  if (!selecionados.length) return [];
  const user = `DATA: ${hoje}
MACRO (contexto; cite só o que estiver aqui): ${JSON.stringify(macro)}

ESTUDOS A REDIGIR (um por item; use o "id" exatamente como está):
${JSON.stringify(selecionados.map(resumoCandidato))}

Para cada item produza:
- title: até 70 caracteres, factual (ex.: "EWZ: condor de 45 dias com IV rank 62").
- thesis_public: até 280 caracteres, resumo público do estudo (o que a estrutura é e o que precisa acontecer).
- thesis_full: 120–220 palavras, a tese completa: contexto de volatilidade, por que esse vencimento e esses strikes, o que a estrutura ganha e perde, relação com o expected move, e o que o estudo quer ensinar.
- scenario_bull / scenario_base / scenario_bear: 1–2 frases cada, com os números do item (breakevens, strikes, risco máximo).
- invalidation: o nível de preço ou evento concreto que invalida a tese (use risk.invalidation).
- management: regra de gestão mecânica (ex.: encerrar a 50% do lucro máximo ou a 21 DTE; para ações, revisão se fechar abaixo da MM200).
- confidence: baixa | media | alta (alta só com liquidez 4, POP ≥ 70% e sem evento no período).
- aprendizado: uma frase com a lição de educação financeira do estudo.
Lembre: linguagem de estudo, sem imperativos de execução.`;
  const out = await chamar({ model: MODEL_REDACAO, user, schema: SCHEMA_ESTUDOS, max_tokens: 12000, effort: "high" });
  const prontos = [];
  for (const e of out.estudos || []) {
    const c = selecionados.find((x) => x.id === e.id);
    if (!c) { console.warn(`⚠ estudo com id desconhecido descartado: ${e.id}`); continue; }
    const erro = validarEstudo(e);
    if (erro) { console.warn(`⚠ estudo ${e.id} reprovado: ${erro}`); continue; }
    prontos.push({ candidato: c, texto: e });
  }
  return prontos;
}

export function validarEstudo(e) {
  const campos = ["title", "thesis_public", "thesis_full", "scenario_bull", "scenario_base", "scenario_bear", "invalidation", "management", "aprendizado"];
  for (const k of campos) if (!e[k] || String(e[k]).trim().length < 8) return `campo ${k} vazio`;
  if (e.title.length > 90) return "title longo demais";
  if (e.thesis_public.length > 320) return "thesis_public longa demais";
  if (e.thesis_full.split(/\s+/).length < 60) return "thesis_full curta demais";
  for (const k of campos) {
    const m = checarCompliance(e[k], { trading: true });
    if (m) return `compliance: "${m}" em ${k}`;
  }
  return null;
}
