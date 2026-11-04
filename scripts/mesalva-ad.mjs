// Peça publicitária do MeSalva para o Diário Saga (e-mail + post).
// Uma funcionalidade por dia, escolhida de forma determinística pela data.
// Tokens de marca: scripts/mesalva-brand.json (fonte única, também usada pelo site).
//
//   import { escolherFeature, blocoEmail, blocoPost } from "./mesalva-ad.mjs";
//   node scripts/mesalva-ad.mjs --preview 2026-10-09   → imprime a peça do dia e salva um preview HTML

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lerJson = (nome) => JSON.parse(readFileSync(path.join(__dirname, nome), "utf8"));

export const FEATURES = lerJson("mesalva-features.json");
const B = lerJson("mesalva-brand.json");

const EPOCH = Date.UTC(2026, 9, 8); // 2026-10-08: primeiro dia do rodízio
const L = B.light;
const D = B.dark;
const VIOLETA = B.color.violet;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escolherFeature(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dias = Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000);
  const idx = ((dias % FEATURES.length) + FEATURES.length) % FEATURES.length;
  return FEATURES[idx];
}

function utm(feature, medium, campaign = "diario-saga") {
  return `utm_source=sagafin&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${feature.id}`;
}

export function linkMesalva(feature, medium, campaign) {
  return `${B.url}?${utm(feature, medium, campaign)}${feature.anchor || ""}`;
}

export function linkCadastro(feature, medium, campaign) {
  return `${B.signupUrl}&${utm(feature, medium, campaign)}`;
}

// Gradiente em texto não funciona em e-mail: o "$" fica em violeta sólido.
export const WORDMARK = `<span style="font-family:${B.font.emailStack};font-weight:800;letter-spacing:-0.02em;color:${L.ink};">Me<span style="color:${VIOLETA};">$</span>alva</span>`;

// Vai no <head> do e-mail: web font (só Apple Mail/iOS honram; Gmail cai no Arial) e tema claro.
export const EMAIL_HEAD_EXTRAS =
  `<link href="https://fonts.googleapis.com/css2?family=${B.font.googleFontsParam}&display=swap" rel="stylesheet">` +
  `<meta name="color-scheme" content="light">`;

// Barra camaleão: 6 células sólidas (degrada bem no Outlook) com gradiente onde há suporte.
function barraCham(h = 4) {
  const cores = B.cham;
  const w = (100 / cores.length).toFixed(2);
  const celulas = cores
    .map((c, i) => {
      const prox = cores[Math.min(i + 1, cores.length - 1)];
      return `<td width="${w}%" height="${h}" bgcolor="${c}" style="background-color:${c};background-image:linear-gradient(90deg,${c},${prox});font-size:0;line-height:0;height:${h}px;">&nbsp;</td>`;
    })
    .join("");
  return `<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${celulas}</tr></table></td></tr>`;
}

// E-mail em tema claro: tabela 600px, inline-style, compatível com Gmail/Outlook.
export function blocoEmail(feature) {
  const cadastro = linkCadastro(feature, "email");
  const saiba = linkMesalva(feature, "email");
  const fonte = B.font.emailStack;
  return `<tr><td style="padding:0 28px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${L.bg}" style="border-collapse:separate;background-color:${L.bg};border:1px solid ${L.border};border-radius:${B.radius}px;">
<tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${L.card}" style="border-collapse:separate;overflow:hidden;background-color:${L.card};border-radius:12px;">
${barraCham()}
<tr><td style="padding:22px 24px 8px;font-family:${fonte};color:${L.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" style="font-family:${fonte};font-size:18px;">${WORDMARK}</td>
<td align="right" style="font-family:${fonte};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${L.muted};">Publicidade</td>
</tr></table>
<p style="margin:18px 0 8px;font-family:${fonte};font-size:10.5px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;color:${VIOLETA};">${esc(feature.kicker)}</p>
<p style="margin:0 0 10px;font-family:${fonte};font-size:21px;line-height:1.25;font-weight:800;color:${L.ink};">${esc(feature.titulo)}</p>
<p style="margin:0 0 18px;font-family:${fonte};font-size:14.5px;line-height:1.6;color:${L.ink2};">${esc(feature.texto)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${VIOLETA}" style="border-radius:10px;background-color:${VIOLETA};">
<a href="${cadastro}" style="display:inline-block;padding:13px 22px;font-family:${fonte};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Começar grátis &rarr;</a>
</td>
<td style="padding-left:16px;"><a href="${saiba}" style="font-family:${fonte};font-size:13.5px;font-weight:700;color:${VIOLETA};text-decoration:underline;">${esc(feature.cta)}</a></td>
</tr></table>
<p style="margin:16px 0 0;font-family:${fonte};font-size:11.5px;line-height:1.5;color:${L.ink2};">${esc(B.promessa)}</p>
</td></tr>
<tr><td style="padding:14px 24px 18px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${L.border};padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.5;color:${L.ink2};">${esc(B.compliance)}</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</td></tr>`;
}

