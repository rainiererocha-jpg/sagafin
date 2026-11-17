'use strict';
// Identidade visual dos materiais com foto: degradê preto → bronze com brilho dourado e elementos de
// planejamento financeiro desenhados em SVG (grade de gráfico, curva de patrimônio, barras 50-30-20, anel de alocação).
// Usado pelo manual (generate-manual-investidor.cjs) e pelo motor social (scripts/social/render.mjs).
const fs = require('fs');
const path = require('path');

const FOTO_PNG = path.join(__dirname, '..', '..', 'public', 'brand', 'rainiere-recorte.png');
const FOTO_WEBP = path.join(__dirname, '..', '..', 'public', 'brand', 'rainiere-recorte.webp');

let cache = {};
/** Foto recortada do Rainiere como data URI (webp para telas; png para o PDF). */
function fotoDataUri(formato = 'webp') {
  if (!cache[formato]) {
    const arq = formato === 'png' ? FOTO_PNG : FOTO_WEBP;
    cache[formato] = `data:image/${formato};base64,${fs.readFileSync(arq).toString('base64')}`;
  }
  return cache[formato];
}

/** CSS de fundo: degradê + brilho dourado posicionado atrás da foto (x%, y%). */
function fundoCss({ brilhoX = 72, brilhoY = 68 } = {}) {
  return (
    `radial-gradient(ellipse 55% 45% at ${brilhoX}% ${brilhoY}%, rgba(212,165,60,.34), rgba(212,165,60,.08) 55%, transparent 75%),` +
    'radial-gradient(ellipse 70% 50% at 0% 0%, rgba(212,165,60,.10), transparent 60%),' +
    'linear-gradient(165deg, #0b0b0b 0%, #12100c 38%, #1d160c 72%, #2b1f0b 100%)'
  );
}

/**
 * SVG de "planejamento" para ficar entre o degradê e a foto. Ocupa o quadro todo (w × h).
 * Elementos: grade fina, curva de patrimônio ascendente com marcos, barras 50-30-20 e anel de alocação.
 */
function svgPlanejamento(w, h, { opacidade = 1 } = {}) {
  const g = [];
  const passo = Math.round(w / 12);
  for (let x = passo; x < w; x += passo) g.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  for (let y = passo; y < h; y += passo) g.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);

  // Curva de patrimônio (juros compostos) do canto inferior esquerdo ao superior direito.
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = w * (0.04 + 0.92 * t);
    const y = h * (0.92 - 0.62 * (Math.pow(1.13, i) - 1) / (Math.pow(1.13, n) - 1)) + Math.sin(i * 1.7) * h * 0.006;
    pts.push([x, y]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${d} L${pts[n][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  const marcos = [6, 12, 18, 24]
    .map((i) => `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="${(w * 0.006).toFixed(1)}" fill="#d4a53c"/>`)
    .join('');

  // Barras 50-30-20 (orçamento) no canto inferior esquerdo.
  const bx = w * 0.06, base = h * 0.95, bw = w * 0.035, gap = w * 0.018, alt = h * 0.16;
  const barras = [0.5, 0.3, 0.2]
    .map((p, i) => `<rect x="${(bx + i * (bw + gap)).toFixed(1)}" y="${(base - alt * p * 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${(alt * p * 2).toFixed(1)}" rx="2" fill="#d4a53c" fill-opacity="${0.22 - i * 0.05}"/>`)
    .join('');

  // Anel de alocação no alto à direita.
  const cx = w * 0.86, cy = h * 0.16, r = w * 0.07, c = 2 * Math.PI * r;
  const fatias = [0.45, 0.25, 0.2, 0.1];
  let acc = 0;
  const anel = fatias
    .map((f, i) => {
      const s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#d4a53c" stroke-opacity="${0.5 - i * 0.1}" stroke-width="${(w * 0.016).toFixed(1)}" stroke-dasharray="${(c * f - 3).toFixed(1)} ${c.toFixed(1)}" stroke-dashoffset="${(-c * acc).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
      acc += f;
      return s;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;inset:0;opacity:${opacidade}" aria-hidden="true">
  <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4a53c" stop-opacity=".18"/><stop offset="1" stop-color="#d4a53c" stop-opacity="0"/></linearGradient></defs>
  <g stroke="#d4a53c" stroke-opacity=".06" stroke-width="1">${g.join('')}</g>
  <path d="${area}" fill="url(#ga)"/>
  <path d="${d}" fill="none" stroke="#d4a53c" stroke-opacity=".55" stroke-width="${(w * 0.004).toFixed(1)}" stroke-linecap="round"/>
  ${marcos}${barras}${anel}
</svg>`;
}

module.exports = { fotoDataUri, fundoCss, svgPlanejamento };
