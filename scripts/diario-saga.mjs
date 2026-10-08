// Diário Saga — geração, publicação e envio da análise diária de mercado.
// Roda no GitHub Actions (.github/workflows/diario-saga.yml), nunca nesta máquina com chaves.
//
// Variáveis de ambiente (secrets do GitHub):
//   ANTHROPIC_API_KEY, RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Opcionais: SITE_URL (default https://sagafin.com.br), FORCE_RUN=true (ignora fim de
// semana/feriado e post já existente), DRY_RUN=true (gera o texto, não publica nem envia).

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const FORCE_RUN = process.env.FORCE_RUN === "true";
const DRY_RUN = process.env.DRY_RUN === "true";
const MODEL = "claude-sonnet-5-5";
const MIN_WORDS = 200;
// Remetente no domínio mesalva.app (verificado no Resend); sobrescrevível por env.
const FROM = process.env.MAIL_FROM || "Rainiere Rocha · Saga Financeira <diario@mesalva.app>";
const REPLY_TO = process.env.MAIL_REPLY_TO || "contato@sagafin.com.br";

const RSS_FEEDS = [
  { nome: "InfoMoney", url: "https://www.infomoney.com.br/feed/" },
  { nome: "Agência Brasil (Economia)", url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml" },
  { nome: "Valor Econômico", url: "https://valor.globo.com/rss/" },
];

const AVISO_LEGAL =
  "Rainiere Rocha é assessor de investimentos vinculado à Invest Smart Assessor de Investimento Ltda., inscrita sob o CNPJ nº 19.438.577/0001-08, empresa de Assessoria de Investimento devidamente registrada na Comissão de Valores Mobiliários na forma da Resolução CVM 178/23, que mantém contrato de distribuição de produtos financeiros com a XP Investimentos Corretora de Câmbio, Títulos e Valores Mobiliários S.A. (\"XP\") e pode, por conta e ordem dos seus clientes, operar no mercado de capitais segundo a legislação vigente. Na forma da legislação da CVM, o Assessor de Investimento não pode administrar ou gerir o patrimônio de investidores. O Diário Saga é um informativo de caráter meramente educacional e informativo, elaborado com apoio de inteligência artificial a partir de dados públicos (Banco Central do Brasil, B3 e agências de notícias); não constitui e não deve ser interpretado como oferta, solicitação de compra ou venda ou recomendação de qualquer ativo financeiro, nem como relatório de análise (Resolução CVM 20) ou consultoria de valores mobiliários. O investimento em ações é um investimento de risco e rentabilidade passada não é garantia de rentabilidade futura. Na realização de operações com derivativos existe a possibilidade de perdas superiores aos valores investidos, podendo resultar em significativas perdas patrimoniais. Antes de investir, verifique a adequação dos produtos ao seu perfil de investidor. Para informações e dúvidas sobre produtos, contate seu assessor de investimentos. Para reclamações, contate a Ouvidoria da XP pelo telefone 0800 722 3730.";

// ---------------------------------------------------------------- utilitários

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function env(name) {
  const v = process.env[name];
  if (!v) fail(`Variável ${name} não configurada.`);
  return v;
}

function hojeISO() {
  // TZ=America/Sao_Paulo está definido no workflow; mesmo assim formata explicitamente.
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

function dataExtenso(iso) {
  const d = new Date(`${iso}T12:00:00-03:00`);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function ddmm(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

async function fetchJson(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* não é JSON */ }
    return { ok: r.ok, status: r.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function contarPalavras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n, dec = 2) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/d";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtVar(ch) {
  if (typeof ch !== "number" || !Number.isFinite(ch)) return "";
  const sinal = ch > 0 ? "+" : "";
  return ` (${sinal}${fmt(ch)}%)`;
}

// ---------------------------------------------------------------- 1. calendário

async function deveRodar(hoje) {
  const dow = new Date(`${hoje}T12:00:00-03:00`).getUTCDay();
  if (dow === 0 || dow === 6) return { rodar: false, motivo: "fim de semana" };
  const feriados = JSON.parse(await readFile(path.join(__dirname, "feriados-b3.json"), "utf8"));
  const ano = hoje.slice(0, 4);
  if (!feriados[ano]) console.warn(`⚠ scripts/feriados-b3.json não tem o ano ${ano}; atualize a lista.`);
  if ((feriados[ano] || []).includes(hoje)) return { rodar: false, motivo: "feriado B3" };
  return { rodar: true };
}

// ---------------------------------------------------------------- 2. coleta

async function coletarCotacoes() {
  const r = await fetchJson(`${SITE_URL}/api/quotes`);
  if (!r.ok || !r.json?.quotes) {
    fail(`Falha ao buscar ${SITE_URL}/api/quotes (HTTP ${r.status}). Abortando sem publicar.`);
  }
  const q = r.json.quotes;
  const obrigatorias = ["IBOV", "USD/BRL", "SELIC"];
  const faltando = obrigatorias.filter((k) => !q[k] || typeof q[k].value !== "number");
  if (faltando.length) fail(`Cotações essenciais indisponíveis: ${faltando.join(", ")}. Abortando.`);
  return q;
}

function linhasCotacoes(q) {
  const l = [];
  const add = (label, key, dec = 2, prefixo = "", sufixo = "") => {
    if (q[key]) l.push(`- ${label}: ${prefixo}${fmt(q[key].value, dec)}${sufixo}${fmtVar(q[key].change)}`);
  };
  add("Ibovespa", "IBOV", 0, "", " pontos");
  add("Dólar (USD/BRL)", "USD/BRL", 2, "R$ ");
  add("Euro (EUR/BRL)", "EUR/BRL", 2, "R$ ");
  add("Ouro (XAU/USD)", "XAU", 2, "US$ ");
  add("PETR4", "PETR4", 2, "R$ ");
  add("VALE3", "VALE3", 2, "R$ ");
  add("ITUB4", "ITUB4", 2, "R$ ");
  add("BBDC4", "BBDC4", 2, "R$ ");
  add("Selic (meta)", "SELIC", 2, "", "% a.a.");
  add("CDI", "CDI", 2, "", "% a.a.");
  add("IPCA (último mês)", "IPCA", 2, "", "%");
  return l.join("\n");
}

function parseRss(xml, max = 8) {
  const itens = [];
  const re = /<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) && itens.length < max) {
    const item = m[0];
    const pick = (tag) => {
      const mm = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      if (!mm) return "";
      return stripHtml(mm[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    };
    const titulo = pick("title");
    if (!titulo) continue;
    const desc = pick("description").slice(0, 220);
    itens.push(desc ? `${titulo} — ${desc}` : titulo);
  }
  return itens;
}

async function coletarNoticias() {
  const blocos = [];
  for (const feed of RSS_FEEDS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(feed.url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DiarioSaga/1.0; +https://sagafin.com.br)" },
      });
      clearTimeout(t);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const itens = parseRss(await r.text());
      if (itens.length) blocos.push(`### ${feed.nome}\n${itens.map((i) => `- ${i}`).join("\n")}`);
      console.log(`✓ ${feed.nome}: ${itens.length} manchetes`);
    } catch (e) {
      console.warn(`⚠ ${feed.nome} indisponível: ${e.message}`);
    }
  }
  return blocos.join("\n\n") || "(nenhuma manchete disponível hoje)";
}

async function proximosEventos(hoje) {
  let agenda = {};
  try {
    agenda = JSON.parse(await readFile(path.join(__dirname, `agenda-${hoje.slice(0, 4)}.json`), "utf8"));
  } catch {
    return "(agenda fixa não disponível para este ano)";
  }
  const prox = (lista = []) => lista.find((d) => d >= hoje);
  const l = [];
  const copom = prox(agenda.copom);
  const fomc = prox(agenda.fomc);
  if (copom) l.push(`- Próxima decisão do Copom (Selic): ${copom.split("-").reverse().join("/")}${copom === hoje ? " (HOJE)" : ""}`);
  if (fomc) l.push(`- Próxima decisão do Fed (FOMC): ${fomc.split("-").reverse().join("/")}${fomc === hoje ? " (HOJE)" : ""}`);
  return l.join("\n") || "(sem eventos fixos cadastrados)";
}

// ---------------------------------------------------------------- 3. geração

function montarPrompt({ hoje, cotacoes, noticias, agenda }) {
  return `Você escreve o "Diário Saga", informativo matinal de mercado publicado por Rainiere Rocha, assessor de investimentos vinculado à InvestSmart (escritório credenciado à XP), no site Saga Financeira (sagafin.com.br). O texto é enviado por e-mail aos leitores antes das 9h.

DATA DE HOJE: ${dataExtenso(hoje)}

COTAÇÕES (fechamento/último dado disponível; a variação entre parênteses é do dia anterior):
${cotacoes}

MANCHETES RECENTES (fonte: RSS público; use só o que for relevante para mercado/economia):
${noticias}

AGENDA FIXA:
${agenda}

REGRAS DE COMPLIANCE (obrigatórias, Resolução CVM 178/23 e CVM 20):
- Caráter exclusivamente educacional e informativo. NUNCA recomende comprar, vender ou manter qualquer ativo, fundo, título ou produto específico. Não use "compre", "venda", "oportunidade em PETR4", "vale a pena entrar", etc.
- Pode citar índices, moedas, juros, inflação e ações só para descrever o que aconteceu (fatos e números do contexto acima). Não invente números: se não estiver no contexto, não cite.
- Não faça previsões de preço-alvo. Expectativas só se atribuídas ("o mercado espera", "segundo as manchetes").
- Não prometa rentabilidade. Linguagem equilibrada, sem sensacionalismo.
- Não mencione produtos de bancos/corretoras pelo nome comercial.

ESTILO: português do Brasil, claro, direto, tom de um assessor experiente conversando com o leitor pessoa física. Entre 350 e 450 palavras no total. Frases curtas. Sem emojis. Sem markdown.

FORMATO DE SAÍDA: responda SOMENTE com um JSON válido (sem crases, sem texto antes ou depois) no formato:
{
  "titulo": "título curto e informativo, até 70 caracteres, sem a palavra 'Diário'",
  "resumo": "uma frase de até 160 caracteres resumindo o dia (vira a chamada do e-mail e do blog)",
  "html": "<h2>Resumo do dia</h2><p>...</p><h2>Brasil</h2><p>...</p><h2>Exterior</h2><p>...</p><h2>Agenda</h2><p>...</p><h2>O que isso muda para você</h2><p>...</p>"
}
No campo "html" use apenas as tags <h2>, <p>, <ul>, <li>, <strong>. Os cinco títulos <h2> devem ser exatamente: "Resumo do dia", "Brasil", "Exterior", "Agenda", "O que isso muda para você". A última seção deve trazer reflexões gerais de educação financeira (diversificação, horizonte, perfil de risco), nunca instruções sobre ativos específicos.`;
}

function extrairJson(texto) {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(limpo); } catch { /* tenta recortar */ }
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (ini >= 0 && fim > ini) {
    try { return JSON.parse(limpo.slice(ini, fim + 1)); } catch { /* cai no erro abaixo */ }
  }
  return null;
}

