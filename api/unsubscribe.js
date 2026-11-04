// GET /api/unsubscribe?token=<uuid>
// Marca o assinante do Diário Saga como descadastrado e mostra uma página simples.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(title, body) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Saga Financeira</title>
<style>
  body{margin:0;background:#0b0b0b;color:#e8e4dc;font-family:Georgia,'Times New Roman',serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{max-width:480px;text-align:center}
  h1{font-weight:400;font-size:26px;margin:0 0 12px}
  p{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#b5b0a6;margin:0 0 20px}
  a{color:#d4a53c;text-decoration:none}
  .eyebrow{font-family:system-ui,sans-serif;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:rgba(212,165,60,.6);margin-bottom:16px}
</style>
</head>
<body><div class="card"><div class="eyebrow">Diário Saga</div>${body}<p><a href="https://sagafin.com.br">← Voltar para sagafin.com.br</a></p></div></body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).send(page("Método inválido", "<h1>Método inválido</h1>"));
  }

  const token = String(req.query?.token || "").trim();
  if (!UUID_RE.test(token)) {
    return res.status(400).send(
      page("Link inválido", "<h1>Link inválido</h1><p>Este link de cancelamento não é válido. Use o link que está no rodapé do e-mail que você recebeu.</p>")
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("unsubscribe: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados");
    return res.status(500).send(
      page("Erro", "<h1>Não foi possível processar</h1><p>Tente novamente mais tarde ou responda ao e-mail pedindo o cancelamento.</p>")
    );
  }

  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/daily_subscribers?unsubscribe_token=eq.${encodeURIComponent(token)}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status: "unsubscribed" }),
      }
    );
    if (!r.ok) {
      console.error("unsubscribe: Supabase respondeu", r.status, await r.text());
      return res.status(502).send(
        page("Erro", "<h1>Não foi possível processar</h1><p>Tente novamente mais tarde ou responda ao e-mail pedindo o cancelamento.</p>")
      );
    }
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).send(
        page("Link não encontrado", "<h1>Cadastro não encontrado</h1><p>Este link já foi usado ou não corresponde a nenhum cadastro ativo.</p>")
      );
    }
    return res.status(200).send(
      page(
        "Cancelado",
        "<h1>Inscrição cancelada</h1><p>Você não receberá mais o Diário Saga. Seus dados ficam guardados apenas para registrar o cancelamento (LGPD). Se quiser voltar, é só se cadastrar de novo no site.</p>"
      )
    );
  } catch (e) {
    console.error("unsubscribe:", e);
    return res.status(500).send(
      page("Erro", "<h1>Não foi possível processar</h1><p>Tente novamente mais tarde.</p>")
    );
  }
}
