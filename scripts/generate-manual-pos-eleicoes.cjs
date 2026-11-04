'use strict';
// Gera public/ebooks/manual-pos-eleicoes-v1.pdf e public/og/pos-eleicoes.jpg (campanha /pos-eleicoes, 04/11/2026).
// Uso: node scripts/generate-manual-pos-eleicoes.cjs   (precisa do Chrome instalado e de puppeteer-core)
// Conteúdo AUTORAL: só dados públicos (Tesouro Direto, Banco Central, imprensa). Nada do material interno da XP.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.join(__dirname, '..');
const PDF_OUT = path.join(ROOT, 'public', 'ebooks', 'manual-pos-eleicoes-v1.pdf');
const OG_OUT = path.join(ROOT, 'public', 'og', 'pos-eleicoes.jpg');

const FOOTER = `<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;padding:4px 36px;display:flex;justify-content:space-between;border-top:0.5px solid #ccc;box-sizing:border-box;color:#999;"><span>Saga Financeira · Manual Pós-Eleições 2026 · conteúdo educacional</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Georgia,'Times New Roman',serif;font-size:11.5pt;color:#1a1a2e;line-height:1.75;}
.cover{width:100%;min-height:100vh;background:linear-gradient(150deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 50px;page-break-after:always;}
.badge{font-size:8pt;letter-spacing:3px;text-transform:uppercase;color:#B8962A;margin-bottom:34px;font-family:Arial,sans-serif;font-weight:600;}
.cover h1{font-size:31pt;color:#D4AF37;line-height:1.22;margin-bottom:20px;}
.cover-sub{font-size:13pt;color:#cbd5e1;font-style:italic;max-width:470px;margin:0 auto 30px;}
.big{font-size:58pt;color:#fff;font-weight:bold;line-height:1;margin:6px 0;}
.big-cap{font-size:10pt;color:#94a3b8;font-family:Arial,sans-serif;max-width:420px;margin:0 auto 26px;}
.divider{width:60px;height:2px;background:#D4AF37;margin:22px auto;}
.author{font-size:10pt;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;}
.role{font-size:8.5pt;color:#94a3b8;font-family:Arial,sans-serif;letter-spacing:1px;margin-top:6px;}
.chapter{padding:6px 0 20px;}
.chapter+.chapter{page-break-before:always;}
.ch-num{font-size:8pt;color:#B8962A;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;}
h2{font-size:21pt;color:#0f172a;margin-bottom:16px;border-bottom:2.5px solid #D4AF37;padding-bottom:10px;line-height:1.3;}
h3{font-size:13pt;color:#1e3a5f;margin:22px 0 8px;}
p{margin-bottom:13px;text-align:justify;color:#2d2d2d;}
.intro{font-size:12.5pt;color:#475569;font-style:italic;border-left:3px solid #D4AF37;padding-left:18px;margin-bottom:20px;}
.box{background:#fef9ec;border-left:4px solid #D4AF37;padding:14px 20px;margin:18px 0;border-radius:0 6px 6px 0;}
.box-title{font-weight:bold;color:#8a6c00;font-size:9pt;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;}
.box p{margin-bottom:0;color:#5a4a00;}
.dark{background:#0f172a;color:#fff;padding:20px 24px;border-radius:8px;margin:20px 0;}
.dark h3{color:#D4AF37;margin-top:0;}
.dark li,.dark p{color:#cbd5e1;}
ul,ol{margin:8px 0 14px 26px;}
li{margin-bottom:7px;color:#2d2d2d;}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:10pt;font-family:Arial,sans-serif;}
th{background:#0f172a;color:#fff;padding:9px 12px;text-align:left;}
td{border-bottom:1px solid #e2e8f0;padding:8px 12px;vertical-align:top;}
td:first-child{font-weight:600;color:#1e3a5f;}
.src{font-size:8.5pt;color:#64748b;font-family:Arial,sans-serif;margin-top:6px;}
.legal{font-size:8.5pt;color:#64748b;font-family:Arial,sans-serif;line-height:1.55;border-top:1px solid #e2e8f0;padding-top:12px;margin-top:22px;}
.legal p{font-size:8.5pt;color:#64748b;margin-bottom:6px;}
`;

