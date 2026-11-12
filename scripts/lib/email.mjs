// Envio de e-mail compartilhado (Diário Saga, Monitor do Dólar): assinantes + Resend em lotes + rodapé LGPD.
import { env, fetchJson, fail, escapeHtml } from "./util.mjs";
import { sbHeaders } from "./supabase.mjs";
import { AVISO_LEGAL } from "./compliance.mjs";

export const MAIL_FROM = process.env.MAIL_FROM || "Rainiere Rocha · Saga Financeira <diario@mesalva.app>";
export const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || "contato@sagafin.com.br";

/** Assinantes ativos do Diário Saga (paginado). */
export async function listarAssinantes() {
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

export function unsubscribeUrl(siteUrl, token) {
  return `${siteUrl}/api/unsubscribe?token=${token}`;
}

/** Rodapé padrão: aviso legal + LGPD + descadastro. */
export function rodapeLgpd({ unsubscribeUrl: url, aviso = AVISO_LEGAL }) {
  return `<tr><td style="padding:16px 28px 24px;border-top:1px solid #e8e4dc;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#6f6a62;">
    <p style="margin:0 0 10px;"><strong>Aviso legal.</strong> ${escapeHtml(aviso)}</p>
    <p style="margin:0;">Você recebe este e-mail porque se cadastrou em sagafin.com.br; seus dados são usados apenas para este envio (LGPD). Para cancelar, <a href="${url}" style="color:#9a7a2e;">clique aqui</a>.</p>
  </td></tr>`;
}

/**
 * Envia pelo Resend em lotes de 100. `mensagens` = [{to, subject, html, unsubscribeUrl?}].
 * Devolve { enviados, lotesComErro }.
 */
export async function enviarResend(mensagens, { canal, from = MAIL_FROM, replyTo = MAIL_REPLY_TO } = {}) {
  if (!mensagens.length) {
    console.log("ℹ Nenhum destinatário; e-mail não enviado.");
    return { enviados: 0, lotesComErro: 0 };
  }
  const apiKey = env("RESEND_API_KEY");
  let enviados = 0;
  let lotesComErro = 0;
  for (let i = 0; i < mensagens.length; i += 100) {
    const lote = mensagens.slice(i, i + 100).map((m) => ({
      from,
      to: [m.to],
      reply_to: replyTo,
      subject: m.subject,
      html: m.html,
      ...(m.unsubscribeUrl
        ? { headers: { "List-Unsubscribe": `<${m.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
        : {}),
      ...(canal ? { tags: [{ name: "canal", value: canal }] } : {}),
    }));
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
