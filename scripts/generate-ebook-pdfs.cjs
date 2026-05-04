// generate-ebook-pdfs.js
// Exporta os 10 ebooks do Gamma como PDFs com rodapé assinado e faz upload no Supabase Storage.

const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SUPABASE_URL = 'https://vcmnfnsjgfbudypewvjx.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbW5mbnNqZ2ZidWR5cGV3dmp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0ODU0MywiZXhwIjoyMDkxNDI0NTQzfQ.HKgW7-d_1zQ2lPM4jNviHqEwSPyW2wpNXyA89g_C3Ko';

const EBOOKS = [
  { id: 'eb-primeiros-passos',   file: 'primeiros-passos-do-investidor.pdf',  url: 'https://gamma.app/docs/rxxzyuwmvygd2ja' },
  { id: 'eb-renda-fixa',         file: 'renda-fixa-descomplicada.pdf',         url: 'https://gamma.app/docs/popejcjkjn044qh' },
  { id: 'eb-tesouro-direto',     file: 'tesouro-direto-guia-definitivo.pdf',   url: 'https://gamma.app/docs/j62lhidylexzeh6' },
  { id: 'eb-tesouro-americano',  file: 'titulos-tesouro-americano.pdf',         url: 'https://gamma.app/docs/7odpgk1r8qczlk9' },
  { id: 'eb-debentures',         file: 'debentures-credito-privado.pdf',        url: 'https://gamma.app/docs/e4zoq7d5c7tidpk' },
  { id: 'eb-fiis',               file: 'fiis-do-zero-ao-avancado.pdf',          url: 'https://gamma.app/docs/9vzznkv4i051tws' },
  { id: 'eb-dividendos',         file: 'dividendos-renda-passiva-eterna.pdf',   url: 'https://gamma.app/docs/ueebjbxsmx1fobb' },
  { id: 'eb-derivativos',        file: 'derivativos-10-estrategias.pdf',        url: 'https://gamma.app/docs/s9m024gkmfz5it6' },
  { id: 'eb-fire',               file: 'fire-no-brasil.pdf',                    url: 'https://gamma.app/docs/r3gbm6ugiagchx6' },
  { id: 'eb-melhores-praticas',  file: 'melhores-praticas-do-investidor.pdf',   url: 'https://gamma.app/docs/2b3kbwwpkyotnot' },
];

// ─── Footer template (inline CSS obrigatório no puppeteer) ───────────────────

const FOOTER_TEMPLATE = `
<div style="
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 8.5px;
  padding: 5px 38px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 0.5px solid #cccccc;
  box-sizing: border-box;
  color: #999999;
  margin-top: 2px;
">
  <span style="
    color: #B8962A;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    font-size: 7.5px;
  ">Rainiere Rocha &nbsp;·&nbsp; Assessor de Investimentos &nbsp;·&nbsp; XP Investimentos</span>
  <span style="font-size: 8px; color: #bbbbbb;">
    <span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span>
  </span>
</div>
`;

const HEADER_TEMPLATE = '<div></div>';

const OUTPUT_DIR = path.join(__dirname, '..', 'ebooks');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('🚀 Iniciando exportação de ebooks para PDF...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,900',
    ],
  });

  const results = [];

  for (let i = 0; i < EBOOKS.length; i++) {
    const ebook = EBOOKS[i];
    console.log(`[${i + 1}/${EBOOKS.length}] 📖 ${ebook.file}`);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });

      // Bloqueia recursos desnecessários para acelerar o carregamento
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const type = req.resourceType();
        if (['font', 'media'].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log(`   → Carregando ${ebook.url}`);
      await page.goto(ebook.url, { waitUntil: 'networkidle2', timeout: 90000 });

      // Aguarda o Gamma renderizar todo o conteúdo dinâmico
      await sleep(10000);

      console.log(`   → Gerando PDF...`);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: HEADER_TEMPLATE,
        footerTemplate: FOOTER_TEMPLATE,
        margin: { top: '12mm', bottom: '20mm', left: '10mm', right: '10mm' },
        printBackground: true,
        preferCSSPageSize: false,
        timeout: 60000,
      });

      await page.close();

      const sizeKB = Math.round(pdfBuffer.length / 1024);
      console.log(`   ✓ PDF gerado: ${sizeKB} KB`);

      // Salva localmente
      const localPath = path.join(OUTPUT_DIR, ebook.file);
      fs.writeFileSync(localPath, pdfBuffer);

      // Upload para Supabase Storage
      const storagePath = `ebooks/${ebook.file}`;
      console.log(`   → Upload para Storage: ${storagePath}`);

      const { error } = await supabase.storage
        .from('biblioteca')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        throw new Error(`Upload falhou: ${error.message}`);
      }

      const { data: urlData } = supabase.storage.from('biblioteca').getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;
      console.log(`   ✓ Disponível em: ${publicUrl}\n`);

      results.push({ ...ebook, success: true, storagePath, publicUrl, sizeKB });

    } catch (err) {
      console.error(`   ✗ ERRO: ${err.message}\n`);
      results.push({ ...ebook, success: false, error: err.message });
    }
  }

  await browser.close();

  // ─── Relatório final ────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════');
  console.log('                RELATÓRIO FINAL               ');
  console.log('══════════════════════════════════════════════');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(r => console.log(`✓ ${r.id} (${r.sizeKB}KB) → ${r.publicUrl}`));
  if (failed.length > 0) {
    console.log('\nFALHAS:');
    failed.forEach(r => console.log(`✗ ${r.id}: ${r.error}`));
  }

  console.log(`\n${successful.length}/${EBOOKS.length} ebooks exportados com sucesso.`);

  // ─── Mapeamento para biblioteca.ts ─────────────────────────────────────────

  if (successful.length > 0) {
    console.log('\n══════════════════════════════════════════════');
    console.log('   ATUALIZAR biblioteca.ts (arquivo → path)   ');
    console.log('══════════════════════════════════════════════');
    successful.forEach(r => {
      console.log(`"${r.id}" → arquivo: "${r.storagePath}"`);
    });
  }

  return results;
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
