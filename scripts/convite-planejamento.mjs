// Convite do Planejamento Financeiro aos clientes da assessoria (envio único, com link pessoal para o formulário).
//
// Lê public.planejamento_convites (enviado_em nulo), pega o token de descadastro em daily_subscribers
// (quem não tem assinatura ativa não recebe: sem link de descadastro não se envia) e envia pelo Resend.
// Não cadastra ninguém em lugar nenhum.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SITE_URL.
//      DRY_RUN=true  → só mostra as contagens.
//      TEST_TO=email → envia o convite só para esse endereço (link de teste; não grava nada).
//      PREVIEW_HTML=caminho → salva o HTML e sai (não precisa de chave).
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fail, escapeHtml } from "./lib/util.mjs";
import { sbSelect, sbUpdate } from "./lib/supabase.mjs";
import { AVISO_LEGAL, checarCompliance } from "./lib/compliance.mjs";
import { enviarResend, rodapeLgpd, unsubscribeUrl, cabecalhoEmail } from "./lib/email.mjs";

const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "true";
const TEST_TO = (process.env.TEST_TO || "").trim();
const TETO = Number(process.env.TETO || 120);

export const ASSUNTO = "Seu Planejamento Financeiro, uma cortesia da sua assessoria";

const WA = "https://wa.me/5562994160930?text=" + encodeURIComponent("Olá, Rainiere. Recebi o convite do Planejamento Financeiro e tenho uma dúvida.");

function paragrafo(t) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2b2823;">${t}</p>`;
}

