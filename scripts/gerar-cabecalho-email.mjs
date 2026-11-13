// Gera public/email/rainiere-cabecalho.jpg: busto do Rainiere fundido no preto do cabeçalho dos e-mails.
// A "transparência" fica gravada na imagem porque opacidade/sobreposição por CSS não funcionam no Outlook.
// Uso (uma vez, ou quando trocar a foto): node scripts/gerar-cabecalho-email.mjs
// Requer Chrome instalado; CHROME_PATH sobrescreve o caminho.
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOTO = path.join(raiz, "src/assets/rainiere-hero.jpg"); // 1920x1280
const SAIDA = path.join(raiz, "public/email/rainiere-cabecalho.jpg");
const FUNDO = "#0b0b0b";
const LADO = 360; // px (exibida a 150px no e-mail; sobra para telas retina)
// Recorte quadrado na foto original: canto superior esquerdo e lado, em px.
const CORTE = { x: 610, y: 70, lado: 640 };

const chrome = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));
if (!chrome) throw new Error("Chrome não encontrado; defina CHROME_PATH.");

const k = LADO / CORTE.lado;
const b64 = (await readFile(FOTO)).toString("base64");
const html = `<!doctype html><html><body style="margin:0;background:${FUNDO};">
<div style="position:relative;width:${LADO}px;height:${LADO}px;overflow:hidden;background:${FUNDO};">
  <img src="data:image/jpeg;base64,${b64}" style="position:absolute;left:${-CORTE.x * k}px;top:${-CORTE.y * k}px;width:${1920 * k}px;filter:saturate(.85) brightness(.95);">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,${FUNDO} 0%,rgba(11,11,11,.75) 22%,rgba(11,11,11,0) 55%);"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(0deg,${FUNDO} 0%,rgba(11,11,11,0) 38%);"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,${FUNDO} 0%,rgba(11,11,11,0) 14%);"></div>
  <div style="position:absolute;inset:0;background:rgba(11,11,11,.12);"></div>
</div></body></html>`;

await mkdir(path.dirname(SAIDA), { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: LADO, height: LADO, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: SAIDA, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: LADO, height: LADO } });
} finally {
  await browser.close();
}
console.log(`✓ ${path.relative(raiz, SAIDA)}`);
