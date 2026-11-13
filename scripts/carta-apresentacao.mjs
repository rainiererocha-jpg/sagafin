// Carta de apresentação aos clientes da assessoria + cadastro no Diário Saga e no Monitor do Dólar.
//
// 1. Lê public.clientes (e-mail válido, sem opt-out) e cadastra em public.daily_subscribers,
//    ignorando quem já é assinante. Um cadastro vale para os dois e-mails diários.
// 2. Envia a carta APENAS a quem acabou de ser cadastrado (rodar de novo não repete a carta).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SITE_URL.
//      DRY_RUN=true  → só mostra as contagens; não grava nem envia.
//      TEST_TO=email → envia a carta só para esse endereço; não cadastra ninguém.
//      REENVIAR=true → reenvia a carta a todos os clientes que já são assinantes ativos (uso excepcional).
//      PREVIEW_HTML=caminho → salva o HTML da carta e sai (não precisa de nenhuma chave).
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fail, escapeHtml } from "./lib/util.mjs";
import { sbSelect, sbInsert } from "./lib/supabase.mjs";
import { AVISO_LEGAL, checarCompliance } from "./lib/compliance.mjs";
import { listarAssinantes, enviarResend, rodapeLgpd, unsubscribeUrl, cabecalhoEmail } from "./lib/email.mjs";
import { EMAIL_HEAD_EXTRAS, blocoOfertaFeeFixo } from "./mesalva-ad.mjs";

const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "true";
const REENVIAR = process.env.REENVIAR === "true";
const TEST_TO = (process.env.TEST_TO || "").trim();

const WA = "https://wa.me/5562994160930?text=";
const WA_CONVERSA = WA + encodeURIComponent("Olá, Rainiere. Recebi a sua carta da Saga Financeira e gostaria de marcar uma conversa.");
const WA_INDICACAO = WA + encodeURIComponent("Olá, Rainiere. Quero indicar uma pessoa para receber os conteúdos da Saga Financeira. Nome e e-mail: ");

export const ASSUNTO = "Uma cortesia da sua assessoria: os conteúdos da Saga Financeira";