export function htmlConvite({ nome, linkFormulario, unsubscribeUrl: unsub }) {
  const primeiro = escapeHtml(String(nome || "").trim().split(/\s+/)[0] || "");
  const saudacao = primeiro ? `Olá, ${primeiro}.` : "Olá.";
  const itens = [
    "Um retrato claro de onde você está: o que entra, o que sai e o que você já construiu.",
    "Metas com valor e prazo: reserva de emergência, aposentadoria, a casa, os estudos, a viagem.",
    "Quanto guardar por mês para chegar lá e o que merece atenção primeiro.",
    "Um relatório que fica com você e que revisamos todo ano.",
  ].map((t) => `<li style="margin:0 0 8px;">${t}</li>`).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(ASSUNTO)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f1ea"><tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
${cabecalhoEmail(`<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d8b25a;">Saga Financeira</p><p style="margin:0;font-size:22px;line-height:1.25;color:#ffffff;font-family:Georgia,serif;">Um presente para quem é cliente da assessoria</p>`)}
<tr><td style="padding:26px 28px 6px;">
${paragrafo(saudacao)}
${paragrafo("Preparei para você, sem custo, o seu <strong>Planejamento Financeiro</strong>. É o documento que transforma o que você ganha, gasta e investe em um plano com metas, valores e prazos.")}
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:#2b2823;">${itens}</ul>
${paragrafo("Para quem contrata esse trabalho de forma independente, sites de orçamento indicam valores entre R$ 300 e R$ 2.500 por um planejamento pontual, com muita variação conforme a complexidade. Como cliente da minha assessoria, você recebe o seu como cortesia.")}
${paragrafo("Para finalizar, preciso conhecer alguns pontos que só você sabe: família, renda e despesas aproximadas, bens e objetivos. São cerca de 10 minutos, e você escolhe o que responder.")}
</td></tr>
<tr><td align="center" style="padding:6px 28px 22px;">
<a href="${linkFormulario}" style="display:inline-block;background:#0b0b0b;color:#f4e3b0;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:1px;padding:14px 30px;border-radius:2px;">Preencher agora</a>
</td></tr>
<tr><td style="padding:0 28px 18px;">
${paragrafo("Suas respostas ficam protegidas e são usadas apenas para montar o seu planejamento. Não pedimos CPF, senhas nem documentos. Se preferir conversar, é só responder este e-mail ou <a href=\"" + WA + "\" style=\"color:#9a7a2e;\">falar comigo pelo WhatsApp</a>.")}
${paragrafo("Um abraço,<br><strong>Rainiere Rocha</strong><br><span style=\"font-size:13px;color:#6f6a62;\">Assessor de investimentos</span>")}
</td></tr>
${rodapeLgpd({ unsubscribeUrl: unsub, aviso: AVISO_LEGAL })}
</table></td></tr></table></body></html>`;
}

function mensagem(dest) {
  const unsub = unsubscribeUrl(SITE_URL, dest.unsubscribe_token);
  return {
    to: dest.email,
    subject: ASSUNTO,
    unsubscribeUrl: unsub,
    html: htmlConvite({ nome: dest.nome, linkFormulario: `${SITE_URL}/planejamento?t=${dest.token}`, unsubscribeUrl: unsub }),
  };
}

async function main() {
  console.log(`Convite do Planejamento${DRY_RUN ? " [DRY RUN]" : ""}${TEST_TO ? " [TEST_TO=definido]" : ""}`);

  const proibida = checarCompliance(htmlConvite({ nome: "Teste", linkFormulario: "#", unsubscribeUrl: "#" }));
  if (proibida) fail(`Convite reprovado no compliance: expressão vedada "${proibida}".`);

  if (process.env.PREVIEW_HTML) {
    await writeFile(process.env.PREVIEW_HTML, htmlConvite({ nome: "Rainiere", linkFormulario: `${SITE_URL}/planejamento?t=exemplo`, unsubscribeUrl: "#" }), "utf8");
    console.log(`  preview salvo em ${process.env.PREVIEW_HTML}`);
    return;
  }

  if (TEST_TO) {
    const r = await enviarResend([mensagem({ email: TEST_TO, nome: "Rainiere", token: "teste", unsubscribe_token: "teste" })], { canal: "convite-planejamento" });
    console.log(`✓ Teste: ${r.enviados} e-mail enviado; nada foi gravado.`);
    if (r.lotesComErro) fail("Falha no envio de teste.");
    return;
  }

  const convites = await sbSelect("planejamento_convites", "select=token,conta,email&enviado_em=is.null&order=created_at.asc");
  const assinantes = await sbSelect("daily_subscribers", "select=email,name,unsubscribe_token&status=eq.active");
  const porEmail = new Map(assinantes.map((s) => [String(s.email).toLowerCase(), s]));
  const clientes = await sbSelect("clientes", "select=email,opt_out_at");
  const optOut = new Set(clientes.filter((c) => c.opt_out_at).map((c) => String(c.email).toLowerCase()));

  const alvos = [];
  let semAssinatura = 0, comOptOut = 0;
  for (const c of convites) {
    const email = String(c.email).toLowerCase();
    if (optOut.has(email)) { comOptOut++; continue; }
    const s = porEmail.get(email);
    if (!s) { semAssinatura++; continue; }
    alvos.push({ ...c, email, nome: s.name, unsubscribe_token: s.unsubscribe_token });
  }
  console.log(`  convites pendentes: ${convites.length} · a enviar: ${alvos.length} · sem assinatura ativa: ${semAssinatura} · com opt-out: ${comOptOut}`);
  if (alvos.length > TETO) fail(`Mais destinatários (${alvos.length}) que o teto de segurança (${TETO}). Aumente TETO conscientemente.`);
  if (DRY_RUN) { console.log("ℹ DRY RUN: nada enviado."); return; }
  if (!alvos.length) { console.log("ℹ Nenhum convite a enviar."); return; }

  const r = await enviarResend(alvos.map(mensagem), { canal: "convite-planejamento" });
  console.log(`✓ ${r.enviados} convites enviados de ${alvos.length}.`);
  if (r.lotesComErro) fail(`${r.lotesComErro} lote(s) com erro. Nenhum convite foi marcado como enviado; confira antes de repetir.`);
  const agora = new Date().toISOString();
  for (const a of alvos) await sbUpdate("planejamento_convites", `token=eq.${a.token}`, { enviado_em: agora });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => fail(e.stack || String(e)));
}