const chapters = [
`<h2>O que aconteceu depois do segundo turno</h2>
<p class="intro">No dia útil seguinte à eleição, o Tesouro Direto bateu o maior salto de taxa em um único dia desde que o programa existe. Se a sua carteira ficou vermelha, o motivo não foi o seu lado político. Foi a curva de juros.</p>
<table>
<tr><th>Título (Tesouro Direto)</th><th>Antes (23/10)</th><th>Depois (26/10)</th></tr>
<tr><td>Prefixado 2032, taxa</td><td>12,89% ao ano</td><td>15,78% na abertura; fechou o dia em 15,50%</td></tr>
<tr><td>IPCA+ 2050, taxa</td><td>IPCA + 6,42%</td><td>IPCA + 7,64%</td></tr>
<tr><td>IPCA+ 2050, preço</td><td>referência</td><td>queda de 23,6% até o dia 26</td></tr>
</table>
<p class="src">Fontes: InfoMoney, Mixvale e Eu Quero Investir (26/10 a 04/11/2026). Em 04/11 o Prefixado 2032 estava em 15,54%.</p>
<h3>Curva de juros, em uma frase</h3>
<p>A curva de juros mostra quanto o mercado exige de taxa para emprestar dinheiro ao governo por 1 ano, 5 anos, 10 anos. Quando o mercado passa a achar que o governo vai gastar mais do que arrecada, ele pede taxa maior em todos os prazos. A curva sobe, e ela subiu de uma vez.</p>
<h3>Por que o mercado antecipa</h3>
<p>O mercado não espera o gasto acontecer. Ele precifica o que acha que vem pela frente. A dívida bruta do governo geral está em 82,9% de tudo que o país produz em um ano (R$ 11,1 trilhões, setembro de 2026, Banco Central), e os juros pagos nos últimos 12 meses somaram R$ 1,2 trilhão. Governo que gasta mais do que arrecada precisa tomar mais dinheiro emprestado, e quem empresta cobra mais caro.</p>
<div class="box"><div class="box-title">Ponto central</div><p>Taxa de juro mais alta não é um castigo ao seu investimento. É o preço que o mercado cobra do governo. O efeito colateral é que o preço dos títulos que já existem cai. Isso tem nome: marcação a mercado.</p></div>`,

`<h2>Marcação a mercado em uma página</h2>
<p class="intro">Todo dia, o valor do seu título no extrato é recalculado pelo preço que ele teria se fosse vendido naquele momento. Não é o valor que você vai receber no vencimento. É o valor de hoje, na prateleira.</p>
<h3>A gangorra entre taxa e preço</h3>
<p>Taxa e preço andam em sentidos opostos. Se o governo passa a pagar 15,5% em títulos novos, quem comprou antes um título com taxa menor tem um papel menos atraente. Para alguém comprar o seu título de volta, ele precisa custar menos. O extrato mostra exatamente esse preço menor.</p>
<h3>Exemplo ilustrativo</h3>
<p>Imagine R$ 10 mil em um título prefixado com vencimento em 2032, comprado quando a taxa era de cerca de 12,9% ao ano. Quando a taxa de mercado para esse prazo sobe para perto de 15,5%, o preço de venda cai algo em torno de 11%, segundo a variação medida no Prefixado 2032 no dia da alta. O extrato passa a mostrar aproximadamente R$ 8.900.</p>
<div class="dark"><h3>O que não mudou</h3><ul>
<li>A taxa que você contratou continua a mesma.</li>
<li>Se você levar o título até o vencimento, recebe o valor combinado, com a taxa combinada.</li>
<li>A perda só vira perda de verdade se você vender antes, com o preço marcado para baixo.</li>
</ul></div>
<p class="src">O percentual do exemplo é uma aproximação didática. O efeito real depende do prazo, da taxa contratada e do dia.</p>
<h3>Quem sente mais</h3>
<p>Quanto mais longo o título, maior o efeito. Um papel com vencimento em 2050 oscila muito mais do que um com vencimento em 2027. Título pós-fixado, ligado à Selic ou ao CDI, quase não sofre marcação, porque a taxa dele acompanha a do mercado.</p>`,

`<h2>O papel de cada peça da carteira neste cenário</h2>
<p class="intro">Nenhuma peça é boa ou ruim em si. Cada uma tem uma função, e o cenário muda a importância relativa de cada função.</p>
<table>
<tr><th>Peça</th><th>Função</th><th>Neste cenário de juros altos por mais tempo</th></tr>
<tr><td>Pós-fixado (Selic, CDI)</td><td>Reserva e caixa</td><td>Rende acompanhando a taxa básica (hoje 13,75% ao ano), com liquidez e pouca oscilação.</td></tr>
<tr><td>Prefixado</td><td>Travar uma taxa</td><td>Quem trava ganha se os juros caírem; quem trava e precisa sair antes sofre a marcação. Prazos curtos oscilam menos.</td></tr>
<tr><td>Atrelado à inflação (IPCA+)</td><td>Proteger o poder de compra</td><td>Protege se a pressão do dólar virar inflação. Também oscila no caminho; o vencimento escolhido importa.</td></tr>
<tr><td>Ações brasileiras</td><td>Crescer no longo prazo</td><td>Juro alto concorre com a bolsa e pesa sobre empresas endividadas. Qualidade e geração de caixa ganham peso.</td></tr>
<tr><td>Fundos imobiliários</td><td>Renda recorrente</td><td>Fundos de imóveis físicos sentem mais o juro alto; fundos de recebíveis tendem a se defender melhor.</td></tr>
<tr><td>Exposição internacional</td><td>Reduzir dependência do Brasil</td><td>Faz parte permanente da carteira, construída aos poucos, e não corrida ao dólar no dia do recorde.</td></tr>
</table>
<div class="box"><div class="box-title">Como ler a tabela</div><p>A proporção entre as peças depende do seu objetivo, do seu prazo e da sua tolerância a oscilar. Este manual descreve funções, não recomenda produtos nem emissores.</p></div>`,

`<h2>Checklist: sete perguntas para esta semana</h2>
<p class="intro">Responda com sinceridade. Cada "não sei" é um ponto de atenção, não um motivo de pânico.</p>
<ol>
<li><strong>Tenho alguma dívida com juros acima de 3% ao mês?</strong> Se sim, ela vem antes de qualquer investimento. Juro alto por mais tempo torna isso mais urgente.</li>
<li><strong>Minha reserva de emergência cobre de 3 a 6 meses de gastos e está em um título com liquidez?</strong> A poupança rende menos que a Selic, e você paga essa diferença todo mês.</li>
<li><strong>Sei qual parte da carteira é prefixada e com que prazo?</strong> Prazos longos oscilam muito neste cenário.</li>
<li><strong>Tenho algo que proteja o poder de compra se o dólar alto virar inflação?</strong></li>
<li><strong>Quanto da minha carteira depende só do Brasil?</strong> Se a resposta é "tudo", vale pensar em uma parcela fora do país, construída aos poucos.</li>
<li><strong>Cada investimento que tenho está ligado a um objetivo e a um prazo?</strong> Dinheiro sem destino é o que mais vira decisão emocional em dia de notícia ruim.</li>
<li><strong>Quem me vendeu o que eu tenho ganha comissão por isso?</strong> Não é pecado, mas é informação que muda a forma de ouvir a recomendação.</li>
</ol>`,

`<h2>Os cinco erros clássicos de pós-eleição</h2>
<ol>
<li><strong>Vender tudo no susto.</strong> O preço de hoje já carrega a notícia de ontem. Sair depois da queda e voltar depois da alta é o jeito mais comum de perder dinheiro sem ter feito nada errado.</li>
<li><strong>Dolarizar tudo no pico.</strong> Comprar dólar no dia em que ele bate o maior valor do ano (R$ 5,49 no fechamento de 03/11) é entrar onde todo mundo já entrou. Exposição internacional se constrói com regra, aos poucos.</li>
<li><strong>Travar prefixado longo sem entender a marcação a mercado.</strong> Uma taxa alta parece ótima até a hora em que você precisa sair antes do vencimento num dia em que a taxa subiu.</li>
<li><strong>Deixar a reserva na poupança por "segurança".</strong> Com a Selic em 13,75%, a diferença para um pós-fixado simples, ao longo de um ano, paga várias contas.</li>
<li><strong>Financiar agora o que podia esperar.</strong> Com juro alto por mais tempo, o financiamento custa bem mais do que a etiqueta mostra.</li>
</ol>
<h3>Para quem está endividado, a ordem importa</h3>
<p>Primeiro o rotativo do cartão e o cheque especial, os mais caros do país. Depois carnê e crediário. Só então o financiamento de longo prazo. Renegociar com desconto para pagar à vista, quando há reserva para isso, muitas vezes rende mais do que qualquer investimento disponível.</p>`,

`<h2>Assessoria fee-based: como funciona</h2>
<p class="intro">Existem duas formas comuns de pagar por assessoria de investimentos. Entender a diferença ajuda a avaliar qualquer recomendação, a minha inclusive.</p>
<table>
<tr><th></th><th>Modelo com comissão</th><th>Modelo fee-based</th></tr>
<tr><td>Como o assessor é remunerado</td><td>Parte da receita vem dos produtos que o cliente compra</td><td>Percentual fixo ao ano sobre o patrimônio sob assessoria</td></tr>
<tr><td>Conflito de interesse</td><td>Maior: o produto pode influenciar a remuneração</td><td>Menor: a remuneração não muda com o produto escolhido</td></tr>
<tr><td>Custo para o cliente</td><td>Embutido nos produtos, menos visível</td><td>Explícito e informado antes da contratação</td></tr>
</table>
<p>No modelo fee-based que ofereço, o custo é um percentual fixo ao ano sobre o patrimônio, a partir de 1% ao ano, conforme a faixa de patrimônio, sem comissão por produto. O valor exato é apresentado por escrito antes de qualquer contratação. Atendo a partir de R$ 100 mil investidos, com limite de 5 carteiras novas por semana para dar atenção de verdade.</p>
<div class="dark"><h3>Próximo passo: diagnóstico da sua carteira em 48 horas</h3>
<p>Se você tem a partir de R$ 100 mil investidos, peça pelo WhatsApp (62) 99416-0930. São 20 minutos, sem compromisso: eu separo o que está vermelho apenas por marcação a mercado do que merece atenção de verdade.</p></div>
<div class="legal">
<p><strong>XP Investimentos CCTVM S.A.</strong> (CNPJ 02.332.886/0001-04) é a instituição intermediária responsável pela custódia e pela intermediação dos investimentos. Rainiere Rocha é Assessor de Investimentos vinculado à XP Investimentos por meio da InvestSmart, contratado pela intermediária para atuar em seu nome. Ouvidoria XP Investimentos: 0800 722 3730.</p>
<p>Conteúdo educacional, de autoria da Saga Financeira. Não é recomendação de investimento, oferta ou promessa de rentabilidade, e não é material da XP. Rentabilidade passada não garante rentabilidade futura. Investimentos envolvem riscos, inclusive de perda do capital investido. Dados públicos atualizados até 04/11/2026; taxas e preços mudam todos os dias.</p>
</div>`,
];

const manualHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="cover">
  <div class="badge">Saga Financeira · Manual gratuito</div>
  <h1>Manual Pós-Eleições 2026</h1>
  <div class="cover-sub">Por que os seus investimentos caíram, o que é marcação a mercado e como pensar a carteira agora</div>
  <div class="big">15,78%</div>
  <div class="big-cap">foi a taxa do Tesouro Prefixado 2032 na abertura do dia 26/10, contra 12,89% na sexta anterior: a maior alta em um dia na história do programa</div>
  <div class="divider"></div>
  <div class="author">Rainiere Rocha</div>
  <div class="role">Assessor de Investimentos · XP Investimentos via InvestSmart · Goiânia</div>
</div>
${chapters.map((c, i) => `<div class="chapter"><div class="ch-num">Parte ${i + 1} de ${chapters.length}</div>${c}</div>`).join('\n')}
</body></html>`;

const ogHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:linear-gradient(150deg,#0f172a,#1e3a5f 55%,#0f172a);color:#fff;font-family:Georgia,serif;display:flex;flex-direction:column;justify-content:center;padding:0 80px}
.k{font:600 20px Arial;letter-spacing:5px;text-transform:uppercase;color:#D4AF37;margin-bottom:26px}
.n{font-size:190px;font-weight:bold;color:#D4AF37;line-height:1}
.t{font-size:44px;line-height:1.2;margin-top:18px;max-width:1000px}
.s{font:22px Arial;color:#94a3b8;margin-top:26px}
</style></head><body><div class="k">Manual gratuito · Saga Financeira</div><div class="n">15,78%</div><div class="t">Seus investimentos caíram com a eleição? Não foi o seu lado. Foi a curva de juros.</div><div class="s">Rainiere Rocha · Assessor de Investimentos · XP via InvestSmart</div></body></html>`;

(async () => {
  fs.mkdirSync(path.dirname(PDF_OUT), { recursive: true });
  fs.mkdirSync(path.dirname(OG_OUT), { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(manualHtml, { waitUntil: 'networkidle0' });
    await page.pdf({ path: PDF_OUT, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: FOOTER, margin: { top: '12mm', bottom: '20mm', left: '18mm', right: '18mm' } });
    const og = await browser.newPage();
    await og.setViewport({ width: 1200, height: 630 });
    await og.setContent(ogHtml, { waitUntil: 'networkidle0' });
    await og.screenshot({ path: OG_OUT, type: 'jpeg', quality: 88 });
  } finally {
    await browser.close();
  }
  console.log('PDF:', PDF_OUT, Math.round(fs.statSync(PDF_OUT).size / 1024) + ' KB');
  console.log('OG :', OG_OUT, Math.round(fs.statSync(OG_OUT).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
