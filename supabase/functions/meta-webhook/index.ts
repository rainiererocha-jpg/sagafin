/* eslint-disable @typescript-eslint/no-explicit-any */
// meta-webhook: funil "comente EU QUERO" no Instagram e na página do Facebook.
//   GET  -> verificação do webhook (hub.challenge) com META_VERIFY_TOKEN.
//   POST -> confere x-hub-signature-256 (META_APP_SECRET); para cada comentário novo com palavra-chave
//           (eu quero / quero / manual / guia):
//             1. registra em social_dm_events (comment_id único = idempotente; a Meta reenvia eventos)
//             2. envia private reply (DM) com o link rastreável de /manual
//             3. responde publicamente no comentário ("Te mandei no direct")
// Publicar com verify_jwt = false. Secrets: META_APP_SECRET, META_VERIFY_TOKEN, META_PAGE_ID,
// META_PAGE_TOKEN (token de página de longa duração), META_IG_USER_ID.
// Requer app Meta com instagram_manage_comments, instagram_manage_messages, pages_manage_engagement,
// pages_messaging, pages_read_engagement — e App Review aprovado para funcionar com o público (docs/motor-social.md).
import { clienteServico, iguaisSeguro, json } from "../_shared/comum.ts";
import { detectarPalavraChave, linkManual } from "../_shared/palavra_chave.ts";

const GRAPH = "https://graph.facebook.com/v21.0";
const env = (k: string) => Deno.env.get(k) ?? "";

const RESPOSTAS_PUBLICAS = [
  "Te mandei no direct! 📩",
  "Enviado no seu direct 📩 Confere lá!",
  "Pronto, o manual está no seu direct 📩",
];

function textoDm(nome: string | null, link: string): string {
  const oi = nome ? `Oi, ${nome}! ` : "Oi! ";
  return `${oi}Aqui está o seu Manual Completo do Investidor, da organização financeira ao mercado futuro, em 12 capítulos 📚\n\n` +
    `É só deixar seu nome e e-mail que o PDF chega na hora:\n${link}\n\n` +
    `Conteúdo educacional, sem recomendação de investimento. Qualquer dúvida, responde aqui.`;
}

async function assinaturaValida(req: Request, bruto: string): Promise<boolean> {
  const segredo = env("META_APP_SECRET");
  if (!segredo) {
    console.error("meta-webhook: META_APP_SECRET ausente - requisição recusada");
    return false;
  }
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(bruto));
  const esperada = "sha256=" + Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return iguaisSeguro(req.headers.get("x-hub-signature-256") ?? "", esperada);
}

async function graph(caminho: string, corpo: Record<string, unknown>): Promise<{ ok: boolean; erro?: string }> {
  const r = await fetch(`${GRAPH}/${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env("META_PAGE_TOKEN")}` },
    body: JSON.stringify(corpo),
  });
  if (r.ok) return { ok: true };
  return { ok: false, erro: `HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` };
}

type Comentario = {
  platform: "instagram" | "facebook";
  comment_id: string;
  media_id: string | null;
  user_id: string | null;
  username: string | null;
  texto: string;
};

/** Normaliza os dois formatos de webhook (object=instagram/field=comments e object=page/field=feed). */
function extrair(payload: any): Comentario[] {
  const out: Comentario[] = [];
  for (const e of payload?.entry ?? []) {
    for (const ch of e.changes ?? []) {
      const v = ch.value ?? {};
      if (payload.object === "instagram" && ch.field === "comments" && v.id) {
        out.push({
          platform: "instagram",
          comment_id: String(v.id),
          media_id: v.media?.id ? String(v.media.id) : null,
          user_id: v.from?.id ? String(v.from.id) : null,
          username: v.from?.username ?? null,
          texto: String(v.text ?? ""),
        });
      }
      if (payload.object === "page" && ch.field === "feed" && v.item === "comment" && v.verb === "add" && v.comment_id) {
        out.push({
          platform: "facebook",
          comment_id: String(v.comment_id),
          media_id: v.post_id ? String(v.post_id) : null,
          user_id: v.from?.id ? String(v.from.id) : null,
          username: v.from?.name ?? null,
          texto: String(v.message ?? ""),
        });
      }
    }
  }
  return out;
}

async function tratar(db: ReturnType<typeof clienteServico>, c: Comentario) {
  // Ignora comentários da própria conta (inclusive a resposta pública que nós mesmos fazemos).
  if (c.user_id && (c.user_id === env("META_IG_USER_ID") || c.user_id === env("META_PAGE_ID"))) return;
  const keyword = detectarPalavraChave(c.texto);
  if (!keyword) return;

  const utm = (c.media_id ?? "sem-midia").slice(-12);
  const { error: insErro } = await db.from("social_dm_events").insert({
    platform: c.platform,
    comment_id: c.comment_id,
    media_id: c.media_id,
    user_id: c.user_id,
    username: c.username,
    keyword,
    comment_text: c.texto.slice(0, 500),
    utm_content: utm,
  });
  if (insErro) {
    // 23505 = já processado (reenvio da Meta). Qualquer outro erro: loga e segue sem DM para não duplicar.
    if (!String(insErro.code).includes("23505")) console.error("meta-webhook: insert falhou", insErro.message);
    return;
  }

  const primeiro = (c.username ?? "").split(/\s+/)[0] || null;
  const link = linkManual(c.platform === "instagram" ? "instagram-dm" : "facebook-dm", utm);
  const dm = await graph(`${env("META_PAGE_ID")}/messages`, {
    recipient: { comment_id: c.comment_id },
    message: { text: textoDm(c.platform === "facebook" ? primeiro : null, link) },
  });

  const resposta = RESPOSTAS_PUBLICAS[Math.floor(Math.random() * RESPOSTAS_PUBLICAS.length)];
  const pub = dm.ok
    ? await graph(c.platform === "instagram" ? `${c.comment_id}/replies` : `${c.comment_id}/comments`, { message: resposta })
    : { ok: false, erro: "dm falhou" };

  await db.from("social_dm_events").update({
    dm_status: dm.ok ? "sent" : "failed",
    dm_error: dm.erro ?? null,
    public_reply_status: pub.ok ? "sent" : `failed: ${pub.erro ?? ""}`.slice(0, 300),
  }).eq("comment_id", c.comment_id);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const esperado = env("META_VERIFY_TOKEN");
    const token = url.searchParams.get("hub.verify_token") ?? "";
    if (url.searchParams.get("hub.mode") === "subscribe" && esperado && iguaisSeguro(token, esperado)) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const bruto = await req.text();
  if (!(await assinaturaValida(req, bruto))) return new Response("unauthorized", { status: 401 });

  let payload: any;
  try {
    payload = JSON.parse(bruto);
  } catch {
    return json({ ok: false }, 400);
  }
  const db = clienteServico();
  for (const c of extrair(payload)) {
    try {
      await tratar(db, c);
    } catch (e) {
      // 200 mesmo assim: a Meta reenviaria em loop. O erro fica no log da função.
      console.error("meta-webhook: erro ao tratar comentário:", String(e));
    }
  }
  return json({ ok: true });
});
