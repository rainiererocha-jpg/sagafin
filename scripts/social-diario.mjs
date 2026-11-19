// Motor social diário: transforma o Diário Saga / Biblioteca / Destaques de Trading em carrossel + stories +
// legendas (Instagram, Facebook, LinkedIn), grava na fila `pending_approvals` e PUBLICA sozinho pelo Blotato
// (api/aprovar-post.js, que tem as chaves BLOTATO_* na Vercel). Depois manda um e-mail só de aviso.
// AUTO_PUBLICAR=false volta ao modo antigo: manda e-mail de aprovação e nada sai sem o clique.
// Roda no GitHub Actions (.github/workflows/social-diario.yml) depois do Diário.
//
// Env (secrets): ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APROVADOR_EMAIL
// Opcionais: SITE_URL, AUTO_PUBLICAR=false (exige aprovação por e-mail), SOCIAL_MODEL (padrão claude-haiku-5-5), FORCE_RUN=true, DRY_RUN=true (gera e salva PNG/JSON em ./saida-social, não grava nem envia),
//   FIXTURE=caminho.json (pula o Claude e usa um conteúdo pronto — para testar o visual), PILAR=mercado|evergreen|trading.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fail, env, hojeISO, dataExtenso, ddmm, fetchJson, stripHtml, extrairJson, escapeHtml, partesNoFuso } from "./lib/util.mjs";
import { sbSelect, sbInsert, sbUpload } from "./lib/supabase.mjs";
import { carregarFeriados, diaDePregao } from "./lib/calendario.mjs";
import { enviarResend } from "./lib/email.mjs";
import { pilarDoDia, semanaDoAno, CTA_KEYWORD } from "./social/pilares.mjs";
import { montarPrompt, validar, legendasFinais } from "./social/conteudo.mjs";
import { montarHtml, renderizar } from "./social/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const SITE_URL = (process.env.SITE_URL || "https://sagafin.com.br").replace(/\/$/, "");
const FORCE_RUN = process.env.FORCE_RUN === "true";
const DRY_RUN = process.env.DRY_RUN === "true";
const MODEL = process.env.SOCIAL_MODEL || "claude-haiku-5-5";
const AUTO_PUBLICAR = process.env.AUTO_PUBLICAR !== "false";

// ---------------------------------------------------------------- fontes

async function postDoDia(tag, hoje) {
  const q = `status=eq.published&tags=cs.{${tag}}&select=slug,titulo,resumo,conteudo_html,data_publicacao&order=data_publicacao.desc,criado_em.desc&limit=1`;
  const [p] = await sbSelect("posts", q);
  if (!p) return null;
  if (tag === "diario-saga" && p.data_publicacao !== hoje && !FORCE_RUN) return null;
  return p;
}

function capituloDoManual(num) {
  const { capitulos } = require("./manual-investidor/conteudo.cjs");
  const c = capitulos.find((x) => Number(x.num) === Number(num));
  return c ? `${c.titulo}\n${c.lead}\n${stripHtml(c.html)}` : "";
}

async function escolherFonte(hoje) {
  const { dow } = partesNoFuso("America/Sao_Paulo", new Date(`${hoje}T12:00:00-03:00`));
  let p = pilarDoDia(dow, semanaDoAno(hoje));
  if (process.env.PILAR) p = process.env.PILAR === "evergreen" ? pilarDoDia(2, semanaDoAno(hoje)) : { pilar: process.env.PILAR };

  if (p.pilar === "trading") {
    const t = await postDoDia("destaques-trading", hoje);
    if (t) return { pilar: "trading", slug: t.slug, titulo: t.titulo, texto: stripHtml(t.conteudo_html).slice(0, 6000) };
    p = { pilar: "mercado" };
  }
  if (p.pilar === "evergreen") {
    const ev = p.evergreen;
    return { pilar: "evergreen", slug: `evergreen-${ev.id}`, titulo: ev.tema, tema: ev.tema, texto: capituloDoManual(ev.capitulo) };
  }
  const d = await postDoDia("diario-saga", hoje);
  if (!d) return null;
  return { pilar: "mercado", slug: d.slug, titulo: d.titulo, texto: stripHtml(d.conteudo_html).slice(0, 7000) };
}

// ---------------------------------------------------------------- geração

async function chamarClaude(prompt) {
  const r = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    },
    120000
  );
  if (!r.ok) fail(`Anthropic API HTTP ${r.status}: ${r.text.slice(0, 400)}`);
  if (r.json?.stop_reason === "max_tokens") console.warn("⚠ Resposta cortada pelo limite de tokens (max_tokens); o JSON pode estar incompleto.");
  return extrairJson(r.json?.content?.map((c) => c.text || "").join("") || "");
}

