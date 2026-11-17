'use strict';
// Gera public/ebooks/manual-completo-investidor.pdf e public/og/manual-investidor.jpg
// (isca do funil "comente EU QUERO" → sagafin.com.br/manual).
// Uso: node scripts/generate-manual-investidor.cjs
// Precisa do Playwright (`npm i --no-save playwright && npx playwright install chromium`)
// ou de um Chrome local em CHROME_PATH. Conteúdo em scripts/manual-investidor/conteudo.cjs.
const fs = require('fs');
const path = require('path');
const { capitulos, glossario } = require('./manual-investidor/conteudo.cjs');
const { fotoDataUri, fundoCss, svgPlanejamento } = require('./brand/fundo.cjs');

const ROOT = path.join(__dirname, '..');
const PDF_OUT = path.join(ROOT, 'public', 'ebooks', 'manual-completo-investidor.pdf');
const OG_OUT = path.join(ROOT, 'public', 'og', 'manual-investidor.jpg');
const VERSAO = 'Edição novembro de 2026';

const AVISO =
  'Rainiere Rocha é assessor de investimentos vinculado à Invest Smart Assessor de Investimento Ltda. (CNPJ 19.438.577/0001-08), ' +
  'registrada na CVM na forma da Resolução CVM 178/23, que mantém contrato de distribuição com a XP Investimentos CCTVM S.A. ' +
  'O assessor de investimento não pode administrar ou gerir o patrimônio de investidores. Este manual é material exclusivamente ' +
  'educacional: não constitui oferta, recomendação de compra ou venda de qualquer ativo, relatório de análise (Resolução CVM 20) ' +
  'ou consultoria de valores mobiliários. Os exemplos usam números hipotéticos. Rentabilidade passada não é garantia de ' +
  'rentabilidade futura. Investimentos em renda variável e derivativos envolvem risco, inclusive de perdas superiores ao capital ' +
  'investido. Regras tributárias citadas refletem a legislação na data desta edição e podem mudar. Antes de investir, verifique a ' +
  'adequação ao seu perfil. Ouvidoria XP: 0800 722 3730.';

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

