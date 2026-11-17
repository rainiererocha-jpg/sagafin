// Renderiza carrossel (1080×1350) e stories (1080×1920) em PNG com Playwright, na identidade do site
// (preto #0b0b0b, dourado #d4a53c, Cormorant Garamond + Inter). Sem dependência de fontes locais.
import { escapeHtml as esc } from "../lib/util.mjs";

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#0b0b0b}
body{font-family:Inter,Arial,sans-serif;color:#efe9dc;overflow:hidden;position:relative}
.serif{font-family:'Cormorant Garamond',Georgia,serif}
.gold{color:#d4a53c}
.eyebrow{font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:#d4a53c;font-weight:600}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(212,165,60,.20),transparent 65%);pointer-events:none}
.brand{position:absolute;left:84px;right:84px;bottom:64px;display:flex;justify-content:space-between;align-items:center;font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:#8b8476}
.brand b{color:#efe9dc;font-weight:600;letter-spacing:.18em}
.rule{width:90px;height:3px;background:#d4a53c}
.wrap{position:absolute;left:84px;right:84px;top:100px;bottom:150px;display:flex;flex-direction:column;justify-content:center}
.wrap-s{position:absolute;left:90px;right:90px;top:200px;bottom:260px;display:flex;flex-direction:column;justify-content:center}
.topo{position:absolute;left:84px;right:84px;top:96px;display:flex;justify-content:space-between;align-items:baseline}
`;

/** Ajusta o tamanho da fonte do título ao comprimento (evita estourar o quadro). */
function tamTitulo(t, max, min) {
  const n = String(t || "").length;
  if (n <= 40) return max;
  if (n >= 110) return min;
  return Math.round(max - ((n - 40) / 70) * (max - min));
}

function slideCapa(s, meta) {
  return `<div class="glow" style="width:900px;height:900px;right:-300px;top:-260px"></div>
<div class="wrap">
  <div class="eyebrow">${esc(meta.eyebrow)}</div>
  <h1 class="serif" style="font-size:${tamTitulo(s.titulo, 118, 84)}px;line-height:1.02;font-weight:600;color:#fff;margin:44px 0 40px">${esc(s.titulo)}</h1>
  <div class="rule"></div>
  ${s.subtitulo ? `<p style="font-size:42px;line-height:1.45;color:#c9c2b3;margin-top:44px;max-width:880px">${esc(s.subtitulo)}</p>` : ""}
</div>
<div style="position:absolute;right:84px;bottom:150px;font-size:26px;letter-spacing:.2em;text-transform:uppercase;color:#d4a53c">Arraste →</div>`;
}

function slideConteudo(s, meta, i, total) {
  return `<div class="glow" style="width:700px;height:700px;left:-320px;bottom:-280px"></div>
<div class="topo">
  <div class="eyebrow">${esc(s.kicker || meta.eyebrowCurto)}</div>
  <div class="serif gold" style="font-size:44px;font-weight:700">${String(i + 1).padStart(2, "0")}<span style="color:#5d574c">/${String(total).padStart(2, "0")}</span></div>
</div>
<div class="wrap">
  <h2 class="serif" style="font-size:${tamTitulo(s.titulo, 92, 68)}px;line-height:1.06;font-weight:600;color:#fff;margin:0 0 40px">${esc(s.titulo)}</h2>
  ${s.destaque ? `<div class="serif gold" style="font-size:${String(s.destaque).length > 12 ? 104 : 150}px;font-weight:700;line-height:1;margin:0 0 30px">${esc(s.destaque)}</div>` : ""}
  <p style="font-size:${String(s.texto || "").length > 200 ? 40 : 46}px;line-height:1.5;color:#d8d1c2">${esc(s.texto || "")}</p>
</div>`;
}

function slideCta(meta) {
  return `<div class="glow" style="width:1100px;height:1100px;left:-10px;top:-420px"></div>
<div class="wrap">
  <div class="eyebrow">Material gratuito</div>
  <h2 class="serif" style="font-size:92px;line-height:1.02;font-weight:600;color:#fff;margin:40px 0 30px">Quer ir além<br>deste post?</h2>
  <p style="font-size:38px;line-height:1.45;color:#c9c2b3;max-width:880px">Receba o <b style="color:#fff">Manual Completo do Investidor</b>: da organização financeira ao mercado futuro, em 12 capítulos.</p>
  <div style="margin-top:56px;border:3px solid #d4a53c;border-radius:18px;padding:40px 44px;background:rgba(212,165,60,.07)">
    <div style="font-size:30px;letter-spacing:.2em;text-transform:uppercase;color:#c9c2b3">Comente</div>
    <div class="serif gold" style="font-size:132px;font-weight:700;line-height:1.05">${esc(meta.cta)}</div>
    <div style="font-size:30px;color:#c9c2b3">que eu te mando o link no direct.</div>
  </div>
  <p style="font-size:26px;color:#8b8476;margin-top:40px">Ou acesse sagafin.com.br/manual</p>
</div>`;
}

function storyDado(s) {
  const cor = /^-|−/.test(String(s.variacao || "")) ? "#e0806b" : "#d4a53c";
  return `<div class="glow" style="width:1200px;height:1200px;right:-500px;top:-200px"></div>
<div class="wrap-s">
  <div class="eyebrow">Diário Saga · ${esc(s.data || "")}</div>
  <div style="font-size:48px;color:#c9c2b3;margin-top:70px">${esc(s.rotulo)}</div>
  <div class="serif" style="font-size:${String(s.valor).length > 9 ? 150 : 200}px;font-weight:700;color:#fff;line-height:1;margin-top:20px">${esc(s.valor)}</div>
  ${s.variacao ? `<div style="font-size:64px;font-weight:600;color:${cor};margin-top:24px">${esc(s.variacao)}</div>` : ""}
  <div class="rule" style="margin:80px 0 60px"></div>
  <p style="font-size:54px;line-height:1.45;color:#e6dfd1">${esc(s.comentario || "")}</p>
</div>`;
}

function storyInsight(s) {
  return `<div class="glow" style="width:1200px;height:1200px;left:-500px;bottom:-200px"></div>
<div class="wrap-s">
  <div class="eyebrow">${esc(s.kicker || "O que isso muda para você")}</div>
  <p class="serif" style="font-size:${String(s.texto).length > 160 ? 84 : 104}px;line-height:1.12;font-weight:600;color:#fff;margin-top:70px">${esc(s.texto)}</p>
</div>`;
}

function storyCta(meta) {
  return `<div class="glow" style="width:1400px;height:1400px;left:-200px;top:-300px"></div>
<div class="wrap-s">
  <div class="eyebrow">Grátis para você</div>
  <h2 class="serif" style="font-size:110px;line-height:1.02;font-weight:600;color:#fff;margin:60px 0 40px">Manual Completo<br>do <span class="gold">Investidor</span></h2>
  <p style="font-size:46px;line-height:1.45;color:#c9c2b3">Da organização financeira ao mercado futuro. 12 capítulos, linguagem simples.</p>
  <div style="margin-top:90px;border:3px solid #d4a53c;border-radius:22px;padding:46px;text-align:center;background:rgba(212,165,60,.08)">
    <div style="font-size:36px;letter-spacing:.18em;text-transform:uppercase;color:#c9c2b3">Responda este story com</div>
    <div class="serif gold" style="font-size:140px;font-weight:700;line-height:1.1">${esc(meta.cta)}</div>
    <div style="font-size:36px;color:#c9c2b3">ou toque no link: sagafin.com.br/manual</div>
  </div>
</div>`;
}

function pagina(inner, w, h) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${BASE_CSS} body{width:${w}px;height:${h}px}</style></head>
<body>${inner}<div class="brand"><b>Saga Financeira</b><span>Conteúdo educacional</span></div></body></html>`;
}

/** Monta o HTML de cada peça. `conteudo` = saída validada do modelo. */
export function montarHtml(conteudo, meta) {
  const slides = conteudo.slides;
  const total = slides.length + 1; // + CTA
  const carrossel = [
    pagina(slideCapa(slides[0], meta), 1080, 1350),
    ...slides.slice(1).map((s, i) => pagina(slideConteudo(s, meta, i + 1, total), 1080, 1350)),
    pagina(slideCta(meta), 1080, 1350),
  ];
  const stories = [
    ...(conteudo.stories || []).map((s) => pagina(s.tipo === "dado" ? storyDado({ ...s, data: meta.ddmm }) : storyInsight(s), 1080, 1920)),
    pagina(storyCta(meta), 1080, 1920),
  ];
  return { carrossel, stories };
}

/** Renderiza para PNG. Devolve { carrossel: Buffer[], stories: Buffer[] }. */
export async function renderizar(htmls) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("Playwright não instalado (npm i --no-save playwright && npx playwright install chromium)");
  }
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  try {
    const shot = async (html, w, h) => {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const buf = await page.screenshot({ type: "png" });
      await page.close();
      return buf;
    };
    const carrossel = [];
    for (const h of htmls.carrossel) carrossel.push(await shot(h, 1080, 1350));
    const stories = [];
    for (const h of htmls.stories) stories.push(await shot(h, 1080, 1920));
    return { carrossel, stories };
  } finally {
    await browser.close();
  }
}
