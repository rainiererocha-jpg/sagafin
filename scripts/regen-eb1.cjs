'use strict';
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const https = require('https');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbW5mbnNqZ2ZidWR5cGV3dmp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0ODU0MywiZXhwIjoyMDkxNDI0NTQzfQ.HKgW7-d_1zQ2lPM4jNviHqEwSPyW2wpNXyA89g_C3Ko';
const FOOTER = '<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;padding:4px 36px;display:flex;justify-content:space-between;align-items:center;border-top:0.5px solid #ccc;box-sizing:border-box;color:#aaa;"><span style="color:#B8962A;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-size:7.5px;">Rainiere Rocha &nbsp;·&nbsp; Assessor de Investimentos &nbsp;·&nbsp; XP Investimentos</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>';

const OUT = 'tmp-ebooks/primeiros-passos-do-investidor.pdf';

const PAGE_CSS = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Georgia,serif;font-size:11.5pt;color:#1a1a2e;line-height:1.8;}.cover{width:100%;min-height:100vh;background:linear-gradient(150deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 70px;page-break-after:always;}.badge{font-size:8pt;letter-spacing:3px;text-transform:uppercase;color:#B8962A;margin-bottom:36px;font-family:Arial,sans-serif;}.cover h1{font-size:32pt;color:#D4AF37;font-weight:bold;line-height:1.25;margin-bottom:20px;}.cover-sub{font-size:13pt;color:#94a3b8;font-style:italic;max-width:460px;margin:0 auto 40px;}.divider{width:60px;height:2px;background:#D4AF37;margin:30px auto;}.author{font-size:10pt;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;}.role{font-size:8.5pt;color:#64748b;font-family:Arial,sans-serif;letter-spacing:1px;margin-top:6px;}.chapter{padding:8px 0 28px;}.chapter+.chapter{page-break-before:always;}.ch-num{font-size:8pt;color:#B8962A;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;}h2{font-size:22pt;color:#0f172a;margin-bottom:18px;border-bottom:2.5px solid #D4AF37;padding-bottom:12px;}h3{font-size:13pt;color:#1e3a5f;margin:26px 0 10px;font-weight:bold;}p{margin-bottom:15px;text-align:justify;color:#2d2d2d;}.intro{font-size:12.5pt;color:#475569;font-style:italic;border-left:3px solid #D4AF37;padding-left:18px;margin-bottom:22px;}.box{background:#fef9ec;border-left:4px solid #D4AF37;padding:16px 20px;margin:20px 0;}.box-title{font-weight:bold;color:#8a6c00;font-size:9pt;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:7px;}.box p{margin-bottom:0;font-style:italic;color:#5a4a00;}.dark{background:#0f172a;color:#fff;padding:22px 26px;border-radius:8px;margin:22px 0;}.dark h3{color:#D4AF37;margin-top:0;}.dark li{color:#cbd5e1;margin-bottom:7px;}ul,ol{margin:10px 0 16px 26px;}li{margin-bottom:8px;}table{width:100%;border-collapse:collapse;margin:18px 0;font-size:10pt;font-family:Arial,sans-serif;}th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;}td{border-bottom:1px solid #e2e8f0;padding:9px 14px;}tr:nth-child(even) td{background:#f8fafc;}td:first-child{font-weight:600;color:#1e3a5f;}.end{background:linear-gradient(135deg,#f8f4e6,#fef9ec);border:1px solid #D4AF3780;padding:26px 30px;border-radius:10px;margin:28px 0 8px;}.end h3{color:#8a6c00;margin-bottom:10px;}.end p{color:#5a4500;margin-bottom:0;}`;