// Serviços do site apresentados na carta. Só conteúdo educacional; nunca produto ou ativo (CVM 178).
export const SERVICOS = [
  { nome: "Diário Saga", onde: "No seu e-mail, dias úteis, por volta das 9h30", texto: "O resumo do mercado antes da abertura da bolsa: juros, bolsa, dólar e as notícias que importam, em leitura de poucos minutos." },
  { nome: "Monitor do Dólar", onde: "Dentro do Diário Saga, todo dia útil", texto: "O fechamento oficial do dólar, uma ferramenta de proteção cambial explicada a cada edição e um aviso à parte nos raros dias em que a oscilação foge do normal." },
  { nome: "Biblioteca", onde: "/biblioteca", texto: "E-books gratuitos para baixar, dos primeiros passos aos temas mais avançados." },
  { nome: "Blog", onde: "/blog", texto: "Artigos sobre investimentos, planejamento e economia, em linguagem direta." },
  { nome: "Diagnóstico de carteira", onde: "/diagnostico", texto: "Um questionário rápido que devolve uma leitura educativa da sua carteira, feita com apoio de inteligência artificial." },
  { nome: "Manual Pós-Eleições 2026", onde: "/pos-eleicoes", texto: "O que mudou nos juros depois das eleições e um roteiro de perguntas para revisar a carteira." },
  { nome: "Destaques de Trading", onde: "/trading", texto: "Estudos educacionais sobre o mercado americano e um manual para quem quer entender como se opera lá fora." },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Clientes → contatos únicos e válidos para cadastro: [{email, name}]. */
export function selecionarContatos(clientes) {
  const vistos = new Set();
  const out = [];
  for (const c of clientes) {
    const email = String(c.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || c.opt_out_at || vistos.has(email)) continue;
    vistos.add(email);
    out.push({ email, name: String(c.nome || "").trim() || null });
  }
  return out;
}

function botao(href, texto, { claro = false } = {}) {
  const cor = claro ? "background:#ffffff;color:#0b0b0b;border:1px solid #d4a53c;" : "background:#d4a53c;color:#0b0b0b;";
  return `<a href="${href}" style="display:inline-block;${cor}font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:13px;letter-spacing:.08em;text-transform:uppercase;padding:12px 18px;border-radius:4px;text-decoration:none;">${texto}</a>`;
}

function linhaServico(s) {
  const ehLink = s.onde.startsWith("/");
  const onde = ehLink
    ? `<a href="${SITE_URL}${s.onde}" style="color:#9a7a2e;">${SITE_URL.replace(/^https?:\/\//, "")}${s.onde}</a>`
    : escapeHtml(s.onde);
  return `<div style="border-left:3px solid #d4a53c;background:#faf8f4;padding:12px 16px;margin:0 0 10px;">
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">${escapeHtml(s.nome)}</p>
      <p style="margin:0 0 4px;font-size:15px;line-height:1.55;">${escapeHtml(s.texto)}</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6f6a62;">${onde}</p>
    </div>`;
}

export function htmlCarta({ nome, unsubscribeUrl: unsub }) {
  const primeiro = nome ? escapeHtml(String(nome).trim().split(/\s+/)[0]) : "";
  const saudacao = primeiro ? `Olá, ${primeiro}.` : "Olá.";
  const h2 = (t) => `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9a7a2e;margin:26px 0 10px;">${t}</h2>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(ASSUNTO)}</title>${EMAIL_HEAD_EXTRAS}</head>
<body style="margin:0;padding:0;background:#f4f2ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:#1c1b19;">
  ${cabecalhoEmail(`<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#d4a53c;">Saga Financeira · Carta aos clientes</div>
    <div style="font-size:24px;color:#ffffff;margin-top:10px;line-height:1.25;">Conteúdo para você decidir melhor, como cortesia da sua assessoria</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#cfc9bd;margin-top:10px;">Rainiere Rocha · seu assessor de investimentos</div>`)}
  <tr><td style="padding:26px 28px 8px;font-size:16px;line-height:1.65;">
    <p style="margin:0 0 14px;">${saudacao}</p>
    <p style="margin:0 0 14px;">Você é cliente da minha assessoria de investimentos, e quero que isso signifique mais do que a conversa que temos de tempos em tempos. Por isso criei a <strong>Saga Financeira</strong>: um conjunto de conteúdos educativos para acompanhar o mercado com calma e entender o que acontece com o seu dinheiro.</p>
    <p style="margin:0 0 6px;">Tudo abaixo está disponível para você, sem custo, como parte do serviço de assessoria.</p>
    ${h2("O que está à sua disposição")}
    ${SERVICOS.map(linhaServico).join("\n    ")}
    ${h2("O que muda no seu e-mail")}
    <p style="margin:0 0 14px;">A partir do próximo dia útil, você passa a receber o <strong>Diário Saga</strong>, um e-mail por dia útil, pela manhã, já com o Monitor do Dólar. É uma leitura curta e informativa. Se preferir não receber, basta <a href="${unsub}" style="color:#9a7a2e;">clicar aqui para cancelar</a>, a qualquer momento, sem precisar explicar.</p>
    ${h2("Um pedido")}
    <p style="margin:0 0 14px;">Se você conhece uma pessoa que gostaria de receber estes mesmos conteúdos, um familiar, um amigo ou um colega, eu teria prazer em enviá-los a ela também, como cortesia. Basta responder este e-mail com o nome e o e-mail dela, ou me avisar pelo WhatsApp.</p>
    <p style="margin:0 0 22px;">${botao(WA_INDICACAO, "Indicar uma pessoa", { claro: true })}</p>
    ${h2("Estou à disposição")}
    <p style="margin:0 0 14px;">Sempre que quiser entender melhor um assunto, tirar uma dúvida sobre o cenário ou rever os seus objetivos, conte comigo para uma conversa educativa, sem compromisso.</p>
    <p style="margin:0 0 22px;">${botao(WA_CONVERSA, "Marcar uma conversa")}</p>
    <p style="margin:0 0 18px;">Um abraço,</p>
    <p style="margin:0 0 18px;font-size:15px;"><strong>Rainiere Rocha</strong><br><span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#9a7a2e;">Assessor de investimentos · InvestSmart | XP</span></p>
  </td></tr>
  ${blocoOfertaFeeFixo("carta-apresentacao")}
  ${rodapeLgpd({ unsubscribeUrl: unsub, aviso: "Os conteúdos da Saga Financeira têm caráter exclusivamente educacional e informativo; não são recomendação de compra ou venda de qualquer ativo. " + AVISO_LEGAL })}
</table>
</td></tr></table>
</body></html>`;
}

function mensagem(dest) {
  const unsub = unsubscribeUrl(SITE_URL, dest.unsubscribe_token);
  return { to: dest.email, subject: ASSUNTO, unsubscribeUrl: unsub, html: htmlCarta({ nome: dest.name, unsubscribeUrl: unsub }) };
}

async function main() {
  console.log(`Carta de apresentação${DRY_RUN ? " [DRY RUN]" : ""}${REENVIAR ? " [REENVIAR]" : ""}${TEST_TO ? " [TEST_TO=definido]" : ""}`);

  const proibida = checarCompliance(htmlCarta({ nome: "Teste", unsubscribeUrl: "#" }));
  if (proibida) fail(`Carta reprovada no compliance: expressão vedada "${proibida}".`);

  if (process.env.PREVIEW_HTML) {
    await writeFile(process.env.PREVIEW_HTML, htmlCarta({ nome: "Rainiere", unsubscribeUrl: "#" }), "utf8");
    console.log(`  preview salvo em ${process.env.PREVIEW_HTML}`);
    return;
  }

  if (TEST_TO) {
    const r = await enviarResend([mensagem({ email: TEST_TO, name: "Rainiere", unsubscribe_token: "teste" })], { canal: "carta-apresentacao" });
    console.log(`✓ Teste: ${r.enviados} e-mail enviado; ninguém foi cadastrado.`);
    if (r.lotesComErro) fail("Falha no envio de teste.");
    return;
  }

  const clientes = await sbSelect("clientes", "select=nome,email,opt_out_at&order=created_at.asc");
  const contatos = selecionarContatos(clientes);
  const assinantes = await sbSelect("daily_subscribers", "select=email,status");
  const jaExistem = new Set(assinantes.map((s) => String(s.email).toLowerCase()));
  const novos = contatos.filter((c) => !jaExistem.has(c.email));
  console.log(`  clientes: ${clientes.length} · contatos válidos: ${contatos.length} · já assinantes: ${contatos.length - novos.length} · a cadastrar: ${novos.length}`);

  if (DRY_RUN) { console.log("ℹ DRY RUN: nada gravado nem enviado."); return; }

  let destinatarios;
  if (REENVIAR) {
    const emails = new Set(contatos.map((c) => c.email));
    destinatarios = (await listarAssinantes()).filter((s) => emails.has(String(s.email).toLowerCase()));
  } else {
    if (!novos.length) { console.log("ℹ Ninguém novo para cadastrar; nenhuma carta enviada."); return; }
    destinatarios = await sbInsert("daily_subscribers", novos, { onConflict: "email", ignoreDuplicates: true });
    console.log(`✓ ${destinatarios.length} contatos cadastrados no Diário Saga e no Monitor do Dólar.`);
  }

  const r = await enviarResend(destinatarios.map(mensagem), { canal: "carta-apresentacao" });
  console.log(`✓ ${r.enviados} cartas enviadas de ${destinatarios.length}.`);
  if (r.lotesComErro) fail(`${r.lotesComErro} lote(s) de carta com erro. Os contatos já estão cadastrados; use REENVIAR=true para repetir a carta.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => fail(e.stack || String(e)));
}
