// Cliente mínimo da API do Blotato (v2). Usado por api/aprovar-post.js (Vercel) e por scripts.
// Não chama process.exit: lança Error, para funcionar em função serverless.
//
// Env: BLOTATO_API_KEY e os ids das contas conectadas no Blotato:
//   BLOTATO_IG_ACCOUNT_ID, BLOTATO_FB_ACCOUNT_ID, BLOTATO_FB_PAGE_ID, BLOTATO_LI_ACCOUNT_ID, BLOTATO_LI_PAGE_ID (opcional:
//   página de empresa; vazio = perfil pessoal). Para descobrir os ids: GET /v2/users/me/accounts (ver docs/motor-social.md).
// Conferir o formato na documentação atual do Blotato (help.blotato.com/api) se a API mudar.

const BASE = process.env.BLOTATO_BASE_URL || "https://backend.blotato.com/v2";

function chave() {
  const k = process.env.BLOTATO_API_KEY;
  if (!k) throw new Error("BLOTATO_API_KEY não configurada");
  return k.trim();
}

async function chamar(path, { method = "GET", body } = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "blotato-api-key": chave(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* texto */ }
  if (!r.ok) throw new Error(`Blotato ${method} ${path} HTTP ${r.status}: ${text.slice(0, 300)}`);
  return json;
}

export const listarContas = () => chamar("/users/me/accounts");

/** Reenvia uma mídia pública para o storage do Blotato e devolve a URL dele. */
export async function subirMidia(url) {
  const j = await chamar("/media", { method: "POST", body: { url } });
  return j?.url || url;
}

/** Monta o `target` de cada rede a partir do env. */
export function alvo(rede, { story = false } = {}) {
  const e = process.env;
  if (rede === "instagram") {
    if (!e.BLOTATO_IG_ACCOUNT_ID) return null;
    return { accountId: e.BLOTATO_IG_ACCOUNT_ID, target: { targetType: "instagram", ...(story ? { mediaType: "story" } : {}) } };
  }
  if (rede === "facebook") {
    if (!e.BLOTATO_FB_ACCOUNT_ID || !e.BLOTATO_FB_PAGE_ID) return null;
    return { accountId: e.BLOTATO_FB_ACCOUNT_ID, target: { targetType: "facebook", pageId: e.BLOTATO_FB_PAGE_ID, ...(story ? { mediaType: "story" } : {}) } };
  }
  if (rede === "linkedin") {
    if (!e.BLOTATO_LI_ACCOUNT_ID) return null;
    return { accountId: e.BLOTATO_LI_ACCOUNT_ID, target: { targetType: "linkedin", ...(e.BLOTATO_LI_PAGE_ID ? { pageId: e.BLOTATO_LI_PAGE_ID } : {}) } };
  }
  return null;
}

/**
 * Cria (ou agenda) um post. `quando` = Date/ISO opcional (sem = publicar já).
 * Devolve o id de submissão do Blotato.
 */
export async function publicar(rede, { texto, midias = [], story = false, quando } = {}) {
  const a = alvo(rede, { story });
  if (!a) return { rede, pulado: true, motivo: "conta não configurada" };
  const body = {
    post: {
      accountId: a.accountId,
      content: { text: texto || "", mediaUrls: midias, platform: rede },
      target: a.target,
    },
    ...(quando ? { scheduledTime: new Date(quando).toISOString() } : {}),
  };
  const j = await chamar("/posts", { method: "POST", body });
  return { rede, story, id: j?.postSubmissionId || j?.id || null };
}

/**
 * Publica uma peça aprovada da fila `pending_approvals` nas três redes.
 * Carrossel: IG + FB + LinkedIn agora; stories: IG (+FB) espaçados de 3 em 3 horas.
 */
export async function publicarPeca(peca, { agora = new Date() } = {}) {
  const slides = await Promise.all((peca.slides_urls || []).map(subirMidia));
  const stories = await Promise.all((peca.story_urls || []).map(subirMidia));
  const out = [];
  const tentar = async (fn) => {
    try { out.push(await fn()); } catch (e) { out.push({ erro: e.message }); }
  };
  if (slides.length) {
    await tentar(() => publicar("instagram", { texto: peca.caption_instagram, midias: slides }));
    await tentar(() => publicar("facebook", { texto: peca.caption_facebook || peca.caption_instagram, midias: slides }));
    await tentar(() => publicar("linkedin", { texto: peca.caption_linkedin, midias: slides }));
  }
  for (let i = 0; i < stories.length; i++) {
    const quando = i === 0 ? undefined : new Date(agora.getTime() + i * 3 * 3600 * 1000);
    await tentar(() => publicar("instagram", { midias: [stories[i]], story: true, quando }));
    if (process.env.BLOTATO_FB_STORIES === "on") {
      await tentar(() => publicar("facebook", { midias: [stories[i]], story: true, quando }));
    }
  }
  return out;
}