const CONTENT = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${PAGE_CSS}</style></head><body>
<div class="cover">
<div class="badge">Sagafin &middot; Assessoria de Investimentos</div>
<h1>Primeiros Passos do Investidor</h1>
<div class="cover-sub">O guia completo para quem quer comecar a investir com seguranca e inteligencia</div>
<div class="divider"></div>
<div class="author">Rainiere Rocha</div>
<div class="role">Assessor de Investimentos &middot; XP Investimentos</div>
</div>
<div class="chapter"><div class="ch-num">Capitulo 1</div>
<h2>Por Que Investir E Urgente</h2>
<p class="intro">Deixar o dinheiro parado na poupanca nao e seguranca &mdash; e perda garantida. Enquanto a inflacao corroi seu poder de compra, os juros da poupanca mal cobrem o custo de vida.</p>
<p>O Brasil tem uma das maiores taxas de juros reais do mundo. Isso significa que, para quem sabe investir, o pais oferece oportunidades extraordinarias de fazer o dinheiro trabalhar. Para quem ignora esse conhecimento, significa assistir ao patrimonio encolher silenciosamente a cada ano.</p>
<p>A inflacao media brasileira nos ultimos 10 anos girou em torno de 6% ao ano. A poupanca rendeu, no mesmo periodo, aproximadamente 4,5% ao ano. Resultado: quem deixou R$100.000 na poupanca em 2014 tinha, em termos de poder de compra real, menos de R$87.000 em 2024. O dinheiro estava la, os numeros cresciam, mas o poder de compra havia desaparecido.</p>
<h3>O Efeito dos Juros Compostos</h3>
<p>Um investimento de R$500 mensais com retorno de 12% ao ano se transforma em R$1,76 milhao em 30 anos. O total investido seria de R$180.000. Os outros R$1,58 milhao seriam fruto exclusivamente dos juros compostos. O tempo e o maior aliado do investidor.</p>
<p>Comecar cedo vale mais do que investir muito. Uma pessoa que comeca aos 25 anos com R$300 mensais tera mais patrimonio aos 65 do que outra que comeca aos 35 com R$600 mensais &mdash; mesmo tendo investido o dobro em valores absolutos.</p>
<div class="box"><div class="box-title">Ponto-chave</div><p>O melhor momento para comecar a investir foi ha 10 anos. O segundo melhor momento e hoje.</p></div>
</div>
<div class="chapter"><div class="ch-num">Capitulo 2</div>
<h2>Conhecendo Seu Perfil de Investidor</h2>
<p class="intro">Antes de qualquer aplicacao, e fundamental entender quem voce e como investidor. O perfil define nao apenas onde voce deve investir, mas como voce deve reagir quando o mercado oscilar.</p>
<p>O perfil de investidor e determinado por tres fatores principais: tolerancia ao risco, horizonte de tempo e objetivos financeiros. A combinacao desses tres elementos define a alocacao ideal de cada pessoa.</p>
<table><tr><th>Perfil</th><th>Tolerancia</th><th>Alocacao Tipica</th><th>Retorno Esperado</th></tr>
<tr><td>Conservador</td><td>Baixa</td><td>80% RF / 20% RV</td><td>CDI + 1%</td></tr>
<tr><td>Moderado</td><td>Media</td><td>60% RF / 40% RV</td><td>CDI + 3%</td></tr>
<tr><td>Arrojado</td><td>Alta</td><td>30% RF / 70% RV</td><td>CDI + 6%+</td></tr></table>
<p>Muitos investidores se declaram arrojados em questionarios mas vendem tudo em panico na primeira queda de 20%. A verdadeira tolerancia ao risco so se revela em mercados adversos. Por isso, comece com uma alocacao mais conservadora do que voce imagina ser adequada e ajuste conforme ganha experiencia.</p>
<div class="box"><div class="box-title">Atencao</div><p>Perfil de investidor nao e estatico. Ele muda conforme sua renda, objetivos e experiencia evoluem. Revise o seu pelo menos uma vez por ano.</p></div>
</div>
<div class="chapter"><div class="ch-num">Capitulo 3</div>
<h2>Os Principais Tipos de Investimentos</h2>
<p class="intro">O mercado financeiro brasileiro oferece uma variedade enorme de produtos. Conhecer cada um deles e o fundamento de qualquer estrategia solida.</p>
<h3>Renda Fixa</h3>
<p>Na renda fixa, as regras de remuneracao sao definidas no momento da aplicacao. Voce sabe como seu dinheiro vai render. Os principais produtos sao: Tesouro Direto, CDB, LCI, LCA, CRI, CRA e Debentures. O Tesouro Direto e o investimento mais seguro do pais. Os CDBs tem protecao do FGC ate R$250.000. As LCIs e LCAs sao isentas de Imposto de Renda para pessoas fisicas.</p>
<h3>Renda Variavel</h3>
<p>Na renda variavel, o retorno nao e garantido previamente. O principal produto sao as acoes, que representam fracoes do capital de empresas abertas na Bolsa. Tambem fazem parte dessa categoria os ETFs, BDRs, FIIs e fundos multimercado.</p>
<p>A volatilidade da renda variavel assusta iniciantes, mas e justamente ela que gera retornos superiores no longo prazo. Enquanto a renda fixa entrega previsibilidade, a renda variavel entrega potencial de multiplicacao de patrimonio.</p>
<div class="dark"><h3>Resumo por Objetivo</h3><ul>
<li>Reserva de emergencia: Tesouro Selic ou CDB com liquidez diaria</li>
<li>Curto prazo (ate 2 anos): LCI/LCA, CDB prefixado</li>
<li>Medio prazo (2-5 anos): Tesouro IPCA+, Debentures incentivadas</li>
<li>Longo prazo (5+ anos): Acoes, FIIs, ETFs</li></ul></div>
</div>
<div class="chapter"><div class="ch-num">Capitulo 4</div>
<h2>Risco, Retorno e Diversificacao</h2>
<p class="intro">Todo investimento carrega algum nivel de risco. A relacao entre risco e retorno e a lei fundamental do mercado: maiores retornos potenciais sempre vem acompanhados de maiores riscos.</p>
<p>Risco nao significa chance de perder tudo. Significa incerteza sobre o retorno futuro. Os principais tipos: Risco de mercado, risco de credito, risco de liquidez, risco de inflacao e risco cambial. Cada um exige estrategias diferentes de gerenciamento.</p>
<p>Harry Markowitz, premio Nobel de Economia, demonstrou matematicamente que a diversificacao e a unica refeicao gratis do mercado financeiro &mdash; uma maneira de reduzir risco sem sacrificar retorno esperado. Essa teoria, chamada de Teoria Moderna do Portfolio, e a base de toda gestao profissional de investimentos.</p>
<div class="box"><div class="box-title">Regra pratica</div><p>Nunca coloque mais de 10% do patrimonio em um unico ativo. Para acoes individuais, o limite ideal e 5% por empresa.</p></div>
</div>
<div class="chapter"><div class="ch-num">Capitulo 5</div>
<h2>Montando Sua Primeira Carteira</h2>
<p class="intro">Uma carteira bem construida e simples, diversificada e adequada ao seu momento de vida. Nao precisa ter dezenas de ativos &mdash; qualidade supera quantidade.</p>
<p>O primeiro passo antes de qualquer investimento e a reserva de emergencia: 6 a 12 meses de despesas mensais aplicados em ativos com liquidez diaria e baixo risco. Sem essa reserva, qualquer imprevisto forca voce a resgatar investimentos no pior momento possivel.</p>
<h3>Os Tres Pilares</h3>
<p><strong>Pilar 1 &mdash; Protecao (20-40%):</strong> Tesouro Selic, CDBs de liquidez diaria. Reserva estrategica e protecao contra volatilidade.</p>
<p><strong>Pilar 2 &mdash; Renda (30-50%):</strong> Tesouro IPCA+, FIIs, Debentures incentivadas. Gera renda regular e protege da inflacao.</p>
<p><strong>Pilar 3 &mdash; Crescimento (20-40%):</strong> Acoes via ETFs (BOVA11, IVVB11). Multiplicacao patrimonial no longo prazo.</p>
<div class="end"><h3>Proximos Passos</h3><p>Abra uma conta em uma corretora de investimentos. Monte sua reserva de emergencia primeiro. Depois comece pelo Tesouro Direto para aprender na pratica, e gradualmente expanda para outros produtos conforme ganha confianca e conhecimento.</p></div>
</div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent(CONTENT, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.pdf({
    path: OUT,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: FOOTER,
    margin: { top: '12mm', bottom: '20mm', left: '18mm', right: '18mm' },
  });
  await browser.close();
  const stat = fs.statSync(OUT);
  console.log('PDF:', Math.round(stat.size / 1024) + 'KB');
  const fileData = fs.readFileSync(OUT);
  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'vcmnfnsjgfbudypewvjx.supabase.co',
      port: 443,
      path: '/storage/v1/object/biblioteca/ebooks/primeiros-passos-do-investidor.pdf',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/pdf',
        'Content-Length': fileData.length,
        'x-upsert': 'true',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { console.log('Upload:', res.statusCode); resolve(); });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
  console.log('OK');
})().catch(console.error);
