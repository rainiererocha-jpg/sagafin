// POST /api/trading-run  — dispara o workflow "Agente de Trading" no GitHub a pedido do painel /admin.
// Body JSON: { slot?: "pre_open"|"mid_morning"|"mid_afternoon"|"post_close", dry_run?: boolean }
// Header: Authorization: Bearer <JWT da sessão Supabase do admin>
// Env (Vercel): SUPABASE_URL (ou VITE_SUPABASE_URL), SUPABASE_ANON_KEY (ou VITE_SUPABASE_ANON_KEY),
//               GITHUB_TOKEN (fine-grained, permissão Actions: write no repo), GITHUB_REPO (ex.: rainiererocha-jpg/sagafin),
//               ADMIN_ALLOWED_EMAILS (CSV opcional)

const SLOTS = new Set(["", "pre_open", "mid_morning", "mid_afternoon", "post_close"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "método inválido" });

  const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const ghToken = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "rainiererocha-jpg/sagafin";
  if (!supaUrl || !anon || !ghToken) return res.status(500).json({ error: "função não configurada (SUPABASE_URL/ANON_KEY/GITHUB_TOKEN)" });

  // 1) valida o JWT do admin na API de auth do Supabase
  const jwt = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return res.status(401).json({ error: "sem sessão" });
  const u = await fetch(`${supaUrl.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${jwt}` } });
  if (!u.ok) return res.status(401).json({ error: "sessão inválida" });
  const user = await u.json();
  const allowed = (process.env.ADMIN_ALLOWED_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(String(user.email || "").toLowerCase())) return res.status(403).json({ error: "e-mail não autorizado" });

  // 2) dispara o workflow_dispatch
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const slot = String(body.slot || "");
  if (!SLOTS.has(slot)) return res.status(400).json({ error: "slot inválido" });
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/trading-agent.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", "User-Agent": "sagafin-admin" },
    body: JSON.stringify({ ref: "main", inputs: { slot, dry_run: !!body.dry_run, force: true, playwright: false } }),
  });
  if (r.status !== 204) return res.status(502).json({ error: `GitHub HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` });
  return res.status(200).json({ ok: true, requested_by: user.email, slot: slot || "auto", dry_run: !!body.dry_run });
}
