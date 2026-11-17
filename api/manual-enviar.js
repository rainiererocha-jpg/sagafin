// POST /api/manual-enviar  { email, nome }
// Envia o Manual Completo do Investidor por e-mail logo depois do cadastro em /manual.
// Anti-abuso: só envia se existir um lead `manual-investidor` com esse e-mail criado nos últimos 30 min
// e ainda sem `manual_enviado_at` (um envio por cadastro). Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.

const SITE = "https://sagafin.com.br";
const PDF = `${SITE}/ebooks/manual-completo-investidor.pdf`;
const FROM = process.env.MAIL_FROM || "Rainiere Rocha · Saga Financeira <diario@mesalva.app>";
const REPLY_TO = process.env.MAIL_REPLY_TO || "contato@sagafin.com.br";
const WHATS = "5562994160930";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function htmlManual(nome) {
  const primeiro = esc(String(nome || "").trim().split(/\s+/)[0] || "");
  const wa = `https://wa.me/${WHATS}?text=${encodeURIComponent("Olá, Rainiere! Recebi o Manual Completo do Investidor e quero o diagnóstico da minha carteira.")}`;
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1d1b16;">
<tr><td bgcolor="#0b0b0b" style="background:#0b0b0b;padding:26px 28px;">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a53c;">Saga Financeira</div>
  <div style="font-family:Georgia,serif;font-size:26px;color:#fff;margin-top:8px;">Seu Manual Completo do Investidor</div>
</td></tr>
<tr><td style="padding:26px 28px;font-size:15px;line-height:1.6;">
  <p style="margin:0 0 14px;">Olá${primeiro ? `, ${primeiro}` : ""}! Aqui está o manual que você pediu: 12 capítulos, da organização financeira ao mercado futuro.</p>
  <p style="margin:0 0 22px;"><a href="${PDF}" style="display:inline-block;background:#d4a53c;color:#0b0b0b;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:3px;letter-spacing:1px;">BAIXAR O MANUAL (PDF)</a></p>
  <p style="margin:0 0 14px;"><strong>Por onde começar:</strong> leia os capítulos 1 e 2 esta semana. Sem orçamento e reserva, o resto da carteira fica frágil.</p>
  <p style="margin:0 0 14px;">Amanhã às 9h30 chega o primeiro <strong>Diário Saga</strong>, o resumo do mercado em 3 minutos.</p>
  <p style="margin:0 0 6px;">Tem a partir de R$ 100 mil investidos? Responda este e-mail ou <a href="${wa}" style="color:#9a7a2e;">fale comigo no WhatsApp</a> e eu faço o diagnóstico da sua carteira, sem compromisso.</p>
  <p style="margin:18px 0 0;">Um abraço,<br>Rainiere Rocha</p>
</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #e8e4dc;font-size:11px;line-height:1.5;color:#6f6a62;">
  Material educacional; não é recomendação de investimento. Rainiere Rocha é assessor de investimentos vinculado à Invest Smart Assessor de Investimento Ltda. (Res. CVM 178/23), com contrato de distribuição com a XP Investimentos. Você recebe este e-mail porque pediu o manual em sagafin.com.br (LGPD).
</td></tr></table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const nome = String(body.nome || "").slice(0, 80);
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ ok: false, erro: "email" });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resend = process.env.RESEND_API_KEY;
  if (!url || !key || !resend) return res.status(500).json({ ok: false, erro: "config" });
  const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  try {
    const desde = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const q = `leads?email=eq.${encodeURIComponent(email)}&source=eq.manual-investidor&manual_enviado_at=is.null&created_at=gte.${encodeURIComponent(desde)}&select=id&order=created_at.desc&limit=1`;
    const r = await fetch(`${url}/rest/v1/${q}`, { headers: h });
    const rows = r.ok ? await r.json() : [];
    if (!Array.isArray(rows) || !rows.length) return res.status(200).json({ ok: true, enviado: false });

    const m = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: REPLY_TO,
        subject: "Seu Manual Completo do Investidor chegou",
        html: htmlManual(nome),
        tags: [{ name: "canal", value: "manual-investidor" }],
      }),
    });
    if (!m.ok) {
      console.error("manual-enviar: Resend", m.status, await m.text());
      return res.status(502).json({ ok: false });
    }
    await fetch(`${url}/rest/v1/leads?id=eq.${rows[0].id}`, {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({ manual_enviado_at: new Date().toISOString() }),
    });
    return res.status(200).json({ ok: true, enviado: true });
  } catch (e) {
    console.error("manual-enviar:", e);
    return res.status(500).json({ ok: false });
  }
}