const CSS = `
@page{size:A4;margin:0;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--fundo-capa:${fundoCss({ brilhoX: 74, brilhoY: 72 })};--fundo-cta:${fundoCss({ brilhoX: 80, brilhoY: 55 })};--gold:#d4a53c;--gold-d:#9a7a2e;--ink:#17150f;--muted:#5d574c;--paper:#fbf8f2;--line:#e6dfd1;}
body{font-family:Inter,Arial,sans-serif;font-size:10.5pt;color:var(--ink);line-height:1.62;background:var(--paper);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.page{width:210mm;height:297mm;overflow:hidden;padding:22mm 20mm 20mm;position:relative;page-break-after:always;background:var(--paper);}
.page:last-child{page-break-after:auto;}
.dark{background:#0b0b0b;color:#efe9dc;}
.serif{font-family:'Cormorant Garamond',Georgia,serif;}
.eyebrow{font-size:7.5pt;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);font-weight:600;}
.cover{padding:0;overflow:hidden;background:var(--fundo-capa);}
.cover .brand{position:absolute;top:18mm;left:20mm;right:20mm;display:flex;justify-content:space-between;align-items:center;font-size:8pt;letter-spacing:.25em;text-transform:uppercase;color:#a49d8e;z-index:3;}
.cover .topo{position:absolute;top:36mm;left:20mm;right:20mm;z-index:3;}
.cover h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:50pt;line-height:.98;color:#fff;margin:12px 0 14px;}
.cover h1 em{font-style:normal;color:var(--gold);}
.cover .sub{font-size:12pt;color:#d2cbbd;max-width:118mm;line-height:1.5;}
.cover .pilares{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;}
.cover .pilares span{font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;color:#0b0b0b;background:var(--gold);padding:5px 10px;border-radius:99px;font-weight:600;}
.cover .foto{position:absolute;right:-8mm;bottom:0;height:150mm;z-index:2;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55));}
.cover .trilha{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}
.cover .trilha div{border:1px solid rgba(212,165,60,.35);background:rgba(11,11,11,.72);border-radius:6px;padding:9px 12px;font-size:8.5pt;color:#e0d9ca;}
.cover .trilha b{display:block;color:var(--gold);font-size:7pt;letter-spacing:.2em;text-transform:uppercase;margin-bottom:2px;}
.cover .autor{position:absolute;left:20mm;bottom:18mm;font-size:8pt;line-height:1.45;color:#b8b0a0;z-index:3;width:50mm;}
.cover .autor b{color:#fff;font-weight:600;font-size:11pt;display:block;letter-spacing:.02em;}
.toc h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:30pt;font-weight:600;margin:8px 0 14px;}
.toc ol{list-style:none;}
.toc li{display:flex;gap:14px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--line);}
.toc li span:first-child{font-family:'Cormorant Garamond',Georgia,serif;color:var(--gold-d);font-size:15pt;font-weight:700;width:30px;}
.toc li b{font-weight:600;}
.toc li small{display:block;color:var(--muted);font-size:9pt;}
.cap-head{border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:18px;}
.cap-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:54pt;line-height:.9;color:var(--gold);font-weight:700;float:right;opacity:.85;}
.cap-head h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:25pt;line-height:1.1;margin:8px 0 10px;max-width:140mm;}
.cap-head .lead{color:var(--muted);font-size:11pt;font-style:italic;max-width:150mm;}
h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:15pt;font-weight:700;margin:11px 0 5px;color:#2a251b;}
p{margin:0 0 8px;}
ul,ol{margin:0 0 10px 18px;}
li{margin:0 0 4px;}
strong{font-weight:600;}
table{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:9.5pt;}
th{background:#17150f;color:#efe9dc;text-align:left;padding:7px 9px;font-weight:600;font-size:8.5pt;letter-spacing:.04em;}
td{padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top;}
tr:nth-child(odd) td{background:#f4efe4;}
.num-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 14px;}
.num-grid div{border:1px solid var(--line);border-top:3px solid var(--gold);background:#fff;border-radius:4px;padding:10px 11px;}
.num-grid strong{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:17pt;color:var(--gold-d);line-height:1.1;margin-bottom:3px;}
.num-grid span{font-size:8.8pt;color:var(--muted);line-height:1.45;display:block;}
.box,.box-gold{border-radius:6px;padding:11px 14px;margin:12px 0;font-size:9.8pt;}
.box{background:#efe9dc;border-left:3px solid #8c8577;}
.box-gold{background:#17150f;color:#efe9dc;border-left:3px solid var(--gold);}
.box-gold strong{color:var(--gold);}
.nota{font-size:8.5pt;color:var(--muted);font-style:italic;}
.foot{position:absolute;bottom:10mm;left:20mm;right:20mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#a39b8b;border-top:1px solid var(--line);padding-top:6px;}
.gloss dl{display:grid;grid-template-columns:42mm 1fr;gap:0;}
.gloss dt{font-weight:600;padding:7px 0;border-bottom:1px solid var(--line);}
.gloss dd{padding:7px 0;border-bottom:1px solid var(--line);color:var(--muted);}
.cta{padding:24mm 20mm;overflow:hidden;background:var(--fundo-cta);}
.cta .txt{position:relative;z-index:3;width:112mm;}
.cta h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:32pt;line-height:1.06;color:#fff;font-weight:600;margin:12px 0 14px;}
.cta h2 em{font-style:normal;color:var(--gold);}
.cta p{color:#d2cbbd;font-size:10.5pt;}
.cta .passos{margin:18px 0;display:grid;gap:9px;}
.cta .passos div{border:1px solid rgba(212,165,60,.35);background:rgba(11,11,11,.7);border-radius:6px;padding:10px 12px;color:#e6dfd1;font-size:9.5pt;}
.cta .passos b{color:var(--gold);}
.cta .foto{position:absolute;right:-10mm;bottom:66mm;height:110mm;z-index:2;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55));}
.cta .aviso{position:absolute;left:20mm;right:20mm;bottom:14mm;font-size:6.8pt;line-height:1.5;color:#8b8476;z-index:3;}
`;

function foot(n) {
  return `<div class="foot"><span>Saga Financeira · Manual Completo do Investidor</span><span>${n}</span></div>`;
}