async function gerarTexto(prompt) {
  const r = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": env("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    },
    90000
  );
  if (!r.ok) fail(`Anthropic API HTTP ${r.status}: ${r.text.slice(0, 500)}`);
  const texto = r.json?.content?.map((c) => c.text || "").join("") || "";
  const out = extrairJson(texto);
  if (!out || !out.titulo || !out.html) fail(`Resposta do modelo fora do formato esperado:\n${texto.slice(0, 800)}`);

  const TAGS_OK = /^<\/?(h2|p|ul|li|strong|em|br)\b[^>]*>$/i;
  const tagsEstranhas = (out.html.match(/<[^>]+>/g) || []).filter((t) => !TAGS_OK.test(t));
  if (tagsEstranhas.length) fail(`HTML contém tags não permitidas: ${[...new Set(tagsEstranhas)].slice(0, 5).join(" ")}`);

  const PROIBIDAS = /\b(compre|venda agora|recomendo comprar|recomendamos comprar|recomendo vender|preço-alvo|preço alvo|garantido|rentabilidade garantida)\b/i;
  const m = stripHtml(out.html).match(PROIBIDAS);
  if (m) fail(`Texto contém expressão vedada pelo compliance: "${m[0]}". Abortando sem publicar.`);

  const palavras = contarPalavras(stripHtml(out.html));
  if (palavras < MIN_WORDS) fail(`Texto muito curto (${palavras} palavras < ${MIN_WORDS}). Abortando sem publicar.`);
  console.log(`✓ Texto gerado: "${out.titulo}" (${palavras} palavras)`);
  return {
    titulo: String(out.titulo).trim().slice(0, 120),
    resumo: String(out.resumo || "").trim().slice(0, 200),
    html: out.html.trim(),
    palavras,
  };
}