async function gerarConteudo(fonte, hoje) {
  if (process.env.FIXTURE) return JSON.parse(await readFile(process.env.FIXTURE, "utf8"));
  const prompt = montarPrompt({ pilar: fonte.pilar, fonteTitulo: fonte.titulo, fonteTexto: fonte.texto, tema: fonte.tema, dataExtenso: dataExtenso(hoje) });
  let c = await chamarClaude(prompt);
  let erros = validar(c);
  if (erros.length) {
    console.warn(`⚠ 1ª tentativa reprovada: ${erros.join("; ")}. Regerando.`);
    c = await chamarClaude(`${prompt}\n\nA tentativa anterior foi reprovada por: ${erros.join("; ")}. Corrija.`);
    erros = validar(c);
  }
  if (erros.length) fail(`Conteúdo reprovado duas vezes (${erros.join("; ")}). Nada foi para a fila.`);
  return c;
}

// ---------------------------------------------------------------- aprovação

function emailAprovacao({ peca, link, fonte }) {
  const thumbs = (peca.slides_urls || [])
    .map((u) => `<img src="${u}" width="120" style="width:120px;height:150px;object-fit:cover;border-radius:4px;margin:0 6px 6px 0;border:1px solid #333">`)
    .join("");
  const sthumbs = (peca.story_urls || [])
    .map((u) => `<img src="${u}" width="84" style="width:84px;height:150px;object-fit:cover;border-radius:4px;margin:0 6px 6px 0;border:1px solid #333">`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#e8e4dc;padding:24px">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a53c">Motor social · ${escapeHtml(fonte.pilar)}</div>
  <h1 style="font-family:Georgia,serif;font-weight:400;color:#fff;font-size:24px;margin:8px 0 16px">${escapeHtml(peca.hook || peca.title)}</h1>
  <p><a href="${link}" style="display:inline-block;background:#d4a53c;color:#0b0b0b;font-weight:bold;text-decoration:none;padding:14px 26px;border-radius:3px">REVISAR E APROVAR</a></p>
  <p style="font-size:12px;color:#8b8476">Expira ${new Date(peca.expires_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Sem aprovação, nada é publicado.</p>
  <div style="margin:18px 0 6px;font-size:12px;color:#8b8476">Carrossel</div><div>${thumbs}</div>
  <div style="margin:12px 0 6px;font-size:12px;color:#8b8476">Stories</div><div>${sthumbs}</div>
  <div style="margin:18px 0 6px;font-size:12px;color:#8b8476">Legenda Instagram</div>
  <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:13px;color:#d8d1c2;background:#161512;padding:14px;border-radius:6px">${escapeHtml(peca.caption_instagram)}</pre>
</div>`;
}

function emailAviso({ peca, link, fonte, publicou, status }) {
  const thumbs = (peca.slides_urls || [])
    .map((u) => `<img src="${u}" width="120" style="width:120px;height:150px;object-fit:cover;border-radius:4px;margin:0 6px 6px 0;border:1px solid #333">`)
    .join("");
  const titulo = publicou ? "Publicado automaticamente" : `Falhou ao publicar (HTTP ${status})`;
  return `<div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#e8e4dc;padding:24px">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a53c">Motor social · ${escapeHtml(fonte.pilar)}</div>
  <h1 style="font-family:Georgia,serif;font-weight:400;color:#fff;font-size:24px;margin:8px 0 8px">${escapeHtml(peca.hook || peca.title)}</h1>
  <p style="color:${publicou ? "#7bd88f" : "#ff8a80"};font-weight:bold">${titulo}</p>
  <p style="font-size:13px;color:#b5b0a6">${publicou ? "O Blotato processa em alguns minutos. Confira no calendário do admin." : "Nada foi publicado. Abra o link para revisar e tentar de novo."}</p>
  <p><a href="${link}" style="color:#d4a53c">Ver a peça</a></p>
  <div>${thumbs}</div>
</div>`;
}

// ---------------------------------------------------------------- main

async function main() {
  const hoje = hojeISO();
  if (!FORCE_RUN) {
    const r = diaDePregao(hoje, await carregarFeriados(path.join(__dirname, "feriados-b3.json")));
    if (!r.rodar) return console.log(`ℹ ${hoje}: ${r.motivo}; nada a fazer.`);
  }

  const fonte = process.env.FIXTURE ? { pilar: process.env.PILAR || "mercado", slug: "fixture", titulo: "fixture", texto: "" } : await escolherFonte(hoje);
  if (!fonte) return console.log("ℹ Diário de hoje ainda não publicado; nada a fazer (rode de novo mais tarde ou use FORCE_RUN).");
  console.log(`▶ Pilar: ${fonte.pilar} · fonte: ${fonte.slug}`);

  if (!DRY_RUN && !process.env.FIXTURE) {
    const ja = await sbSelect("pending_approvals", `source_post_slug=eq.${encodeURIComponent(fonte.slug)}&created_at=gte.${hoje}T00:00:00-03:00&select=id`);
    if (ja.length && !FORCE_RUN) return console.log(`ℹ Já existe peça de hoje para ${fonte.slug}; pulando.`);
  }

  const c = await gerarConteudo(fonte, hoje);
  const id = randomUUID();
  const utm = id.slice(0, 8);
  const legendas = legendasFinais(c, { utm, site: SITE_URL });
  const eyebrow = fonte.pilar === "mercado" ? `Diário Saga · ${ddmm(hoje)}` : fonte.pilar === "trading" ? "Destaques de Trading" : "Biblioteca Saga";
  const meta = { eyebrow, eyebrowCurto: fonte.pilar === "mercado" ? "Diário Saga" : "Saga Financeira", ddmm: ddmm(hoje), cta: CTA_KEYWORD };

  const png = await renderizar(montarHtml(c, meta));
  console.log(`✓ Renderizado: ${png.carrossel.length} slides, ${png.stories.length} stories`);

  if (DRY_RUN) {
    const dir = path.join(process.cwd(), "saida-social", hoje);
    await mkdir(dir, { recursive: true });
    await Promise.all([
      ...png.carrossel.map((b, i) => writeFile(path.join(dir, `carrossel-${i + 1}.png`), b)),
      ...png.stories.map((b, i) => writeFile(path.join(dir, `story-${i + 1}.png`), b)),
      writeFile(path.join(dir, "conteudo.json"), JSON.stringify({ ...c, ...legendas }, null, 2)),
    ]);
    return console.log(`✓ DRY_RUN: arquivos em ${dir}`);
  }

  const pasta = `${hoje}/${id}`;
  const slides_urls = [];
  for (let i = 0; i < png.carrossel.length; i++) slides_urls.push(await sbUpload("social", `${pasta}/carrossel-${i + 1}.png`, png.carrossel[i]));
  const story_urls = [];
  for (let i = 0; i < png.stories.length; i++) story_urls.push(await sbUpload("social", `${pasta}/story-${i + 1}.png`, png.stories[i]));

  // Modo automático: publica logo em seguida, então a peça só precisa valer por algumas horas.
  // Modo com aprovação: conteúdo de mercado vence às 11h do mesmo dia; evergreen fica 3 dias na fila.
  const expires_at = AUTO_PUBLICAR
    ? new Date(Date.now() + 3 * 3600000).toISOString()
    : fonte.pilar === "evergreen" ? new Date(Date.now() + 3 * 86400000).toISOString() : `${hoje}T11:00:00-03:00`;
  const [peca] = await sbInsert("pending_approvals", [{
    id,
    topic_id: fonte.slug,
    source_post_slug: fonte.slug,
    pilar: fonte.pilar,
    format: "carousel",
    title: String(c.titulo || fonte.titulo).slice(0, 160),
    hook: String(c.gancho || c.slides[0].titulo).slice(0, 200),
    status: "pending",
    slides_urls,
    story_urls,
    thumb_url: slides_urls[0],
    cover_idx: 0,
    caption_instagram: legendas.caption_instagram,
    caption_facebook: legendas.caption_facebook,
    caption_linkedin: legendas.caption_linkedin,
    cta_keyword: CTA_KEYWORD,
    utm_content: utm,
    expires_at,
  }]);
  console.log(`✓ Na fila: ${peca.id}`);

  const link = `${SITE_URL}/api/aprovar-post?token=${peca.approval_token}`;

  if (!AUTO_PUBLICAR) {
    await enviarResend(
      [{ to: env("APROVADOR_EMAIL"), subject: `Aprovar post: ${peca.hook}`.slice(0, 140), html: emailAprovacao({ peca, link, fonte }) }],
      { canal: "aprovacao-social" }
    );
    return;
  }

  // Publicação automática: o endpoint trava duplo disparo (pending -> publishing) e registra posted/failed.
  const resp = await fetchJson(
    `${SITE_URL}/api/aprovar-post`,
    { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: peca.approval_token, acao: "aprovar" }).toString() },
    120000
  );
  const publicou = resp.ok;
  console.log(publicou ? "✓ Enviado para publicação (Blotato)." : `✖ Publicação falhou: HTTP ${resp.status}`);
  await enviarResend(
    [{
      to: env("APROVADOR_EMAIL"),
      subject: `${publicou ? "Publicado" : "FALHOU ao publicar"}: ${peca.hook}`.slice(0, 140),
      html: emailAviso({ peca, link, fonte, publicou, status: resp.status }),
    }],
    { canal: "publicacao-social" }
  );
  if (!publicou) fail(`Publicação automática falhou (HTTP ${resp.status}). Veja ${link}`);
}

main().catch((e) => fail(e.stack || e.message));
