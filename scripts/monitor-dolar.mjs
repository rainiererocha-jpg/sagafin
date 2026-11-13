// Monitor do Dólar — Sagafin
// Todo dia útil lê a PTAX de fechamento do Banco Central, compara a variação do dia com os últimos
// 60 dias (z-score dos retornos) e envia um e-mail curto aos assinantes do Diário Saga + ao dono.
// Dia de alerta = |z| >= Z_LIMIAR (padrão 2). Sem LLM: tudo determinístico.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SITE_URL, MAIL_OWNER (sempre recebe),
//      MAIL_FROM / MAIL_REPLY_TO (opcionais), JANELA (60), Z_LIMIAR (2),
//      DRY_RUN=true (não grava nem envia), FORCE_RUN=true (ignora calendário e idempotência),
//      TEST_TO=email (envia só para esse endereço), PREVIEW_HTML=caminho (salva o HTML).
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fail, env, hojeISO, dataExtenso, ddmm, fetchJson, escapeHtml, fmt } from "./lib/util.mjs";
import { sbSelect, sbInsert } from "./lib/supabase.mjs";
import { AVISO_LEGAL } from "./lib/compliance.mjs";
import { carregarFeriados, diaDePregao, somarDias } from "./lib/calendario.mjs";
import { listarAssinantes, enviarResend, rodapeLgpd, unsubscribeUrl } from "./lib/email.mjs";
import { EMAIL_HEAD_EXTRAS } from "./mesalva-ad.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const FORCE_RUN = process.env.FORCE_RUN === "true";
const DRY_RUN = process.env.DRY_RUN === "true";
const TEST_TO = (process.env.TEST_TO || "").trim();
const JANELA = Number(process.env.JANELA || 60);
const Z_LIMIAR = Number(process.env.Z_LIMIAR || 2);
const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20recebi%20o%20Monitor%20do%20D%C3%B3lar%20da%20Sagafin%20e%20quero%20conversar%20sobre%20prote%C3%A7%C3%A3o%20em%20d%C3%B3lar.";

// ---------------------------------------------------------------- 1. coleta

/** PTAX de fechamento (venda) do BCB, uma por dia útil, ordenada por data. */
export async function coletarPTAX({ diasCorridos = 130, hoje = hojeISO() } = {}) {
  const ini = somarDias(hoje, -diasCorridos);
  const us = (iso) => { const [a, m, d] = iso.split("-"); return `${m}-${d}-${a}`; };
  const url =
    "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)" +
    `?@dataInicial='${us(ini)}'&@dataFinalCotacao='${us(hoje)}'&$format=json&$select=cotacaoVenda,dataHoraCotacao&$orderby=dataHoraCotacao`;
  const r = await fetchJson(url, {}, 20000);
  if (!r.ok) throw new Error(`BCB PTAX HTTP ${r.status}`);
  const serie = (r.json?.value ?? [])
    .map((x) => ({ data: String(x.dataHoraCotacao).slice(0, 10), close: Number(x.cotacaoVenda) }))
    .filter((x) => Number.isFinite(x.close) && x.close > 0);
  if (!serie.length) throw new Error("BCB PTAX: série vazia");
  return { serie, fonte: "bcb" };
}