// ---------------------------------------------------------------- 4. Supabase

function sbHeaders(extra = {}) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

async function postJaExiste(slug) {
  const r = await fetchJson(`${env("SUPABASE_URL")}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=id`, {
    headers: sbHeaders(),
  });
  if (!r.ok) fail(`Supabase (posts select) HTTP ${r.status}: ${r.text.slice(0, 300)}`);
  return Array.isArray(r.json) && r.json.length > 0;
}

function rodapePost() {
  return `<hr /><p><em>O Diário Saga é produzido todos os dias úteis com apoio de inteligência artificial a partir de dados públicos e revisado sob responsabilidade de Rainiere Rocha · InvestSmart | XP. Conteúdo educacional; não é recomendação de investimento.</em></p><p style="font-size:12px;opacity:.7">${escapeHtml(AVISO_LEGAL)}</p>`;
}

async function publicarPost({ hoje, slug, texto }) {
  const minutos = Math.max(2, Math.round(texto.palavras / 180));
  const body = {
    slug,
    titulo: texto.titulo,
    resumo: texto.resumo,
    conteudo_html: `${texto.html}\n${rodapePost()}`,
    data_publicacao: hoje,
    tempo_leitura: `${minutos} min`,
    tags: ["diario-saga"],
    destaque: false,
    status: "published",
    autor: "Rainiere Rocha",
  };
  const r = await fetchJson(`${env("SUPABASE_URL")}/rest/v1/posts`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "resolution=ignore-duplicates,return=representation" }),
    body: JSON.stringify(body),
  });
  if (!r.ok) fail(`Supabase (posts insert) HTTP ${r.status}: ${r.text.slice(0, 500)}`);
  console.log(`✓ Post publicado: ${SITE_URL}/blog/${slug}`);
}