function htmlManual() {
  const foto = fotoDataUri('webp');
  const capa = `
<section class="page dark cover">
  ${svgPlanejamento(794, 1123)}
  <div class="brand"><span>Saga Financeira</span><span>${VERSAO}</span></div>
  <div class="topo">
    <div class="eyebrow">Manual gratuito · Biblioteca Saga</div>
    <h1>Manual Completo<br>do <em>Investidor</em></h1>
    <p class="sub">Da organização financeira ao mercado futuro: o caminho completo, em 12 capítulos, para investir com método e sem achismo.</p>
    <div class="pilares"><span>Planejamento</span><span>Organização</span><span>Investimento</span></div>
  <div class="trilha">
      <div><b>Base</b>Orçamento, reserva, perfil e objetivos</div>
      <div><b>Carteira</b>Renda fixa, crédito, FIIs, ações, exterior, PGBL</div>
      <div><b>Avançado</b>FIRE, opções e mercado futuro</div>
    </div>
  </div>
  <img class="foto" src="${foto}" alt="Rainiere Rocha">
  <div class="autor"><b>Rainiere Rocha</b>Assessor de Investimentos<br>XP Investimentos via InvestSmart<br>Goiânia</div>
</section>`;

  const toc = `
<section class="page toc">
  <div class="eyebrow">Conteúdo</div>
  <h2>O que você vai aprender</h2>
  <ol>${capitulos
    .map((c) => `<li><span>${c.num}</span><div><b>${c.eyebrow}</b><small>${c.titulo}</small></div></li>`)
    .join('')}
    <li><span>+</span><div><b>Glossário</b><small>Os termos que aparecem no extrato e nas conversas sobre investimento.</small></div></li>
  </ol>
  ${foot('02')}
</section>`;

  const caps = capitulos
    .map(
      (c, i) => `
<section class="page">
  <div class="cap-head">
    <span class="cap-num">${c.num}</span>
    <div class="eyebrow">Capítulo ${c.num} · ${c.eyebrow}</div>
    <h2>${c.titulo}</h2>
    <p class="lead">${c.lead}</p>
  </div>
  ${c.html}
  ${foot(String(i + 3).padStart(2, '0'))}
</section>`
    )
    .join('');

  const gloss = `
<section class="page gloss">
  <div class="cap-head"><div class="eyebrow">Consulta rápida</div><h2>Glossário</h2></div>
  <dl>${glossario.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl>
  ${foot(String(capitulos.length + 3).padStart(2, '0'))}
</section>`;

  const cta = `
<section class="page dark cta">
  ${svgPlanejamento(794, 1123, { opacidade: 0.7 })}
  <img class="foto" src="${foto}" alt="Rainiere Rocha">
  <div class="txt">
  <div class="eyebrow">Próximo passo</div>
  <h2>Conhecimento organizado.<br>Agora, a <em>sua</em> carteira.</h2>
  <p>Este manual mostra o mapa. O diagnóstico mostra onde você está nele. Se você tem a partir de R$ 100 mil investidos, eu olho a sua carteira e devolvo o que está coerente com seus objetivos e o que merece atenção.</p>
  <div class="passos">
    <div><b>1.</b> Responda o e-mail em que recebeu este manual, ou chame no WhatsApp (62) 99416-0930.</div>
    <div><b>2.</b> Envie um print do extrato (pode esconder nome e número da conta).</div>
    <div><b>3.</b> Em 20 minutos, por vídeo ou áudio, você recebe o diagnóstico. Sem compromisso.</div>
  </div>
  <p>Todo dia útil, às 9h30, o <b style="color:#d4a53c">Diário Saga</b> chega no seu e-mail com o resumo do mercado. Você já está inscrito.</p>
  </div>
  <p class="aviso">${AVISO}</p>
</section>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${capa}${toc}${caps}${gloss}${cta}</body></html>`;
}

function htmlOg() {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${fundoCss({ brilhoX: 78, brilhoY: 70 })};color:#fff;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.t{position:absolute;left:72px;top:96px;width:640px;z-index:2}
.e{font-size:16px;letter-spacing:.3em;text-transform:uppercase;color:#d4a53c;font-weight:600}
h1{font-family:'Cormorant Garamond',serif;font-size:82px;line-height:.98;font-weight:600;margin:18px 0 20px}
h1 em{font-style:normal;color:#d4a53c}
p{font-size:25px;color:#d2cbbd;line-height:1.4}
.pl{display:flex;gap:10px;margin-top:26px}.pl span{font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#0b0b0b;background:#d4a53c;padding:7px 14px;border-radius:99px;font-weight:600}
img{position:absolute;right:-10px;bottom:0;height:600px;z-index:1;filter:drop-shadow(0 10px 30px rgba(0,0,0,.5))}
.b{position:absolute;bottom:40px;left:72px;font-size:15px;letter-spacing:.25em;text-transform:uppercase;color:#8b8476;z-index:2}
</style></head><body>${svgPlanejamento(1200, 630, { opacidade: 0.8 })}<img src="${fotoDataUri('webp')}" alt=""><div class="t"><div class="e">Gratuito · 12 capítulos</div><h1>Manual Completo<br>do <em>Investidor</em></h1><p>Da organização financeira ao mercado futuro.</p><div class="pl"><span>Planejamento</span><span>Organização</span><span>Investimento</span></div></div><div class="b">Saga Financeira · Rainiere Rocha</div></body></html>`;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('✖ Playwright não encontrado. Rode: npm i --no-save playwright && npx playwright install chromium');
    process.exit(1);
  }
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  try {
    const page = await browser.newPage();
    await page.setContent(htmlManual(), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(PDF_OUT), { recursive: true });
    await page.pdf({ path: PDF_OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(`✓ ${path.relative(ROOT, PDF_OUT)}`);

    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.setContent(htmlOg(), { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(OG_OUT), { recursive: true });
    await og.screenshot({ path: OG_OUT, type: 'jpeg', quality: 88 });
    console.log(`✓ ${path.relative(ROOT, OG_OUT)}`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { htmlManual };