// Mesma peça para o conteudo_html do post (sem <style>, só inline). Variante escura:
// o site é escuro e o .post-content herda justify/cores, então tudo é explícito.
export function blocoPost(feature) {
  const cadastro = linkCadastro(feature, "post");
  const saiba = linkMesalva(feature, "post");
  const fonte = B.font.stack;
  return `<div data-mesalva-ad="post" style="margin:2.5rem 0 1rem;border-radius:${B.radius}px;border:1px solid ${D.border};background:${D.card};overflow:hidden;font-family:${fonte};">
<div style="height:4px;background:${B.gradient.cham};"></div>
<div style="padding:1.4rem 1.6rem 1.5rem;">
<p style="margin:0 0 .9rem;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:${D.muted};text-align:left;"><span style="font-size:1.1rem;letter-spacing:-.02em;text-transform:none;font-weight:800;color:${D.ink};">Me<span style="color:${D.primary};">$</span>alva</span> &nbsp;&middot;&nbsp; Publicidade</p>
<p style="margin:0 0 .45rem;font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:${D.primary};text-align:left;">${esc(feature.kicker)}</p>
<p style="margin:0 0 .5rem;font-size:1.25rem;line-height:1.25;font-weight:800;color:${D.ink};text-align:left;">${esc(feature.titulo)}</p>
<p style="margin:0 0 1.1rem;font-size:.95rem;line-height:1.6;color:${D.ink};opacity:.88;text-align:left;">${esc(feature.texto)}</p>
<p style="margin:0;text-align:left;"><a href="${cadastro}" target="_blank" rel="noopener" style="display:inline-block;padding:.8rem 1.4rem;border-radius:${B.radius}px;background:${B.gradient.purple};box-shadow:${B.shadowCta};color:#ffffff;font-size:.85rem;font-weight:700;text-decoration:none;">Começar grátis &rarr;</a>
<a href="${saiba}" target="_blank" rel="noopener" style="margin-left:1rem;font-size:.85rem;font-weight:700;color:${D.primary};">${esc(feature.cta)}</a></p>
<p style="margin:1rem 0 0;font-size:.72rem;line-height:1.5;color:${D.muted};text-align:left;">${esc(B.promessa)}</p>
<p style="margin:.4rem 0 0;font-size:.66rem;line-height:1.5;color:${D.muted};text-align:left;">${esc(B.compliance)}</p>
</div></div>`;
}

// CLI: node scripts/mesalva-ad.mjs --preview [AAAA-MM-DD] [--out arquivo.html]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === "--preview") {
    const date = args[1] && /^\d{4}-\d{2}-\d{2}$/.test(args[1]) ? args[1] : new Date().toISOString().slice(0, 10);
    const outIdx = args.indexOf("--out");
    const out = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, "..", "tmp-mesalva-preview.html");
    const f = escolherFeature(date);
    console.log(`Peça MeSalva de ${date}: ${f.id} — ${f.titulo}`);
    const email = `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#fff;max-width:100%;"><tr><td style="padding:24px 28px 8px;font-size:15px;">Bom dia e bons investimentos,<br><strong>Rainiere Rocha</strong></td></tr>${blocoEmail(f)}</table>`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview MeSalva ${date}</title>${EMAIL_HEAD_EXTRAS}
<style>body{margin:0;background:#f4f2ee;font-family:Georgia,serif;color:#1c1b19}h3{font-family:Arial,sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#9a7a2e;margin:32px 16px 8px}.post{background:#0a0a0a;padding:24px;max-width:720px;margin:0 auto 40px}.dark{filter:invert(1) hue-rotate(180deg);background:#f4f2ee}</style></head><body>
<h3>E-mail (tabela 600px)</h3>
${email}
<h3>E-mail — simulação dark mode (Gmail)</h3>
<div class="dark">${email}</div>
<h3>Post (conteudo_html)</h3>
<div class="post">${blocoPost(f)}</div>
</body></html>`;
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, html);
    console.log(`Preview salvo em ${out}`);
  } else {
    console.log("Uso: node scripts/mesalva-ad.mjs --preview [AAAA-MM-DD] [--out arquivo.html]");
    for (const f of FEATURES) console.log(` - ${f.id}: ${f.titulo}`);
  }
}