async function listarAssinantes() {
  const url = env("SUPABASE_URL");
  const todos = [];
  const pagina = 1000;
  for (let from = 0; ; from += pagina) {
    const r = await fetchJson(
      `${url}/rest/v1/daily_subscribers?status=eq.active&select=email,name,unsubscribe_token&order=created_at.asc`,
      { headers: sbHeaders({ Range: `${from}-${from + pagina - 1}` }) }
    );
    if (!r.ok && r.status !== 416) fail(`Supabase (daily_subscribers) HTTP ${r.status}: ${r.text.slice(0, 300)}`);
    const lote = Array.isArray(r.json) ? r.json : [];
    todos.push(...lote);
    if (lote.length < pagina) break;
  }
  return todos;
}

// ---------------------------------------------------------------- 5. Resend

function htmlEmail({ hoje, slug, texto, unsubscribeUrl, nome }) {
  const saudacao = nome ? `Bom dia, ${escapeHtml(nome.split(" ")[0])}.` : "Bom dia.";
  const postUrl = `${SITE_URL}/blog/${slug}`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(texto.titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#1c1b19;">
  <tr><td style="background:#0b0b0b;padding:22px 28px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#d4a53c;">Diário Saga · ${escapeHtml(dataExtenso(hoje))}</div>
    <div style="font-size:22px;color:#ffffff;margin-top:8px;line-height:1.3;">${escapeHtml(texto.titulo)}</div>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;font-size:16px;line-height:1.65;">
    <p style="margin:0 0 14px;">${saudacao}</p>
    <style>
      .ds h2{font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9a7a2e;margin:22px 0 8px;}
      .ds p{margin:0 0 14px;} .ds ul{margin:0 0 14px 20px;padding:0;} .ds li{margin:0 0 6px;}
    </style>
    <div class="ds">${texto.html}</div>
    <p style="margin:22px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;"><a href="${postUrl}" style="color:#9a7a2e;">Ler no site →</a></p>
    <p style="margin:0 0 18px;font-size:15px;">Bom dia e bons investimentos,<br><strong>Rainiere Rocha</strong><br><span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#9a7a2e;">Assessor de investimentos · InvestSmart | XP</span></p>
  </td></tr>
  <tr><td style="padding:16px 28px 24px;border-top:1px solid #e8e4dc;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#6f6a62;">
    <p style="margin:0 0 10px;"><strong>Aviso legal.</strong> ${escapeHtml(AVISO_LEGAL)}</p>
    <p style="margin:0;">Você recebe este e-mail porque se cadastrou em sagafin.com.br; seus dados são usados apenas para este envio (LGPD). Para cancelar, <a href="${unsubscribeUrl}" style="color:#9a7a2e;">clique aqui</a>.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function enviarEmails({ hoje, slug, texto, assinantes }) {
  if (!assinantes.length) {
    console.log("ℹ Nenhum assinante ativo; e-mail não enviado.");
    return { enviados: 0, lotesComErro: 0 };
  }
  const apiKey = env("RESEND_API_KEY");
  const assunto = `Diário Saga · ${ddmm(hoje)} — ${texto.titulo}`;
  let enviados = 0;
  let lotesComErro = 0;
  for (let i = 0; i < assinantes.length; i += 100) {
    const lote = assinantes.slice(i, i + 100).map((s) => {
      const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${s.unsubscribe_token}`;
      return {
        from: FROM,
        to: [s.email],
        reply_to: REPLY_TO,
        subject: assunto,
        html: htmlEmail({ hoje, slug, texto, unsubscribeUrl, nome: s.name }),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [{ name: "canal", value: "diario-saga" }],
      };
    });
    const r = await fetchJson("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(lote),
    }, 60000);
    if (!r.ok) {
      lotesComErro++;
      console.error(`✖ Resend lote ${i / 100 + 1}: HTTP ${r.status} ${r.text.slice(0, 300)}`);
      continue;
    }
    enviados += lote.length;
    console.log(`✓ Resend lote ${i / 100 + 1}: ${lote.length} e-mails aceitos`);
  }
  return { enviados, lotesComErro };
}

// ---------------------------------------------------------------- main

async function main() {
  const hoje = hojeISO();
  const slug = `diario-saga-${hoje}`;
  console.log(`Diário Saga — ${hoje} (${slug})${DRY_RUN ? " [DRY RUN]" : ""}${FORCE_RUN ? " [FORCE]" : ""}`);

  const cal = await deveRodar(hoje);
  if (!cal.rodar && !FORCE_RUN) {
    console.log(`ℹ Sem pregão hoje (${cal.motivo}); nada a fazer.`);
    return;
  }

  if (!DRY_RUN && !FORCE_RUN && (await postJaExiste(slug))) {
    console.log("ℹ Post de hoje já existe; execução anterior concluiu. Nada a fazer.");
    return;
  }

  const quotes = await coletarCotacoes();
  const cotacoes = linhasCotacoes(quotes);
  console.log(`✓ Cotações:\n${cotacoes}`);
  const [noticias, agenda] = await Promise.all([coletarNoticias(), proximosEventos(hoje)]);

  const texto = await gerarTexto(montarPrompt({ hoje, cotacoes, noticias, agenda }));

  if (DRY_RUN) {
    console.log("\n--- TÍTULO ---\n" + texto.titulo + "\n--- RESUMO ---\n" + texto.resumo + "\n--- HTML ---\n" + texto.html);
    console.log("\nℹ DRY RUN: nada publicado nem enviado.");
    return;
  }

  await publicarPost({ hoje, slug, texto });
  const assinantes = await listarAssinantes();
  console.log(`✓ Assinantes ativos: ${assinantes.length}`);
  const { enviados, lotesComErro } = await enviarEmails({ hoje, slug, texto, assinantes });
  console.log(`\nConcluído: post publicado, ${enviados} e-mails aceitos pelo Resend.`);
  if (lotesComErro) fail(`${lotesComErro} lote(s) de e-mail falharam (post já está publicado).`);
}

main().catch((e) => fail(e?.stack || String(e)));
