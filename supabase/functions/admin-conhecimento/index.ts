// admin-conhecimento: cria ou atualiza fichas do RAG (ray_conhecimento) e calcula o embedding.
// Quem pode chamar: (a) a chave de serviço (script scripts/ray-carregar-fichas.mjs) ou
// (b) um usuário autenticado do admin. Se o segredo ADMIN_ALLOWED_EMAILS (CSV) existir, só
// esses e-mails entram; sem ele vale o mesmo critério do painel (login por convite).
// Corpo: { categoria, titulo, conteudo, ativo? }  ou  { fichas: [ {categoria, titulo, conteudo, ativo?} ] }
import { bearer, chamadaDeServico, clienteServico, CORS, json } from "../_shared/comum.ts";

const CATEGORIAS = new Set([
  "renda_fixa", "fii", "renda_variavel", "previdencia", "perfil", "macro", "regulatorio", "sagafin",
]);

interface Ficha { categoria: string; titulo: string; conteudo: string; ativo?: boolean }

// @ts-expect-error - Supabase.ai é injetado pelo runtime das edge functions
const sessao = new Supabase.ai.Session("gte-small");

async function embedding(texto: string): Promise<number[]> {
  return (await sessao.run(texto.slice(0, 2000), { mean_pool: true, normalize: true })) as number[];
}

async function autorizado(req: Request, db: ReturnType<typeof clienteServico>): Promise<boolean> {
  if (chamadaDeServico(req)) return true;
  const jwt = bearer(req);
  if (!jwt) return false;
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data?.user?.email) return false;
  const lista = (Deno.env.get("ADMIN_ALLOWED_EMAILS") ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return lista.length === 0 || lista.includes(data.user.email.toLowerCase());
}

function validar(f: Ficha): string | null {
  if (!f || typeof f !== "object") return "ficha inválida";
  if (!CATEGORIAS.has(String(f.categoria))) return "categoria inválida: " + f.categoria;
  if (!String(f.titulo ?? "").trim()) return "titulo é obrigatório";
  if (String(f.conteudo ?? "").trim().length < 40) return "conteudo muito curto";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, erro: "método não permitido" }, 405);

  const db = clienteServico();
  if (!(await autorizado(req, db))) return json({ ok: false, erro: "não autorizado" }, 401);

  try {
    const corpo = await req.json();
    const lista: Ficha[] = Array.isArray(corpo?.fichas) ? corpo.fichas : [corpo];
    if (lista.length > 60) return json({ ok: false, erro: "no máximo 60 fichas por chamada" }, 422);

    const resultados: { titulo: string; ok: boolean; erro?: string }[] = [];
    for (const f of lista) {
      const problema = validar(f);
      if (problema) {
        resultados.push({ titulo: String(f?.titulo ?? ""), ok: false, erro: problema });
        continue;
      }
      try {
        const emb = await embedding(f.titulo.trim() + "\n" + f.conteudo.trim());
        const { error } = await db.from("ray_conhecimento").upsert({
          categoria: f.categoria,
          titulo: f.titulo.trim(),
          conteudo: f.conteudo.trim(),
          embedding: JSON.stringify(emb),
          ativo: f.ativo ?? true,
        }, { onConflict: "titulo" });
        resultados.push(error ? { titulo: f.titulo, ok: false, erro: error.message } : { titulo: f.titulo, ok: true });
      } catch (e) {
        resultados.push({ titulo: f.titulo, ok: false, erro: String(e) });
      }
    }
    const falhas = resultados.filter((r) => !r.ok).length;
    return json({ ok: falhas === 0, total: resultados.length, falhas, resultados }, falhas ? 207 : 200);
  } catch (e) {
    console.error("admin-conhecimento:", String(e));
    return json({ ok: false, erro: String(e) }, 500);
  }
});
