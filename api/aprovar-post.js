// GET  /api/aprovar-post?token=<uuid>  → prévia da peça (slides, stories, legendas) com botões Aprovar / Rejeitar.
// POST /api/aprovar-post  (form: token, acao=aprovar|rejeitar) → publica pelo Blotato ou arquiva.
// Aprovar só via POST: leitores de link de e-mail (antivírus, Outlook) abrem GETs sozinhos.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BLOTATO_API_KEY e BLOTATO_*_ACCOUNT_ID (ver scripts/social/blotato.mjs).
import { publicarPeca } from "../scripts/social/blotato.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(title, body) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Saga Financeira</title><meta name="robots" content="noindex">
<style>
body{margin:0;background:#0b0b0b;color:#e8e4dc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px 16px}
.c{max-width:760px;margin:0 auto}h1{font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 14px}
.e{font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#d4a53c}
.g{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}.g img{height:240px;border-radius:6px;border:1px solid #2a2824}
pre{white-space:pre-wrap;font:13px/1.55 system-ui,sans-serif;background:#161512;padding:14px;border-radius:8px;color:#d8d1c2}
.b{display:flex;gap:10px;position:sticky;bottom:0;background:#0b0b0b;padding:14px 0}
button{flex:1;padding:16px;border:0;border-radius:4px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;cursor:pointer}
.ok{background:#d4a53c;color:#0b0b0b}.no{background:#2a2824;color:#e8e4dc}h2{font-size:12px;color:#8b8476;font-weight:500;margin:18px 0 6px}
p{color:#b5b0a6;font-size:14px;line-height:1.6}a{color:#d4a53c}
</style></head><body><div class="c">${body}</div></body></html>`;
}

async function sb(path, opts = {}) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase não configurado");
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(opts.headers || {}) },
  });
  if (!r.ok) throw new Error(`Supabase HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

const buscar = async (token) =>
  (await sb(`pending_approvals?approval_token=eq.${token}&select=*&limit=1`))[0] || null;

function lerForm(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return Object.fromEntries(new URLSearchParams(String(req.body || "")));
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const dados = req.method === "POST" ? lerForm(req) : req.query || {};
  const token = String(dados.token || "").trim();
  if (!UUID_RE.test(token)) return res.status(400).send(page("Link inválido", "<h1>Link inválido</h1>"));

  try {
    const p = await buscar(token);
    if (!p) return res.status(404).send(page("Não encontrado", "<h1>Peça não encontrada</h1>"));
    const expirada = p.expires_at && new Date(p.expires_at) < new Date();

    if (req.method === "GET") {
      const estado =
        p.status !== "pending"
          ? `<p>Esta peça já está como <b>${esc(p.status)}</b>.</p>`
          : expirada
            ? "<p>Esta peça expirou (conteúdo de mercado vale só até as 11h do dia). Nada foi publicado.</p>"
            : `<form method="post" class="b"><input type="hidden" name="token" value="${esc(token)}">
               <button class="no" name="acao" value="rejeitar">Rejeitar</button>
               <button class="ok" name="acao" value="aprovar">Aprovar e publicar</button></form>`;
      return res.status(200).send(page("Aprovar post", `
        <div class="e">Motor social · ${esc(p.pilar || p.format)}</div><h1>${esc(p.hook || p.title)}</h1>
        <h2>Carrossel (Instagram, Facebook, LinkedIn)</h2><div class="g">${(p.slides_urls || []).map((u) => `<img src="${esc(u)}" alt="">`).join("")}</div>
        <h2>Stories (Instagram, de 3 em 3 horas)</h2><div class="g">${(p.story_urls || []).map((u) => `<img src="${esc(u)}" alt="">`).join("")}</div>
        <h2>Legenda Instagram</h2><pre>${esc(p.caption_instagram)}</pre>
        <h2>Legenda Facebook</h2><pre>${esc(p.caption_facebook)}</pre>
        <h2>Legenda LinkedIn</h2><pre>${esc(p.caption_linkedin)}</pre>${estado}`));
    }

    if (req.method !== "POST") return res.status(405).send(page("Método inválido", "<h1>Método inválido</h1>"));
    if (p.status !== "pending") return res.status(409).send(page("Já processada", `<h1>Já processada</h1><p>Status atual: ${esc(p.status)}.</p>`));

    if (dados.acao === "rejeitar") {
      await sb(`pending_approvals?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) });
      return res.status(200).send(page("Rejeitada", "<h1>Peça rejeitada</h1><p>Nada foi publicado.</p>"));
    }
    if (dados.acao !== "aprovar") return res.status(400).send(page("Ação inválida", "<h1>Ação inválida</h1>"));
    if (expirada) return res.status(410).send(page("Expirada", "<h1>Peça expirada</h1><p>Nada foi publicado.</p>"));

    // Trava contra duplo clique: só segue quem mudar pending → publishing.
    const trava = await sb(`pending_approvals?id=eq.${p.id}&status=eq.pending`, {
      method: "PATCH",
      body: JSON.stringify({ status: "publishing", approved_at: new Date().toISOString() }),
    });
    if (!trava.length) return res.status(409).send(page("Já processada", "<h1>Já está sendo publicada</h1>"));

    const resultado = await publicarPeca(p);
    const erros = resultado.filter((r) => r.erro).map((r) => r.erro);
    const ok = resultado.filter((r) => r.id).length;
    await sb(`pending_approvals?id=eq.${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: ok ? "posted" : "failed",
        posted_at: ok ? new Date().toISOString() : null,
        blotato_ids: resultado,
        publish_error: erros.length ? erros.join(" | ").slice(0, 2000) : null,
      }),
    });
    const linhas = resultado.map((r) => `<li>${esc(r.rede || "?")}${r.story ? " (story)" : ""}: ${r.id ? "enviado" : r.pulado ? "conta não configurada" : esc(r.erro)}</li>`).join("");
    return res.status(ok ? 200 : 502).send(page(ok ? "Publicado" : "Falhou", `<h1>${ok ? "Enviado para publicação" : "Nada foi publicado"}</h1><ul>${linhas}</ul><p>O Blotato processa em alguns minutos. Confira no calendário do <a href="/admin/calendar">admin</a>.</p>`));
  } catch (e) {
    console.error("aprovar-post:", e);
    return res.status(500).send(page("Erro", "<h1>Erro ao processar</h1><p>Tente de novo em alguns minutos.</p>"));
  }
}