/** Fallback: fechamentos diários do Yahoo (BRL=X). */
export async function coletarYahoo() {
  const r = await fetchJson(
    "https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?interval=1d&range=6mo",
    { headers: { "User-Agent": "Mozilla/5.0 (sagafin monitor-dolar)" } }, 15000,
  );
  const r0 = r.json?.chart?.result?.[0];
  if (!r.ok || !r0) throw new Error(`Yahoo HTTP ${r.status}`);
  const ts = r0.timestamp ?? [];
  const closes = r0.indicators?.quote?.[0]?.close ?? [];
  const serie = ts
    .map((t, i) => ({ data: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter((x) => Number.isFinite(x.close) && x.close > 0);
  if (!serie.length) throw new Error("Yahoo: série vazia");
  return { serie, fonte: "yahoo" };
}

async function coletar(hoje) {
  try {
    return await coletarPTAX({ hoje });
  } catch (e) {
    console.warn(`⚠ PTAX indisponível (${e.message}); usando Yahoo BRL=X como fallback.`);
    return coletarYahoo();
  }
}

// ---------------------------------------------------------------- 2. cálculo

/**
 * Z-score do retorno (log) do último dia contra os `janela` retornos anteriores.
 * `serie` = [{data, close}] ordenada. Lança erro se faltar histórico.
 */
export function analisar(serie, { janela = JANELA, zLimiar = Z_LIMIAR } = {}) {
  if (serie.length < janela + 2) throw new Error(`Histórico curto: ${serie.length} fechamentos, preciso de ${janela + 2}.`);
  const closes = serie.map((x) => x.close);
  const rets = closes.slice(1).map((c, i) => Math.log(c / closes[i]));
  const rHoje = rets[rets.length - 1];
  const base = rets.slice(-janela - 1, -1);
  const media = base.reduce((a, b) => a + b, 0) / base.length;
  const variancia = base.reduce((a, b) => a + (b - media) ** 2, 0) / (base.length - 1);
  const desvio = Math.sqrt(variancia);
  const z = desvio > 0 ? (rHoje - media) / desvio : 0;
  const ultimos = serie.slice(-janela);
  const closes60 = ultimos.map((x) => x.close);
  const max60 = Math.max(...closes60);
  const min60 = Math.min(...closes60);
  const media20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, closes.length);
  const hoje = serie[serie.length - 1];
  const ontem = serie[serie.length - 2];
  return {
    data: hoje.data,
    ptax: hoje.close,
    anterior: ontem.close,
    varPct: (hoje.close / ontem.close - 1) * 100,
    z,
    alerta: Math.abs(z) >= zLimiar,
    zLimiar,
    janela,
    media60: media,
    desvio60: desvio,
    vezesTipico: desvio > 0 ? Math.abs(rHoje) / desvio : 0,
    media20,
    max60,
    min60,
    posicaoFaixa: max60 > min60 ? ((hoje.close - min60) / (max60 - min60)) * 100 : 50,
    ultimos5: serie.slice(-5),
  };
}

// ---------------------------------------------------------------- 3. e-mail

function sinal(n) { return n > 0 ? "+" : n < 0 ? "−" : ""; }
function pct(n, dec = 2) { return `${sinal(n)}${fmt(Math.abs(n), dec)}%`; }
function brl(n) { return `R$ ${fmt(n, 4)}`; }

export function assunto(a) {
  return a.alerta
    ? `⚠ Dólar oscilou acima do normal: ${pct(a.varPct)} hoje (${fmt(Math.abs(a.z), 1)} desvios)`
    : `Dólar hoje: ${brl(a.ptax)} (${pct(a.varPct)})`;
}

function fraseDoDia(a) {
  const dir = a.varPct > 0 ? "subiu" : a.varPct < 0 ? "caiu" : "ficou estável";
  if (a.vezesTipico < 0.05) return `Hoje o dólar praticamente não se moveu (${pct(a.varPct)}).`;
  const vezes = a.vezesTipico >= 1.05 ? `${fmt(a.vezesTipico, 1)} vezes a oscilação típica` : `abaixo da oscilação típica`;
  return `Hoje o dólar ${dir} ${pct(a.varPct)}, ${vezes} dos últimos ${a.janela} dias úteis.`;
}

function blocoSignificado(a) {
  if (a.alerta) {
    return "Um movimento desse tamanho acontece poucas vezes por ano. Não diz para onde o dólar vai amanhã: diz apenas que o mercado reagiu a algo fora do habitual. Para quem tem gastos ou objetivos em dólar, é o momento de revisar se a proteção cambial da carteira está no tamanho certo, e não de agir por impulso.";
  }
  return "Oscilação dentro do padrão recente. Nada a fazer por causa do câmbio hoje. O acompanhamento diário serve para separar ruído de sinal: só os dias fora da faixa normal merecem atenção.";
}

// Ferramentas de proteção cambial: conteúdo EDUCACIONAL (o que é, para quem serve, ponto de atenção).
// Nunca citar produto, fundo, ticker ou emissor: isso viraria recomendação (CVM). A escolha concreta
// fica para a conversa com o assessor (botão abaixo do bloco).
export const FERRAMENTAS_PROTECAO = [
  {
    nome: "Fundos cambiais",
    oQue: "Fundos que acompanham a variação do dólar, aplicados em reais, com valores de entrada baixos e sem precisar de conta no exterior.",
    paraQuem: "Quem quer uma parcela do patrimônio atrelada ao dólar sem complicação operacional.",
    atencao: "Compare a taxa de administração: ela come parte da proteção. Não rendem juros americanos, só a variação da moeda.",
  },
  {
    nome: "ETFs e BDRs de ativos no exterior",
    oQue: "Cotas negociadas na bolsa brasileira, em reais, que replicam índices ou empresas de fora. O valor sobe quando o dólar sobe.",
    paraQuem: "Quem já investe em bolsa e quer diversificar fora do Brasil pela mesma conta.",
    atencao: "O risco é duplo: câmbio e a própria bolsa lá fora. Se o mercado americano cair, a proteção cambial pode não compensar.",
  },
  {
    nome: "Conta e investimentos no exterior",
    oQue: "Dinheiro em dólar de fato, numa conta internacional, aplicado em títulos do Tesouro americano, renda fixa ou fundos de lá.",
    paraQuem: "Quem tem objetivos em dólar de longo prazo (estudo dos filhos, aposentadoria, imóvel fora) e patrimônio para diversificar.",
    atencao: "Há IOF na remessa, regras próprias de Imposto de Renda e obrigação de declarar. Vale entender o custo total antes.",
  },
  {
    nome: "Compra programada de moeda",
    oQue: "Comprar dólar aos poucos, em parcelas mensais, numa conta global ou cartão multimoeda, até chegar ao valor de um gasto futuro.",
    paraQuem: "Quem tem uma despesa em dólar com data marcada, como viagem, intercâmbio ou compra no exterior.",
    atencao: "Dilui o preço médio, mas não acerta o melhor dia. Confira IOF e spread cobrados na conversão.",
  },
  {
    nome: "Ações de empresas exportadoras",
    oQue: "Empresas brasileiras que faturam em dólar (minério, celulose, proteína, petróleo) tendem a se beneficiar quando o real se desvaloriza.",
    paraQuem: "Quem investe em ações e quer uma proteção indireta dentro da bolsa local.",
    atencao: "A relação com o dólar é imperfeita: preço da commodity, gestão e dívida da empresa pesam tanto quanto o câmbio.",
  },
  {
    nome: "Contratos futuros e opções de dólar",
    oQue: "Instrumentos da B3 (inclusive o mini contrato de dólar) que travam ou limitam o preço da moeda numa data futura. É o hedge usado por empresas.",
    paraQuem: "Empresas com contas em dólar e investidores experientes que acompanham o mercado de perto.",
    atencao: "Exigem margem de garantia e ajustes diários. Usados sem estratégia, podem gerar perdas maiores do que a variação que se queria proteger.",
  },
];

/** Uma ferramenta por dia útil, em rodízio pela data (determinístico, sem estado). */
export function ferramentaDoDia(dataISO) {
  const dias = Math.floor(Date.parse(`${dataISO}T12:00:00Z`) / 86400000);
  if (!Number.isFinite(dias)) return FERRAMENTAS_PROTECAO[0];
  return FERRAMENTAS_PROTECAO[((dias % FERRAMENTAS_PROTECAO.length) + FERRAMENTAS_PROTECAO.length) % FERRAMENTAS_PROTECAO.length];
}

export function introProtecao(a) {
  if (a.alerta && a.varPct > 0) {
    return "Em dia de alta forte, a tentação é comprar dólar no susto, muitas vezes perto do pico. Proteção se monta com antecedência e aos poucos. Estas são as ferramentas mais usadas para isso:";
  }
  if (a.alerta && a.varPct < 0) {
    return "Queda forte do dólar costuma ser o momento mais barato para quem tem gastos ou objetivos em moeda estrangeira começar ou completar a proteção. Estas são as ferramentas mais usadas:";
  }
  return "Proteção cambial se constrói em dias calmos como hoje, não no susto. A cada dia útil, apresentamos uma das ferramentas disponíveis para o investidor brasileiro:";
}

function cartaoFerramenta(f) {
  const item = (rotulo, texto) => `<p style="margin:0 0 6px;font-size:15px;line-height:1.55;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#9a7a2e;">${rotulo}</span><br>${escapeHtml(texto)}</p>`;
  return `<div style="border-left:3px solid #d4a53c;background:#faf8f4;padding:12px 16px;margin:0 0 12px;">
      <p style="margin:0 0 8px;font-size:17px;font-weight:bold;">${escapeHtml(f.nome)}</p>
      ${item("O que é", f.oQue)}${item("Para quem faz sentido", f.paraQuem)}${item("Ponto de atenção", f.atencao)}
    </div>`;
}

export function blocoProtecao(a) {
  const lista = a.alerta ? FERRAMENTAS_PROTECAO : [ferramentaDoDia(a.data)];
  const titulo = a.alerta ? "Como se proteger da variação do dólar" : "Proteção cambial: ferramenta em foco";
  return `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9a7a2e;margin:22px 0 8px;">${titulo}</h2>
    <p style="margin:0 0 14px;">${escapeHtml(introProtecao(a))}</p>
    ${lista.map(cartaoFerramenta).join("\n    ")}
    <p style="margin:4px 0 18px;font-size:15px;">Regra prática para dimensionar: a parte do patrimônio exposta ao dólar deve acompanhar a parte dos seus gastos e objetivos em dólar. Qual ferramenta e em que tamanho depende do seu perfil, prazo e objetivos, e isso se decide numa conversa, não num e-mail.</p>`;
}

export function htmlMonitor(a, { unsubscribeUrl: unsub, nome, fonte }) {
  const saudacao = nome ? `Olá, ${escapeHtml(nome.split(" ")[0])}.` : "Olá.";
  const corVar = a.varPct > 0 ? "#b4542b" : a.varPct < 0 ? "#2f7a4a" : "#1c1b19";
  const selo = a.alerta
    ? `<span style="display:inline-block;background:#b4542b;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:4px 8px;border-radius:3px;">Alerta: fora do padrão</span>`
    : `<span style="display:inline-block;background:#e8e4dc;color:#6f6a62;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:4px 8px;border-radius:3px;">Dentro do padrão</span>`;
  const linha = (l, v) => `<tr><td style="padding:6px 0;color:#6f6a62;font-family:Arial,Helvetica,sans-serif;font-size:12px;">${l}</td><td align="right" style="padding:6px 0;font-size:14px;">${v}</td></tr>`;
  const ultimos = a.ultimos5.map((x) => `${ddmm(x.data)} ${fmt(x.close, 2)}`).join(" · ");
  const fonteTxt = fonte === "bcb" ? "PTAX de fechamento (venda), Banco Central do Brasil" : "Yahoo Finance (BRL=X), fallback por indisponibilidade da PTAX";
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(assunto(a))}</title>${EMAIL_HEAD_EXTRAS}</head>
<body style="margin:0;padding:0;background:#f4f2ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#1c1b19;">
  <tr><td style="background:#0b0b0b;padding:22px 28px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#d4a53c;">Monitor do Dólar · Saga Financeira · ${escapeHtml(dataExtenso(a.data))}</div>
    <div style="font-size:40px;color:#ffffff;margin-top:10px;line-height:1.1;">${brl(a.ptax)}</div>
    <div style="font-size:18px;margin-top:6px;color:${a.varPct >= 0 ? "#f0b25a" : "#8fd3a4"};">${pct(a.varPct)} no dia</div>
    <div style="margin-top:12px;">${selo}</div>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;font-size:16px;line-height:1.65;">
    <p style="margin:0 0 14px;">${saudacao}</p>
    <p style="margin:0 0 18px;font-size:18px;line-height:1.5;">${escapeHtml(fraseDoDia(a))}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e4dc;border-bottom:1px solid #e8e4dc;margin:0 0 18px;">
      ${linha("Fechamento anterior", brl(a.anterior))}
      ${linha("Variação do dia", `<span style="color:${corVar};">${pct(a.varPct)}</span>`)}
      ${linha("Média dos últimos 20 dias", brl(a.media20))}
      ${linha(`Faixa dos últimos ${a.janela} dias`, `${fmt(a.min60, 2)} a ${fmt(a.max60, 2)} (hoje em ${fmt(a.posicaoFaixa, 0)}% da faixa)`)}
      ${linha("Oscilação típica (1 desvio)", `${fmt(a.desvio60 * 100, 2)}% ao dia`)}
      ${linha("Z-score de hoje", `${sinal(a.z)}${fmt(Math.abs(a.z), 2)} (alerta a partir de ${fmt(a.zLimiar, 1)})`)}
      ${linha("Últimos 5 fechamentos", `<span style="font-size:12px;">${ultimos}</span>`)}
    </table>
    <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9a7a2e;margin:22px 0 8px;">O que isso significa</h2>
    <p style="margin:0 0 18px;">${escapeHtml(blocoSignificado(a))}</p>
    ${blocoProtecao(a)}
    <p style="margin:0 0 22px;"><a href="${WA_URL}" style="display:inline-block;background:#d4a53c;color:#0b0b0b;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:12px 18px;border-radius:4px;text-decoration:none;">Conversar com Rainiere sobre proteção em dólar</a></p>
    <p style="margin:0 0 18px;font-size:15px;"><strong>Rainiere Rocha</strong><br><span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#9a7a2e;">Assessor de investimentos · InvestSmart | XP</span></p>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6f6a62;">Fonte: ${escapeHtml(fonteTxt)}. Cálculo: variação diária (log) comparada à média e ao desvio-padrão dos ${a.janela} dias úteis anteriores.</p>
  </td></tr>
  ${rodapeLgpd({ unsubscribeUrl: unsub, aviso: "O Monitor do Dólar é um informativo educacional e automático; não é previsão nem recomendação de compra ou venda de moeda ou de qualquer ativo. " + AVISO_LEGAL })}
</table>
</td></tr></table>
</body></html>`;
}

// ---------------------------------------------------------------- 4. main

async function jaEnviouHoje(data) {
  const rows = await sbSelect("cambio_diario", `data=eq.${data}&select=data,enviado_at`);
  return rows.length > 0 && rows[0].enviado_at != null;
}

async function gravar(a, fonte, { enviadoAt, destinatarios }) {
  await sbInsert("cambio_diario", [{
    data: a.data, ptax: a.ptax.toFixed(4), var_pct: a.varPct.toFixed(4), z: a.z.toFixed(4),
    media60: a.media60.toFixed(6), desvio60: a.desvio60.toFixed(6), alerta: a.alerta, fonte,
    enviado_at: enviadoAt, destinatarios,
  }], { onConflict: "data" });
}

async function main() {
  const hoje = hojeISO();
  console.log(`Monitor do Dólar — ${hoje}${DRY_RUN ? " [DRY RUN]" : ""}${FORCE_RUN ? " [FORCE]" : ""}${TEST_TO ? ` [TEST_TO=${TEST_TO}]` : ""}`);

  const feriados = await carregarFeriados(path.join(__dirname, "feriados-b3.json"));
  const cal = diaDePregao(hoje, feriados);
  if (!cal.rodar && !FORCE_RUN) { console.log(`ℹ Sem pregão hoje (${cal.motivo}); nada a fazer.`); return; }

  const { serie, fonte } = await coletar(hoje);
  const a = analisar(serie);
  if (a.data !== hoje && !FORCE_RUN) fail(`Último fechamento disponível é ${a.data}, não ${hoje}. PTAX ainda não publicada? Rode mais tarde ou com FORCE_RUN.`);

  console.log(`  ${fonte.toUpperCase()} ${a.data}: ${brl(a.ptax)} (${pct(a.varPct)}) · z=${a.z.toFixed(2)} · desvio=${(a.desvio60 * 100).toFixed(2)}% · ${a.alerta ? "ALERTA" : "normal"}`);
  console.log(`  assunto: ${assunto(a)}`);

  if (!DRY_RUN && !FORCE_RUN && (await jaEnviouHoje(a.data))) { console.log("ℹ E-mail de hoje já enviado; nada a fazer."); return; }

  // Destinatários: assinantes ativos + dono (MAIL_OWNER). TEST_TO restringe a um endereço.
  let destinatarios;
  if (TEST_TO) {
    destinatarios = [{ email: TEST_TO, name: "Teste", unsubscribe_token: "teste" }];
  } else {
    destinatarios = await listarAssinantes();
    const owner = (process.env.MAIL_OWNER || "").trim().toLowerCase();
    if (owner && !destinatarios.some((s) => s.email.toLowerCase() === owner)) {
      destinatarios.push({ email: owner, name: "Rainiere", unsubscribe_token: "dono" });
    }
  }
  console.log(`  destinatários: ${destinatarios.length}`);

  const mensagens = destinatarios.map((s) => {
    const unsub = unsubscribeUrl(SITE_URL, s.unsubscribe_token);
    return { to: s.email, subject: assunto(a), unsubscribeUrl: unsub, html: htmlMonitor(a, { unsubscribeUrl: unsub, nome: s.name, fonte }) };
  });

  if (process.env.PREVIEW_HTML) {
    await writeFile(process.env.PREVIEW_HTML, htmlMonitor(a, { unsubscribeUrl: "#", nome: "Rainiere", fonte }), "utf8");
    console.log(`  preview salvo em ${process.env.PREVIEW_HTML}`);
  }
  if (DRY_RUN) { console.log("ℹ DRY RUN: nada gravado nem enviado."); return; }

  const { enviados, lotesComErro } = await enviarResend(mensagens, { canal: "monitor-dolar" });
  if (!TEST_TO) await gravar(a, fonte, { enviadoAt: enviados ? new Date().toISOString() : null, destinatarios: enviados });
  console.log(`✓ ${enviados} e-mails enviados${lotesComErro ? ` (${lotesComErro} lote(s) com erro)` : ""}.`);
  if (lotesComErro) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
}
