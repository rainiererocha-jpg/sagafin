'use strict';

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { require_env } = require('./env.cjs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SUPABASE_URL = `https://${require_env('SUPABASE_PROJECT_REF')}.supabase.co`;
const SUPABASE_SERVICE_KEY = require_env('SUPABASE_SERVICE_ROLE_KEY');
const TMP_DIR = path.join(__dirname, '..', 'tmp-ebooks');

const FOOTER = `<div style="width:100%;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:8px;padding:4px 36px;display:flex;justify-content:space-between;align-items:center;border-top:0.5px solid #ccc;box-sizing:border-box;color:#aaa;"><span style="color:#B8962A;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-size:7.5px;">Rainiere Rocha &nbsp;·&nbsp; Assessor de Investimentos &nbsp;·&nbsp; XP Investimentos</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Georgia,'Times New Roman',serif;font-size:11.5pt;color:#1a1a2e;line-height:1.8;}
.cover{width:100%;min-height:100vh;background:linear-gradient(150deg,#0f172a 0%,#1e3a5f 55%,#0f172a 100%);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 70px;page-break-after:always;}
.badge{font-size:8pt;letter-spacing:3px;text-transform:uppercase;color:#B8962A;margin-bottom:36px;font-family:Arial,sans-serif;font-weight:600;}
.cover h1{font-size:32pt;color:#D4AF37;font-weight:bold;line-height:1.25;margin-bottom:20px;}
.cover-sub{font-size:13pt;color:#94a3b8;font-style:italic;max-width:460px;margin:0 auto 40px;}
.divider{width:60px;height:2px;background:#D4AF37;margin:30px auto;}
.author{font-size:10pt;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;}
.role{font-size:8.5pt;color:#64748b;font-family:Arial,sans-serif;letter-spacing:1px;margin-top:6px;}
.chapter{padding:8px 0 28px;}
.chapter+.chapter{page-break-before:always;}
.ch-num{font-size:8pt;color:#B8962A;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;}
h2{font-size:22pt;color:#0f172a;margin-bottom:18px;border-bottom:2.5px solid #D4AF37;padding-bottom:12px;line-height:1.3;}
h3{font-size:13pt;color:#1e3a5f;margin:26px 0 10px;font-weight:bold;}
p{margin-bottom:15px;text-align:justify;color:#2d2d2d;}
.intro{font-size:12.5pt;color:#475569;font-style:italic;line-height:1.9;border-left:3px solid #D4AF37;padding-left:18px;margin-bottom:22px;}
.box{background:#fef9ec;border-left:4px solid #D4AF37;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0;}
.box-title{font-weight:bold;color:#8a6c00;font-size:9pt;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:7px;}
.box p{margin-bottom:0;font-style:italic;color:#5a4a00;}
.dark{background:#0f172a;color:#fff;padding:22px 26px;border-radius:8px;margin:22px 0;}
.dark h3{color:#D4AF37;margin-top:0;font-size:12pt;}
.dark li{color:#cbd5e1;margin-bottom:7px;}
ul,ol{margin:10px 0 16px 26px;}
li{margin-bottom:8px;color:#2d2d2d;}
table{width:100%;border-collapse:collapse;margin:18px 0;font-size:10pt;font-family:Arial,sans-serif;}
th{background:#0f172a;color:#fff;padding:10px 14px;text-align:left;font-weight:600;}
td{border-bottom:1px solid #e2e8f0;padding:9px 14px;}
tr:nth-child(even) td{background:#f8fafc;}
td:first-child{font-weight:600;color:#1e3a5f;}
.end{background:linear-gradient(135deg,#f8f4e6,#fef9ec);border:1px solid #D4AF3780;padding:26px 30px;border-radius:10px;margin:28px 0 8px;}
.end h3{color:#8a6c00;margin-bottom:10px;}
.end p{color:#5a4500;margin-bottom:0;}
`;

function html(titulo, subtitulo, chapters) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="cover">
  <div class="badge">Sagafin · Assessoria de Investimentos</div>
  <h1>${titulo}</h1>
  <div class="cover-sub">${subtitulo}</div>
  <div class="divider"></div>
  <div class="author">Rainiere Rocha</div>
  <div class="role">Assessor de Investimentos · XP Investimentos</div>
</div>
${chapters.map((c,i)=>`<div class="chapter"><div class="ch-num">Capítulo ${i+1}</div>${c}</div>`).join('\n')}
</body></html>`;
}

// ─── EBOOK 1 ────────────────────────────────────────────────────────────────
const eb1 = html(
  'Primeiros Passos do Investidor',
  'O guia completo para quem quer começar a investir com segurança e inteligência',
  [
    `<h2>Por Que Investir É Urgente</h2>
<p class="intro">Deixar o dinheiro parado na poupança não é segurança — é perda garantida. Enquanto a inflação corrói seu poder de compra, os juros da poupança mal cobrem o custo de vida.</p>
<p>O Brasil tem uma das maiores taxas de juros reais do mundo. Isso significa que, para quem sabe investir, o país oferece oportunidades extraordinárias de fazer o dinheiro trabalhar. Para quem ignora esse conhecimento, significa assistir ao patrimônio encolher silenciosamente a cada ano.</p>
<p>A inflação média brasileira nos últimos 10 anos girou em torno de 6% ao ano. A poupança rendeu, no mesmo período, aproximadamente 4,5% ao ano. Resultado: quem deixou R$100.000 na poupança em 2014 tinha, em termos de poder de compra real, menos de R$87.000 em 2024. O dinheiro estava lá, os números cresciam — mas o poder de compra havia desaparecido.</p>
<h3>O Efeito dos Juros Compostos</h3>
<p>Albert Einstein teria chamado os juros compostos de "a oitava maravilha do mundo". Quem entende, ganha. Quem não entende, paga. Esse princípio simples resume décadas de criação de riqueza.</p>
<p>Um investimento de R$500 mensais com retorno de 12% ao ano se transforma em R$1,76 milhão em 30 anos. O total investido seria de R$180.000. Os outros R$1,58 milhão seriam fruto exclusivamente dos juros compostos. O tempo é o maior aliado do investidor.</p>
<p>Começar cedo vale mais do que investir muito. Uma pessoa que começa aos 25 anos com R$300 mensais terá mais patrimônio aos 65 do que outra que começa aos 35 com R$600 mensais — mesmo tendo investido o dobro em valores absolutos.</p>
<div class="box"><div class="box-title">Ponto-chave</div><p>O melhor momento para começar a investir foi há 10 anos. O segundo melhor momento é hoje.</p></div>`,

    `<h2>Conhecendo Seu Perfil de Investidor</h2>
<p class="intro">Antes de qualquer aplicação, é fundamental entender quem você é como investidor. O perfil define não apenas onde você deve investir, mas como você deve reagir quando o mercado oscilar.</p>
<p>O perfil de investidor é determinado por três fatores principais: tolerância ao risco, horizonte de tempo e objetivos financeiros. A combinação desses três elementos define a alocação ideal de cada pessoa.</p>
<h3>Os Três Perfis</h3>
<table>
<tr><th>Perfil</th><th>Tolerância ao Risco</th><th>Alocação Típica</th><th>Retorno Esperado</th></tr>
<tr><td>Conservador</td><td>Baixa</td><td>80% RF / 20% RV</td><td>CDI + 1%</td></tr>
<tr><td>Moderado</td><td>Média</td><td>60% RF / 40% RV</td><td>CDI + 3%</td></tr>
<tr><td>Arrojado</td><td>Alta</td><td>30% RF / 70% RV</td><td>CDI + 6%+</td></tr>
</table>
<p>O investidor conservador prioriza a preservação do capital acima de tudo. Aceita retornos menores em troca de previsibilidade e liquidez. Geralmente tem objetivos de curto prazo ou não suporta ver o patrimônio oscilar.</p>
<p>O moderado busca equilíbrio. Aceita alguma volatilidade em troca de retornos melhores no médio prazo. É o perfil mais comum entre investidores experientes que já atravessaram pelo menos um ciclo de mercado.</p>
<p>O arrojado tem foco no longo prazo e aceita perdas temporárias significativas em busca de retornos superiores. Não é o perfil para quem vai precisar do dinheiro nos próximos 5 anos.</p>
<div class="box"><div class="box-title">Atenção</div><p>Perfil de investidor não é estático. Ele muda conforme sua renda, objetivos e experiência evoluem. Revise o seu pelo menos uma vez por ano.</p></div>
<h3>O Erro da Autopercepção</h3>
<p>Muitos investidores se declaram arrojados em questionários mas vendem tudo em pânico na primeira queda de 20%. A verdadeira tolerância ao risco só se revela em mercados adversos. Por isso, comece com uma alocação mais conservadora do que você imagina ser adequada e ajuste conforme ganha experiência.</p>`,

    `<h2>Os Principais Tipos de Investimentos</h2>
<p class="intro">O mercado financeiro brasileiro oferece uma variedade enorme de produtos. Conhecer cada um deles — seus riscos, retornos e liquidez — é o fundamento de qualquer estratégia sólida.</p>
<p>As aplicações financeiras se dividem em duas grandes categorias: Renda Fixa e Renda Variável. Dentro de cada uma existem dezenas de produtos com características distintas. Entender essa divisão é o primeiro passo para montar uma carteira equilibrada.</p>
<h3>Renda Fixa</h3>
<p>Na renda fixa, as regras de remuneração são definidas no momento da aplicação. Você sabe (ou consegue calcular) quanto vai receber ao final. Os principais produtos são: Tesouro Direto, CDB, LCI, LCA, CRI, CRA e Debêntures.</p>
<p>O Tesouro Direto é o investimento mais seguro do país — lastreado pelo governo federal. Os CDBs são emitidos por bancos e têm proteção do FGC até R$250.000 por CPF por instituição. As LCIs e LCAs são isentas de Imposto de Renda para pessoas físicas, o que as torna especialmente atrativas.</p>
<h3>Renda Variável</h3>
<p>Na renda variável, o retorno não é garantido previamente. O principal produto são as ações, que representam frações do capital de empresas abertas na Bolsa. Também fazem parte dessa categoria os ETFs, BDRs, FIIs e fundos multimercado.</p>
<p>A volatilidade da renda variável assusta iniciantes, mas é justamente ela que gera retornos superiores no longo prazo. Enquanto a renda fixa entrega previsibilidade, a renda variável entrega potencial de multiplicação de patrimônio.</p>
<div class="dark"><h3>Resumo por Objetivo</h3><ul>
<li><strong>Reserva de emergência:</strong> Tesouro Selic ou CDB com liquidez diária</li>
<li><strong>Curto prazo (até 2 anos):</strong> LCI/LCA, CDB prefixado</li>
<li><strong>Médio prazo (2-5 anos):</strong> Tesouro IPCA+, Debêntures incentivadas</li>
<li><strong>Longo prazo (5+ anos):</strong> Ações, FIIs, ETFs</li>
</ul></div>`,

    `<h2>Risco, Retorno e Diversificação</h2>
<p class="intro">Todo investimento carrega algum nível de risco. A relação entre risco e retorno é a lei fundamental do mercado: maiores retornos potenciais sempre vêm acompanhados de maiores riscos.</p>
<p>Risco não significa "chance de perder tudo". Significa incerteza sobre o retorno futuro. Um título do Tesouro Selic tem baixíssimo risco porque seu retorno é previsível. Uma ação de small cap tem alto risco porque seu retorno futuro é imprevisível.</p>
<h3>Os Tipos de Risco</h3>
<p><strong>Risco de mercado:</strong> oscilações de preço causadas por fatores macroeconômicos. Afeta principalmente renda variável. <strong>Risco de crédito:</strong> possibilidade de o emissor não honrar a dívida. Afeta renda fixa privada. <strong>Risco de liquidez:</strong> dificuldade de vender um ativo rapidamente sem perda de valor.</p>
<p><strong>Risco de inflação:</strong> perda do poder de compra quando o retorno do investimento fica abaixo da inflação. O principal inimigo de quem deixa dinheiro em poupança. <strong>Risco cambial:</strong> variações do dólar que afetam investimentos internacionais ou empresas exportadoras/importadoras.</p>
<h3>A Diversificação Como Escudo</h3>
<p>Diversificar significa distribuir o capital entre diferentes ativos que não se movem na mesma direção ao mesmo tempo. Quando um cai, outro pode subir ou se manter estável. O resultado é uma carteira com retorno potencialmente similar mas com risco significativamente menor.</p>
<p>Harry Markowitz, prêmio Nobel de Economia, demonstrou matematicamente que a diversificação é a única "refeição grátis" do mercado financeiro — uma maneira de reduzir risco sem sacrificar retorno esperado. Essa teoria, chamada de Teoria Moderna do Portfólio, é a base de toda gestão profissional de investimentos.</p>
<div class="box"><div class="box-title">Regra prática</div><p>Nunca coloque mais de 10% do patrimônio em um único ativo. Para ações individuais, o limite ideal é 5% por empresa.</p></div>`,

    `<h2>Montando Sua Primeira Carteira</h2>
<p class="intro">Uma carteira bem construída é simples, diversificada e adequada ao seu momento de vida. Não precisa ter dezenas de ativos — qualidade supera quantidade.</p>
<p>O primeiro passo antes de qualquer investimento é a reserva de emergência: 6 a 12 meses de despesas mensais aplicados em ativos com liquidez diária e baixo risco. Sem essa reserva, qualquer imprevisto força você a resgatar investimentos no pior momento possível.</p>
<h3>A Carteira dos Três Pilares</h3>
<p><strong>Pilar 1 — Proteção (20-40%):</strong> Tesouro Selic, CDBs de liquidez diária, LCI/LCA de curto prazo. Serve como reserva estratégica e proteção contra volatilidade.</p>
<p><strong>Pilar 2 — Renda (30-50%):</strong> Tesouro IPCA+, CDBs de médio prazo, FIIs, Debêntures incentivadas. Gera renda regular e protege da inflação.</p>
<p><strong>Pilar 3 — Crescimento (20-40%):</strong> Ações via ETFs (BOVA11, IVVB11), ações de empresas sólidas, fundos de ações. Busca multiplicação patrimonial no longo prazo.</p>
<p>A proporção entre os pilares depende do seu perfil e horizonte. Um conservador pode ter 60-20-20. Um arrojado pode ter 10-30-60. O importante é que todos os três estejam presentes.</p>
<div class="end"><h3>Próximos Passos</h3><p>Abra uma conta em uma corretora de investimentos (XP, BTG, Rico, Clear). Monte sua reserva de emergência primeiro. Depois comece pelo Tesouro Direto para aprender na prática, e gradualmente expanda para outros produtos conforme ganha confiança e conhecimento.</p></div>`,
  ]
);

// ─── EBOOK 2 ────────────────────────────────────────────────────────────────
const eb2 = html(
  'Renda Fixa Descomplicada',
  'Tudo o que você precisa saber para investir com segurança e rentabilidade acima da poupança',
  [
    `<h2>O Que É Renda Fixa?</h2>
<p class="intro">Renda fixa não significa retorno fixo — significa que as regras de remuneração são definidas no contrato. Você sabe como seu dinheiro vai render, mesmo que o valor final dependa de índices como CDI ou IPCA.</p>
<p>Quando você investe em renda fixa, está basicamente emprestando dinheiro a alguém — o governo federal, um banco ou uma empresa — e recebendo juros por isso. Esse "alguém" se compromete a devolver o capital mais os juros no prazo acordado.</p>
<p>O mercado de renda fixa brasileiro é um dos maiores e mais sofisticados do mundo. Com a Selic historicamente elevada, o Brasil oferece oportunidades únicas de retorno real positivo em renda fixa — algo raro em países desenvolvidos onde as taxas são próximas de zero.</p>
<h3>Os Três Tipos de Remuneração</h3>
<table>
<tr><th>Tipo</th><th>Como Funciona</th><th>Exemplo</th><th>Ideal Para</th></tr>
<tr><td>Prefixado</td><td>Taxa fixa definida no contrato</td><td>CDB 13,5% a.a.</td><td>Expectativa de queda de juros</td></tr>
<tr><td>Pós-fixado</td><td>Atrelado ao CDI ou Selic</td><td>CDB 110% do CDI</td><td>Reserva e liquidez</td></tr>
<tr><td>Híbrido</td><td>IPCA + taxa fixa</td><td>IPCA + 6% a.a.</td><td>Proteção da inflação</td></tr>
</table>
<p>O pós-fixado indexado ao CDI é o mais popular entre investidores brasileiros. Como o CDI acompanha de perto a taxa Selic, rende bem quando os juros estão altos — que é exatamente o caso do Brasil na maior parte de sua história recente.</p>
<div class="box"><div class="box-title">O que é CDI?</div><p>CDI (Certificado de Depósito Interbancário) é a taxa que os bancos cobram entre si em empréstimos de curtíssimo prazo. Historicamente fica 0,10% abaixo da Selic. Serve como referência para quase toda a renda fixa privada.</p></div>`,

    `<h2>CDB — O Investimento Mais Popular do Brasil</h2>
<p class="intro">O Certificado de Depósito Bancário é emitido por bancos para captar recursos. Em troca, pagam juros ao investidor. É simples, seguro e acessível — com investimento mínimo a partir de R$1,00 em algumas instituições.</p>
<p>O CDB tem proteção do Fundo Garantidor de Créditos (FGC) até R$250.000 por CPF por instituição financeira. Isso significa que, mesmo que o banco quebre, você receberá de volta até esse valor. Para patrimônios maiores, distribua entre diferentes bancos.</p>
<h3>Como Comparar CDBs</h3>
<p>O principal critério de comparação é o percentual do CDI oferecido. Um CDB de banco grande geralmente paga entre 80% e 100% do CDI. CDBs de bancos médios chegam a 115-130% do CDI — mas com risco de crédito maior (mitigado pelo FGC).</p>
<p>Prazo também importa. CDBs mais longos geralmente pagam mais. A tabela regressiva do Imposto de Renda beneficia prazos acima de 720 dias, quando a alíquota cai para 15%. Abaixo de 180 dias, a alíquota é de 22,5%.</p>
<table>
<tr><th>Prazo</th><th>Alíquota IR</th></tr>
<tr><td>Até 180 dias</td><td>22,5%</td></tr>
<tr><td>181 a 360 dias</td><td>20%</td></tr>
<tr><td>361 a 720 dias</td><td>17,5%</td></tr>
<tr><td>Acima de 720 dias</td><td>15%</td></tr>
</table>
<h3>Liquidez nos CDBs</h3>
<p>CDBs com liquidez diária permitem resgate a qualquer momento sem perda de rentabilidade acumulada. São ideais para reserva de emergência. CDBs sem liquidez (com prazo definido) geralmente pagam mais, mas você fica "preso" até o vencimento.</p>
<div class="box"><div class="box-title">Dica Prática</div><p>Use a calculadora de comparação da XP ou do BTG para comparar CDBs de diferentes bancos ajustando pelo IR. Um CDB de 120% do CDI de banco médio pode render mais líquido que um CDB de 105% do CDI de banco grande.</p></div>`,

    `<h2>LCI e LCA — O Benefício Fiscal a Seu Favor</h2>
<p class="intro">Letras de Crédito Imobiliário e do Agronegócio são isentas de Imposto de Renda para pessoas físicas. Esse benefício as torna extremamente competitivas, especialmente para investidores em altas faixas de IR.</p>
<p>Uma LCI que paga 92% do CDI tem retorno líquido equivalente a um CDB que paga aproximadamente 108% do CDI (considerando IR de 15%). Para quem está na faixa de 27,5% de IR no imposto de renda, o benefício é ainda maior.</p>
<h3>Como Funciona</h3>
<p>LCIs são emitidas por bancos para financiar o setor imobiliário. LCAs financiam o agronegócio. Como o governo quer estimular esses setores, concede a isenção fiscal como incentivo. O investidor se beneficia diretamente desse estímulo.</p>
<p>Assim como os CDBs, têm proteção do FGC até R$250.000 por CPF por instituição. O risco de crédito é o do banco emissor, não do setor que estão financiando.</p>
<h3>Limitações Importantes</h3>
<p>Em 2024, o Conselho Monetário Nacional (CMN) estabeleceu prazo mínimo de 9 meses para LCIs e 12 meses para LCAs. Isso significa menor liquidez comparado a CDBs de liquidez diária. Planeje bem antes de alocar.</p>
<div class="dark"><h3>Comparativo Direto (CDI a 10,5%)</h3><ul>
<li>CDB 100% CDI por 2 anos → rende ~10,5% a.a. bruto → <strong>8,93% líquido</strong></li>
<li>LCI 90% CDI por 2 anos → rende ~9,45% a.a. → <strong>9,45% líquido</strong> (isento)</li>
<li>Conclusão: LCI a 90% do CDI bate CDB a 100% do CDI para prazo de 2 anos</li>
</ul></div>`,

    `<h2>CRI, CRA e Debêntures Incentivadas</h2>
<p class="intro">Para quem quer rendimentos mais altos com isenção de IR, os títulos de crédito privado incentivados são uma excelente opção. Mas atenção: sem proteção do FGC, o risco de crédito é real.</p>
<p>CRIs (Certificados de Recebíveis Imobiliários) e CRAs (Certificados de Recebíveis do Agronegócio) são isentos de IR para pessoas físicas, assim como LCI e LCA. A diferença crucial: não têm proteção do FGC. O risco é do emissor do CRI/CRA, não do banco.</p>
<p>Debêntures incentivadas são títulos de dívida corporativa emitidos por empresas de infraestrutura (energia, transporte, saneamento) com isenção de IR. Geralmente pagam IPCA + taxa fixa, com prazos longos (5-15 anos).</p>
<h3>Análise de Risco de Crédito</h3>
<p>Antes de investir, verifique o rating do emissor nas agências de classificação (Moody's, S&P, Fitch, ou agências locais como Austin Rating). Ratings acima de "A" indicam boa qualidade de crédito. Abaixo disso, o risco aumenta significativamente.</p>
<p>Também analise: histórico de pagamentos, índice de cobertura de juros (EBITDA / despesas financeiras) e nível de alavancagem. Uma empresa com dívida líquida acima de 3x EBITDA merece atenção redobrada.</p>
<div class="box"><div class="box-title">Quando Vale o Risco?</div><p>CRIs e CRAs de boas empresas pagando IPCA + 7-9% são atrativos para o longo prazo. Para quem está na faixa de 27,5% de IR, o benefício fiscal pode compensar o risco adicional — especialmente com emissores sólidos.</p></div>`,

    `<h2>Estratégia: Montando Uma Carteira de Renda Fixa</h2>
<p class="intro">Uma carteira de renda fixa bem estruturada tem três camadas: liquidez, proteção da inflação e maximização de retorno. Cada camada tem seu papel e horizonte de tempo.</p>
<h3>Camada 1 — Liquidez (20-30%)</h3>
<p>Tesouro Selic ou CDB com liquidez diária de banco sólido. Este dinheiro é sua reserva estratégica. Rendimento próximo ao CDI, disponível a qualquer momento. Nunca comprometa essa camada em busca de rentabilidade maior.</p>
<h3>Camada 2 — Proteção (40-50%)</h3>
<p>LCI/LCA de bancos médios, CDBs prefixados ou IPCA+ de prazo médio (1-3 anos). Esta é a espinha dorsal da carteira. Gera rentabilidade superior ao CDI líquido e protege o poder de compra.</p>
<h3>Camada 3 — Maximização (20-30%)</h3>
<p>Debêntures incentivadas IPCA+, CRIs e CRAs de emissores sólidos, Tesouro IPCA+ longo prazo. Prazos mais longos (5-15 anos) com rentabilidade superior. O preço da liquidez reduzida.</p>
<div class="end"><h3>Conclusão</h3><p>A renda fixa brasileira oferece uma das melhores relações risco-retorno do mundo. Com planejamento, diversificação entre produtos e atenção ao benefício fiscal, é possível superar o CDI de forma consistente e segura. O próximo passo é aprofundar cada produto e aprender a fazer a escolha certa em cada momento do ciclo econômico.</p></div>`,
  ]
);

// ─── EBOOK 3 ────────────────────────────────────────────────────────────────
const eb3 = html(
  'Tesouro Direto: Guia Definitivo',
  'Como usar os títulos públicos para construir riqueza com segurança e estratégia',
  [
    `<h2>O Que É o Tesouro Direto</h2>
<p class="intro">O Tesouro Direto é o programa do governo federal para venda de títulos públicos diretamente ao cidadão. É o investimento mais seguro do Brasil — afinal, o risco é o do governo federal, o mesmo que emite o Real.</p>
<p>Lançado em 2002, o Tesouro Direto democratizou o acesso aos títulos públicos. Antes, apenas bancos e grandes fundos podiam comprar diretamente do Tesouro. Hoje qualquer pessoa com CPF e conta em corretora pode investir a partir de R$30,00.</p>
<p>O programa tem mais de 25 milhões de investidores cadastrados e é a porta de entrada preferida de quem está começando. Mas engana-se quem acha que é "só para iniciantes" — gestores profissionais mantêm posições significativas em títulos do Tesouro como âncora de carteiras sofisticadas.</p>
<h3>Vantagens do Tesouro Direto</h3>
<ul>
<li>Maior segurança do mercado brasileiro (garantia do governo federal)</li>
<li>Acessível a partir de R$30,00</li>
<li>Liquidez diária — recompra garantida pelo Tesouro</li>
<li>Variedade de títulos para diferentes objetivos</li>
<li>Transparência total sobre taxas e rendimentos</li>
<li>Plataforma simples e intuitiva</li>
</ul>
<div class="box"><div class="box-title">Taxa de Custódia</div><p>A B3 cobra taxa de custódia de 0,20% ao ano sobre o valor investido no Tesouro Direto. Algumas corretoras isentam essa taxa para investimentos acima de determinado valor. Prefira corretoras que não cobram taxa adicional além dessa.</p></div>`,

    `<h2>Tesouro Selic — A Base de Toda Carteira</h2>
<p class="intro">O Tesouro Selic é o título mais conservador e líquido do programa. Acompanha a taxa básica de juros diariamente, sem volatilidade significativa. É o porto seguro da renda fixa brasileira.</p>
<p>Ao contrário dos outros títulos do Tesouro, o Tesouro Selic nunca tem rentabilidade negativa no curto prazo (exceto em casos extremos de marcação a mercado). Isso o torna ideal para a reserva de emergência e para momentos de incerteza econômica.</p>
<p>Quando a Selic está alta — como tem sido frequente no Brasil — o Tesouro Selic oferece retorno real positivo significativo. Com Selic a 13,75% e inflação a 5%, o retorno real é de quase 8% ao ano. Em países desenvolvidos com juros zerados, isso seria extraordinário.</p>
<h3>Quando Usar o Tesouro Selic</h3>
<p>Use-o como reserva de emergência (liquidez imediata com rendimento próximo ao CDI), como estacionamento de capital enquanto aguarda oportunidades melhores, em momentos de incerteza econômica quando prefere segurança máxima, e quando não sabe ao certo quando vai precisar do dinheiro.</p>
<div class="box"><div class="box-title">Selic vs. CDI</div><p>O Tesouro Selic rende a Selic, que é sempre ligeiramente acima do CDI (em torno de 0,10% a mais). Para fins práticos, considere equivalentes ao comparar com CDBs e outros produtos indexados ao CDI.</p></div>`,

    `<h2>Tesouro Prefixado — Trave a Taxa Hoje</h2>
<p class="intro">O Tesouro Prefixado paga uma taxa de juros definida no momento da compra, independentemente do que aconteça com a Selic ou a inflação durante o período. É uma aposta na trajetória dos juros.</p>
<p>Se você compra um Tesouro Prefixado a 13,5% ao ano e a Selic cair para 9% no próximo ano, você terá feito um excelente negócio — estará recebendo 13,5% enquanto o mercado paga 9%. O contrário também é verdadeiro.</p>
<h3>Marcação a Mercado</h3>
<p>O ponto crucial do prefixado é a marcação a mercado. Se você precisar vender antes do vencimento, o preço do título oscilará conforme as expectativas do mercado para os juros futuros. Quando os juros sobem, o preço do título cai. Quando os juros caem, o preço sobe.</p>
<p>Isso significa que o Tesouro Prefixado pode ter rentabilidade negativa no curto prazo se os juros subirem após sua compra. Por isso, só invista nele se tiver certeza de que não vai precisar do dinheiro antes do vencimento.</p>
<h3>Quando Comprar Prefixado</h3>
<p>O momento ideal é quando você acredita que os juros vão cair. Especificamente: quando o Banco Central está iniciando um ciclo de cortes da Selic, quando a inflação está controlada e o mercado espera queda dos juros, ou quando as taxas do prefixado estão historicamente elevadas.</p>
<table>
<tr><th>Cenário</th><th>Prefixado</th><th>Pós-fixado</th></tr>
<tr><td>Juros vão subir</td><td>Ruim</td><td>Ótimo</td></tr>
<tr><td>Juros vão cair</td><td>Ótimo</td><td>Regular</td></tr>
<tr><td>Juros estáveis</td><td>Bom</td><td>Bom</td></tr>
</table>`,

    `<h2>Tesouro IPCA+ — Proteção Real Garantida</h2>
<p class="intro">O Tesouro IPCA+ é o título preferido de quem pensa no longo prazo. Paga a variação da inflação (IPCA) mais uma taxa real de juros prefixada. Garante que seu dinheiro vai crescer acima da inflação.</p>
<p>Por exemplo, Tesouro IPCA+ 2035 a IPCA + 6,5% ao ano. Independentemente de a inflação ser 3% ou 15%, você receberá sempre 6,5% acima dela. É a proteção mais robusta contra a corrosão inflacionária disponível no mercado brasileiro.</p>
<p>Historicamente, o Tesouro IPCA+ com taxas acima de IPCA + 5% representa uma das melhores oportunidades da renda fixa brasileira. Para referência, os títulos norte-americanos protegidos pela inflação (TIPS) pagam retorno real de apenas 1-2%.</p>
<h3>Variantes do IPCA+</h3>
<p><strong>Tesouro IPCA+ sem cupom:</strong> acumula todos os rendimentos até o vencimento. Ideal para aposentadoria e objetivos de longo prazo. Sofre mais com a marcação a mercado, mas entrega retorno maior no vencimento.</p>
<p><strong>Tesouro IPCA+ com Juros Semestrais:</strong> paga metade da rentabilidade anual a cada 6 meses. Ideal para quem já está na fase de usufruir do patrimônio e precisa de renda periódica.</p>
<div class="dark"><h3>Regra de Ouro do IPCA+</h3><ul>
<li>Taxa real acima de 6% ao ano: excelente oportunidade de compra</li>
<li>Taxa real entre 4-6%: bom, vale incluir na carteira</li>
<li>Taxa real abaixo de 4%: avaliar outros produtos</li>
<li>Nunca venda antes do vencimento se os juros subirem — aguarde</li>
</ul></div>`,

    `<h2>Estratégias e Quando Usar Cada Título</h2>
<p class="intro">A escolha entre Selic, Prefixado e IPCA+ não é definitiva — deve mudar conforme o ciclo econômico, seus objetivos e o prazo disponível. Entender quando usar cada um é o diferencial do investidor estratégico.</p>
<h3>A Estratégia da Escada de Vencimentos</h3>
<p>Em vez de colocar tudo em um único título, distribua entre diferentes prazos. Isso é chamado de "ladder" ou escada de vencimentos. Coloque uma parte no Tesouro Selic (curto prazo e liquidez), outra parte no IPCA+ 2029 (médio prazo) e outra no IPCA+ 2035 (longo prazo).</p>
<p>Esse método reduz o risco de ter que vender na hora errada, garante liquidez regular conforme os títulos vencem e permite capturar diferentes pontos da curva de juros.</p>
<h3>Rebalanceamento</h3>
<p>Quando a Selic sobe, o Tesouro Selic se torna mais atrativo. Quando cai, os prefixados e IPCA+ ganham valor via marcação a mercado. Monitorar isso e rebalancear a carteira — sem fazer movimentos bruscos — é a chave para extrair o máximo do Tesouro Direto.</p>
<div class="end"><h3>Conclusão</h3><p>O Tesouro Direto é muito mais que um investimento de iniciante. Com os três tipos de título bem utilizados, é possível construir uma carteira sofisticada, segura e rentável para qualquer objetivo financeiro. A simplicidade é sua maior vantagem — não a confunda com limitação.</p></div>`,
  ]
);

// ─── EBOOK 4 ────────────────────────────────────────────────────────────────
const eb4 = html(
  'Títulos do Tesouro Americano',
  'Como investir em renda fixa dos EUA, proteção cambial e diversificação global',
  [
    `<h2>Por Que Investir nos Estados Unidos</h2>
<p class="intro">O dólar é a moeda de reserva global. Ter parte do patrimônio em ativos americanos é a melhor proteção contra crises políticas e econômicas no Brasil — uma realidade que qualquer investidor experiente já vivenciou.</p>
<p>O Brasil tem uma história de instabilidade econômica que nenhuma geração de investidores conseguiu ignorar: Plano Cruzado, hiperinflação dos anos 80 e 90, Plano Real, crises cambiais de 1999, 2002, 2015, pandemia de 2020. Em cada um desses episódios, quem tinha ativos dolarizados preservou patrimônio enquanto os demais sofreram.</p>
<p>Dolarizar parte do patrimônio não é desconfiança no Brasil — é diversificação inteligente. Recomenda-se ter entre 20% e 40% do patrimônio em ativos internacionais, dependendo do perfil e dos objetivos.</p>
<h3>O Mercado de Treasuries</h3>
<p>Os Treasuries são os títulos de dívida emitidos pelo governo federal dos Estados Unidos. Com mais de US$25 trilhões em circulação, é o maior e mais líquido mercado de renda fixa do mundo. São considerados o ativo livre de risco da economia global — referência para precificação de todos os outros ativos financeiros.</p>
<div class="box"><div class="box-title">Por que "livre de risco"?</div><p>O governo americano jamais deu calote em sua dívida em dólares. Como emite a moeda global de reserva, tem capacidade técnica quase ilimitada de honrar compromissos. Isso não significa risco zero — mas o risco é mínimo comparado a qualquer outra soberana.</p></div>`,

    `<h2>Tipos de Treasuries e Como Funcionam</h2>
<p class="intro">O Tesouro americano emite títulos com diferentes prazos e características. Entender cada tipo é fundamental para escolher o mais adequado ao seu objetivo.</p>
<table>
<tr><th>Título</th><th>Prazo</th><th>Característica</th></tr>
<tr><td>T-Bills</td><td>1 mês a 1 ano</td><td>Desconto, sem cupom</td></tr>
<tr><td>T-Notes</td><td>2 a 10 anos</td><td>Cupom semestral</td></tr>
<tr><td>T-Bonds</td><td>20 a 30 anos</td><td>Cupom semestral, longo prazo</td></tr>
<tr><td>TIPS</td><td>5, 10, 30 anos</td><td>Indexado à inflação americana (CPI)</td></tr>
</table>
<h3>T-Bills — O Equivalente Americano ao Tesouro Selic</h3>
<p>T-Bills (Treasury Bills) são os títulos de curtíssimo prazo, equivalentes à nossa Selic. Com taxas próximas de 5% ao ano em 2024, oferecem retorno real positivo em dólares — algo raro historicamente. São ideais para a parte líquida e conservadora da carteira internacional.</p>
<h3>TIPS — Proteção Inflacionária em Dólar</h3>
<p>Treasury Inflation-Protected Securities (TIPS) são o equivalente americano ao nosso Tesouro IPCA+. Pagam taxa real acima da inflação americana (CPI). Com TIPS rendendo retorno real de 2-2,5%, representam uma das melhores oportunidades históricas nesse segmento.</p>
<p>Para o investidor brasileiro, os TIPS oferecem dupla proteção: contra a inflação americana e contra a desvalorização do Real frente ao dólar.</p>`,

    `<h2>Como Brasileiros Podem Investir em Treasuries</h2>
<p class="intro">Existem múltiplas formas de acessar os Treasuries a partir do Brasil, com diferentes graus de complexidade, custo e eficiência tributária. Escolha a que melhor se adapta ao seu perfil.</p>
<h3>Opção 1 — BDRs de ETFs (Mais Simples)</h3>
<p>Na B3, você pode comprar BDRs de ETFs americanos que replicam índices de Treasuries. O ETF IEF (iShares 7-10 Year Treasury Bond) e o TLT (iShares 20+ Year Treasury Bond) têm BDRs negociados na bolsa brasileira. Compra-se em reais, recebe-se em reais, mas a exposição é ao ativo dolarizado.</p>
<h3>Opção 2 — Conta Internacional (Mais Eficiente)</h3>
<p>Abrir conta em corretora americana (Interactive Brokers, Avenue, Nomad) permite comprar os ETFs originais em dólar. A tributação é mais complexa — ganhos de capital são tributados, mas a eficiência é maior. Ideal para quem já tem patrimônio relevante em dólares.</p>
<h3>Opção 3 — Fundos de Renda Fixa Internacional</h3>
<p>Fundos que investem em Treasuries via derivativos cambiais, sem necessidade de conta exterior. Mais praticidade, mas geralmente com taxa de administração que come parte do rendimento. Verifique se a taxa é justificada pelo retorno líquido.</p>
<div class="box"><div class="box-title">Tributação</div><p>BDRs na B3 seguem a regra geral de renda variável: ganhos acima de R$20.000/mês são tributados a 15% (long term) ou 20% (day trade). Títulos comprados diretamente no exterior têm regras específicas — consulte um contador especializado.</p></div>`,

    `<h2>Risco Cambial — Sua Maior Variável</h2>
<p class="intro">Ao investir em Treasuries, o retorno em reais depende não apenas da taxa do título mas da variação do dólar. Um Treasury rendendo 5% ao ano pode virar 15% ou -5% dependendo do câmbio.</p>
<p>O real brasileiro historicamente se deprecia frente ao dólar no longo prazo. Nos últimos 30 anos, o câmbio foi de cerca de R$1,00 para mais de R$5,00 — uma desvalorização acumulada enorme. Isso significa que ativos dolarizados tendem a entregar retornos extras para o investidor brasileiro simplesmente pela depreciação cambial.</p>
<p>No curto prazo, porém, o câmbio é volátil. O dólar pode cair de R$5,50 para R$4,80 em meses favoráveis ao Real, gerando retorno negativo em reais mesmo com o título americano rendendo positivo em dólar.</p>
<h3>Hedge Cambial — Vale a Pena?</h3>
<p>Hedge cambial é uma estratégia para neutralizar o risco da variação do câmbio. O problema: tem custo. No Brasil, o custo do hedge cambial (via contratos futuros de dólar) geralmente consome 8-10% ao ano — justamente o diferencial de juros entre o Brasil e os EUA.</p>
<p>Resultado: um Treasury com hedge em reais rende aproximadamente o CDI — sem as vantagens do dólar. Portanto, fazer hedge derrota o propósito da diversificação internacional. A recomendação: invista em Treasuries sem hedge, aceite a volatilidade cambial como parte do portfólio e pense em horizontes de 5+ anos.</p>
<div class="end"><h3>Conclusão</h3><p>Os Treasuries americanos são peça fundamental na carteira de qualquer investidor sofisticado. Não pela rentabilidade isolada, mas pela proteção sistêmica que oferecem. Em crises no Brasil, o dólar sobe e os Treasuries preservam patrimônio exatamente quando mais importa.</p></div>`,
  ]
);

// ─── EBOOK 5 ────────────────────────────────────────────────────────────────
const eb5 = html(
  'Debêntures e Crédito Privado',
  'Como investir em dívida corporativa com rentabilidade superior e risco calculado',
  [
    `<h2>O Mercado de Crédito Privado Brasileiro</h2>
<p class="intro">O mercado de crédito privado brasileiro cresceu exponencialmente nos últimos anos. Empresas que antes dependiam exclusivamente de bancos agora emitem dívida diretamente para investidores — e pagam taxas atrativas para isso.</p>
<p>Crédito privado é o segmento da renda fixa onde empresas, bancos e estruturas especiais de propósito emitem títulos de dívida para captar recursos. Para o investidor, é uma forma de emprestar dinheiro diretamente às empresas, recebendo juros superiores aos dos títulos governamentais como compensação pelo risco adicional.</p>
<p>O "spread de crédito" é a diferença entre o que uma empresa paga e o que o Tesouro paga no mesmo prazo. Empresas AAA podem pagar CDI + 0,5%. Empresas com rating BB podem pagar CDI + 4%. Essa diferença reflete o risco percebido pelo mercado.</p>
<h3>Por Que o Mercado Cresceu Tanto</h3>
<p>Com a Selic elevada, as empresas preferem emitir debêntures com taxas menores que as dos bancos tradicionais. Os investidores, por sua vez, buscam retornos superiores ao CDI sem ir para a renda variável. O casamento de interesses criou um mercado vibrante e diversificado.</p>
<div class="box"><div class="box-title">Atenção ao FGC</div><p>Debêntures, CRIs e CRAs NÃO têm proteção do FGC. Se a empresa emissora falir, você pode perder o capital. Por isso a análise de crédito é fundamental antes de qualquer investimento nesse segmento.</p></div>`,

    `<h2>Debêntures — Renda Fixa Corporativa</h2>
<p class="intro">Debêntures são títulos de dívida emitidos por empresas de capital aberto ou fechado. São o instrumento mais flexível do crédito privado, podendo ter diferentes prazos, taxas e garantias.</p>
<p>Ao comprar uma debênture, você se torna credor da empresa. Em caso de falência, debenturistas têm prioridade sobre acionistas (mas ficam atrás de credores trabalhistas e tributários). As garantias da debênture determinam seu nível de segurança.</p>
<h3>Tipos de Debêntures por Garantia</h3>
<table>
<tr><th>Tipo</th><th>Garantia</th><th>Segurança</th></tr>
<tr><td>Real</td><td>Bens específicos (imóveis, máquinas)</td><td>Alta</td></tr>
<tr><td>Flutuante</td><td>Ativos gerais da empresa</td><td>Média-Alta</td></tr>
<tr><td>Quirografária</td><td>Apenas a palavra da empresa</td><td>Média</td></tr>
<tr><td>Subordinada</td><td>Prioridade abaixo dos demais credores</td><td>Baixa</td></tr>
</table>
<h3>Debêntures Simples vs. Convertíveis</h3>
<p>Debêntures simples pagam juros e devolvem o principal. Debêntures convertíveis podem, em determinadas condições, ser trocadas por ações da empresa. As convertíveis têm características híbridas entre renda fixa e variável — mais complexas e geralmente para investidores qualificados.</p>
<p>Para o investidor pessoa física, o foco geralmente é em debêntures simples (especialmente as incentivadas com isenção de IR) negociadas no mercado secundário ou em fundos de debêntures.</p>`,

    `<h2>Debêntures Incentivadas — O Privilégio Fiscal</h2>
<p class="intro">Debêntures incentivadas são emitidas por empresas de infraestrutura e têm isenção de IR para pessoas físicas. São uma das melhores oportunidades de crédito privado disponíveis no Brasil.</p>
<p>A Lei 12.431/2011 criou as debêntures incentivadas para estimular investimentos em infraestrutura (energia elétrica, rodovias, portos, aeroportos, saneamento). Para atrair investidores, o governo concedeu isenção de IR para pessoas físicas — o mesmo benefício das LCIs e LCAs.</p>
<p>Tipicamente, essas debêntures pagam IPCA + taxa fixa, com prazos de 5 a 15 anos. Uma debênture incentivada de IPCA + 7% líquido é excepcional — equivale a um CDB tributável de IPCA + 8,2% para quem está na faixa de 15% de IR.</p>
<h3>Onde Encontrar Debêntures Incentivadas</h3>
<p>Fundos de debêntures incentivadas (como os da XP, BTG, Kinea) são o caminho mais acessível. Diversificam o risco entre dezenas de emissores automaticamente. Taxa de administração de 0,3% a 0,8% ao ano, mas a gestão profissional de crédito justifica para a maioria dos investidores.</p>
<p>Compra direta no mercado secundário é possível via plataformas de corretoras, mas requer tickets mínimos maiores (geralmente R$1.000 a R$10.000 por emissão) e análise própria de crédito.</p>
<div class="box"><div class="box-title">Cuidado com Prazo</div><p>Debêntures de longo prazo sofrem marcação a mercado se os juros subirem. Se precisar vender antes do vencimento, pode receber menos que o esperado. Só invista valor que não precisará no prazo do título.</p></div>`,

    `<h2>CRIs, CRAs e Como Analisar Risco de Crédito</h2>
<p class="intro">CRIs e CRAs são estruturas de securitização que convertem recebíveis imobiliários e do agronegócio em títulos de renda fixa. Também isentos de IR, são ferramentas poderosas para quem sabe analisá-los.</p>
<p>Na prática, uma CRI pode ser lastreada nos aluguéis de um shopping, nos recebíveis de um loteamento, ou na dívida de uma construtora. Cada estrutura tem seu próprio risco. O nome CRI não garante segurança — o que importa é quem está por trás da dívida.</p>
<h3>O Processo de Análise de Crédito</h3>
<p><strong>1. Rating:</strong> verifique a nota atribuída por agência de rating. AAA a A são investment grade. BBB é grau especulativo mas ainda aceitável. Abaixo disso, exige prêmio substancial e análise detalhada.</p>
<p><strong>2. Cobertura:</strong> qual a razão entre o patrimônio da garantia e a dívida? Uma CRI imobiliária com LTV (Loan-to-Value) de 60% tem colateral confortável. Acima de 80%, o risco aumenta.</p>
<p><strong>3. Perfil do emissor:</strong> empresa com histórico limpo de pagamentos, há quanto tempo está no mercado, setor em expansão ou em crise.</p>
<p><strong>4. Liquidez do secundário:</strong> se precisar vender antes do vencimento, é fácil? CRIs e CRAs têm liquidez menor que debêntures — considere isso no planejamento.</p>
<div class="end"><h3>Conclusão</h3><p>O crédito privado oferece retornos superiores à renda fixa bancária, especialmente para quem sabe analisar risco. A chave é diversificar entre emissores, não concentrar mais de 3-5% do portfólio em um único título, e preferir os incentivados pelo benefício fiscal. Fundos especializados são a melhor entrada para quem ainda está aprendendo.</p></div>`,
  ]
);

// ─── EBOOK 6 ────────────────────────────────────────────────────────────────
const eb6 = html(
  'FIIs do Zero ao Avançado',
  'O guia completo sobre Fundos de Investimento Imobiliário: como investir, analisar e lucrar',
  [
    `<h2>O Que São Fundos de Investimento Imobiliário</h2>
<p class="intro">FIIs são a forma mais democrática de investir no mercado imobiliário. Em vez de comprar um imóvel inteiro, você compra cotas de um fundo que possui dezenas ou centenas de propriedades — e recebe aluguel mensalmente.</p>
<p>Imagine ter participação em um shopping center, um galpão logístico, um conjunto de lajes corporativas ou uma carteira de CRIs — tudo isso por R$100,00. Essa é a proposta dos FIIs: democratizar o acesso ao mercado imobiliário de renda, historicamente restrito a grandes capitais.</p>
<p>Os FIIs foram criados pela Lei 8.668/93 e se popularizaram na B3 a partir de 2009. Hoje o IFIX (Índice de Fundos de Investimentos Imobiliários) reúne mais de 100 fundos com valor de mercado superior a R$150 bilhões.</p>
<h3>A Grande Vantagem: Isenção de IR nos Dividendos</h3>
<p>Pessoas físicas que possuem menos de 10% das cotas de um FII listado em bolsa não pagam IR sobre os dividendos recebidos. Essa isenção faz os FIIs competirem diretamente com a renda fixa em termos de rendimento líquido — com o bônus da potencial valorização das cotas.</p>
<div class="box"><div class="box-title">Atenção</div><p>A isenção vale apenas para os proventos (dividendos). Ganho de capital na venda de cotas é tributado a 20%, sem isenção para valores até R$20.000 como acontece com ações.</p></div>`,

    `<h2>Tipos de FIIs — Tijolo, Papel e Híbrido</h2>
<p class="intro">Nem todo FII é igual. A divisão fundamental entre fundos de tijolo, papel e híbrido define o tipo de risco, a fonte de renda e o comportamento em diferentes cenários econômicos.</p>
<h3>FIIs de Tijolo</h3>
<p>Investem diretamente em imóveis físicos. A renda vem principalmente dos aluguéis. Subtipos incluem: shoppings centers, lajes corporativas (escritórios), galpões logísticos e de distribuição, hospitais, hotéis, agências bancárias.</p>
<p>O risco principal é a vacância — imóveis sem inquilinos não geram renda. A localização, qualidade dos contratos e perfil dos inquilinos são os principais critérios de análise.</p>
<h3>FIIs de Papel</h3>
<p>Investem em títulos de crédito imobiliário (CRIs, LCIs e outros recebíveis). A renda vem dos juros desses títulos. São mais sensíveis à taxa de juros — quando a Selic sobe, tendem a render mais. Quando cai, os rendimentos diminuem.</p>
<p>São menos voláteis que os fundos de tijolo em termos de cota, mas dependem diretamente do ciclo de crédito imobiliário. Inadimplência dos devedores dos CRIs é o principal risco.</p>
<h3>FIIs Híbridos e de Desenvolvimento</h3>
<p>Combinam propriedades físicas e títulos. FIIs de desenvolvimento constroem imóveis para vender ou alugar — maior potencial de retorno, maior risco e menor previsibilidade de dividendos durante a fase de construção.</p>
<table>
<tr><th>Tipo</th><th>Renda</th><th>Risco</th><th>Melhor Cenário</th></tr>
<tr><td>Tijolo</td><td>Aluguel</td><td>Vacância</td><td>Expansão econômica</td></tr>
<tr><td>Papel</td><td>Juros CRI</td><td>Crédito / Juros</td><td>Selic alta</td></tr>
<tr><td>Híbrido</td><td>Misto</td><td>Misto</td><td>Qualquer cenário</td></tr>
</table>`,

    `<h2>Como Analisar Um FII</h2>
<p class="intro">A análise de FIIs combina métricas de renda fixa com conceitos imobiliários. Dominar esses indicadores separa o investidor amador do estratégico.</p>
<h3>Dividend Yield (DY)</h3>
<p>O DY anualizado é o principal indicador de renda dos FIIs. Calcula-se dividindo os proventos pagos nos últimos 12 meses pelo preço atual da cota. Um DY de 9-12% ao ano é considerado atrativo quando a Selic está na faixa de 11-13%.</p>
<h3>P/VPA — Preço sobre Valor Patrimonial</h3>
<p>O VPA (Valor Patrimonial por Ação) é o valor contábil dos ativos do fundo por cota. Se o fundo negocia a P/VPA de 0,90, as cotas estão com 10% de desconto sobre o valor dos imóveis. Se negocia a 1,10, está com 10% de prêmio.</p>
<p>FIIs de alta qualidade geralmente negociam com prêmio sobre o VPA — o mercado paga mais pela gestão profissional e qualidade dos ativos. Fundos com P/VPA abaixo de 0,85 podem ser oportunidade ou armadilha — investigue o motivo.</p>
<h3>Vacância</h3>
<p>Para fundos de tijolo, vacância física (área desocupada / área total) e vacância financeira (impacto na receita) são cruciais. Vacância acima de 15% merece análise cuidadosa — é temporária por reforma ou estrutural por problema de localização ou contrato?</p>
<h3>Qualidade dos Contratos</h3>
<p>Contratos atípicos (geralmente de longo prazo, 10-20 anos) dão previsibilidade de renda. Contratos típicos (revistos anualmente) são mais flexíveis mas trazem risco de renegociação. Sempre verifique quando vencem os principais contratos do portfólio.</p>`,

    `<h2>Montando Sua Carteira de FIIs e Tributação</h2>
<p class="intro">Uma carteira de FIIs bem construída distribui risco entre setores, tipos de fundo e gestores. O objetivo é gerar renda passiva mensal crescente com patrimônio sólido.</p>
<h3>Diversificação por Setor</h3>
<p>Distribua entre pelo menos 4-5 setores: logística (galpões), escritórios, shoppings, fundos de papel e possivelmente saúde ou educação. Cada setor responde diferente a ciclos econômicos. Galpões logísticos crescem com o e-commerce. Shoppings crescem com consumo. Escritórios dependem do mercado de trabalho.</p>
<h3>Quantos FIIs ter?</h3>
<p>Entre 8 e 15 FIIs oferecem boa diversificação sem complexidade excessiva. Menos de 5 concentra risco. Mais de 20 dificulta o acompanhamento. Para quem está começando, 6-8 fundos bem selecionados são suficientes.</p>
<div class="dark"><h3>Carteira Sugerida para Iniciantes</h3><ul>
<li>2-3 FIIs de galpões logísticos (ex: XPLG11, BRCO11, HGLG11)</li>
<li>2 FIIs de papel (ex: KNCR11, MXRF11)</li>
<li>1-2 FIIs de shoppings (ex: VISC11, XPML11)</li>
<li>1 FII de lajes corporativas (ex: BRCR11, RBRP11)</li>
</ul></div>
<h3>Tributação nos FIIs</h3>
<p>Dividendos: isentos de IR para PF com menos de 10% das cotas. Ganho de capital na venda: 20% sobre o lucro, sem isenção. Informe os rendimentos na declaração anual de IR no campo de rendimentos isentos e não tributáveis.</p>
<div class="end"><h3>Conclusão</h3><p>FIIs são um dos melhores instrumentos de geração de renda passiva disponíveis para o investidor pessoa física no Brasil. Renda mensal, isenção de IR, acesso ao mercado imobiliário de qualidade com baixo capital inicial. O segredo é qualidade, diversificação e paciência para deixar os dividendos se acumularem ao longo dos anos.</p></div>`,
  ]
);

// ─── EBOOK 7 ────────────────────────────────────────────────────────────────
const eb7 = html(
  'Dividendos: Renda Passiva Eterna',
  'Como construir uma máquina de dividendos que paga suas contas sem que você precise trabalhar',
  [
    `<h2>A Estratégia de Dividendos</h2>
<p class="intro">Investir em dividendos é construir uma fonte de renda que cresce enquanto você dorme, viaja ou faz o que ama. É a estratégia preferida dos investidores de longo prazo que buscam independência financeira.</p>
<p>A ideia é simples: comprar ações de empresas que distribuem parte dos lucros regularmente aos acionistas. Com o tempo, esse fluxo de proventos cresce — tanto pelo aumento dos lucros das empresas quanto pelo reinvestimento dos dividendos em novas cotas.</p>
<p>Warren Buffett recebe hoje mais de US$6 bilhões por ano em dividendos das empresas de sua carteira. Ele não trabalha por esse dinheiro — o dinheiro trabalha por ele. Esse é o poder da estratégia de dividendos aplicada com paciência e disciplina ao longo de décadas.</p>
<h3>Dividendos no Brasil vs. EUA</h3>
<p>O mercado brasileiro tem uma característica única: muitas empresas distribuem percentuais elevados do lucro. Enquanto empresas americanas distribuem tipicamente 20-40% do lucro (payout), empresas brasileiras frequentemente distribuem 50-100%. Isso gera dividend yields historicamente elevados em comparação internacional.</p>
<div class="box"><div class="box-title">Isenção de IR</div><p>No Brasil, dividendos de ações são atualmente isentos de IR para a pessoa física (diferente dos EUA, onde são tributados). Isso aumenta significativamente o retorno líquido da estratégia no contexto brasileiro.</p></div>`,

    `<h2>Como Identificar Boas Pagadoras de Dividendos</h2>
<p class="intro">Nem todo dividend yield alto é uma boa notícia. Empresa pagando 20% de dividendos pode estar destruindo capital. O segredo é identificar empresas que pagam bem E de forma sustentável.</p>
<h3>Os Critérios de Seleção</h3>
<p><strong>1. Histórico de pagamentos:</strong> a empresa paga dividendos há pelo menos 5 anos de forma consistente? Empresas que cortaram dividendos na pandemia mas retomaram rapidamente demonstraram solidez. As que cortaram e não voltaram revelaram fragilidade estrutural.</p>
<p><strong>2. Payout sustentável:</strong> o payout (dividendos / lucro líquido) deve estar entre 50-80%. Payout acima de 100% significa que a empresa está pagando mais do que ganha — insustentável. Payout muito baixo pode indicar empresa reinvestindo bem, o que também é positivo.</p>
<p><strong>3. Crescimento do lucro:</strong> empresa com lucro crescente distribuirá dividendos crescentes. Foque em negócios com vantagem competitiva duradoura: concessões, commodities de baixo custo, monopólios naturais.</p>
<p><strong>4. Geração de caixa:</strong> lucro líquido pode ser manipulável. Fluxo de caixa livre (FCF) não. Empresas com FCF consistentemente superior ao lucro são as melhores pagadoras de longo prazo.</p>
<h3>Setores com Melhores Pagadores</h3>
<p>No Brasil, os melhores dividend yields historicamente vêm de: utilities (energia, saneamento), bancos sólidos (Itaú, Bradesco), commodities de baixo custo (Vale, Petrobras em ciclos favoráveis) e fundos imobiliários (FIIs).</p>`,

    `<h2>Dividend Yield vs. Crescimento de Dividendos</h2>
<p class="intro">Existe uma troca fundamental entre yield alto hoje e crescimento de dividendos ao longo do tempo. A escolha entre as duas abordagens define o perfil da carteira de dividendos.</p>
<p>Uma ação com DY de 12% hoje mas dividendos estagnados pode ser menos valiosa que uma ação com DY de 5% mas crescimento anual dos dividendos de 15%. Em 10 anos, a segunda ação pode estar pagando 20% sobre o preço original de compra — o chamado "yield on cost".</p>
<h3>Yield on Cost — O Verdadeiro Poder</h3>
<p>O yield on cost é calculado dividindo os dividendos atuais pelo preço que você pagou na compra (não pelo preço atual). É o indicador que revela o real poder dos dividendos crescentes no tempo.</p>
<p>Quem comprou Itaúsa (ITSA4) em 2010 a R$5,00 recebe hoje dividendos anuais de aproximadamente R$1,50 por ação. O yield on cost dessa posição é de 30% ao ano — independentemente do preço atual da ação.</p>
<table>
<tr><th>Abordagem</th><th>DY Inicial</th><th>Crescimento</th><th>DY em 10 anos*</th></tr>
<tr><td>Alta Renda</td><td>12%</td><td>0%</td><td>12%</td></tr>
<tr><td>Crescimento</td><td>5%</td><td>15% a.a.</td><td>~20%</td></tr>
<tr><td>Híbrida</td><td>8%</td><td>8% a.a.</td><td>~17%</td></tr>
</table>
<p>*Sobre o preço original de compra (yield on cost). A abordagem ideal para a maioria é a híbrida — yield inicial razoável com crescimento consistente.</p>`,

    `<h2>O Poder do Reinvestimento e Construindo a Máquina</h2>
<p class="intro">O reinvestimento sistemático dos dividendos é o que transforma uma carteira modesta em uma máquina de renda passiva genuína. É o efeito dos juros compostos aplicado aos dividendos.</p>
<h3>O Efeito Snowball</h3>
<p>Imagine uma carteira de R$100.000 com dividend yield de 8% ao ano — R$8.000 em dividendos. Se você reinvestir esses R$8.000 comprando mais ações, no ano seguinte sua base será R$108.000, gerando R$8.640 em dividendos. E assim sucessivamente.</p>
<p>Em 20 anos, reinvestindo todos os dividendos, sua carteira pode crescer de R$100.000 para mais de R$466.000 — mesmo sem adicionar nenhum centavo novo. O reinvestimento gerou R$366.000 de crescimento adicional.</p>
<h3>O Plano de Construção em 3 Fases</h3>
<p><strong>Fase 1 — Acumulação (anos 1-10):</strong> reinvista 100% dos dividendos. Não retire nada. Foque em empresas com crescimento de dividendos. Adicione aportes regulares mensais. A carteira parece pequena mas a base está sendo construída.</p>
<p><strong>Fase 2 — Crescimento acelerado (anos 10-20):</strong> o efeito composto começa a aparecer de forma mais intensa. Os dividendos reinvestidos geram dividendos significativos por conta própria. Continue aportando, mas a maior parte do crescimento virá do reinvestimento.</p>
<p><strong>Fase 3 — Fruição:</strong> os dividendos mensais são suficientes para cobrir suas despesas. Você pode parar de trabalhar, ou continuar e reinvestir o excesso. A máquina está pronta e funciona sozinha.</p>
<div class="end"><h3>Conclusão</h3><p>A estratégia de dividendos não é glamourosa. Não tem segredos, não é rápida e não promete enriquecimento em meses. Mas funciona — de forma comprovada, por décadas, para todos que tiveram paciência suficiente para deixá-la trabalhar. Comece hoje, reinvista sempre, e deixe o tempo fazer seu trabalho.</p></div>`,
  ]
);

// ─── EBOOK 8 ────────────────────────────────────────────────────────────────
const eb8 = html(
  'Derivativos: 10 Estratégias Práticas',
  'Como usar opções e futuros para proteger sua carteira e gerar renda adicional',
  [
    `<h2>O Que São Derivativos e Por Que Usá-los</h2>
<p class="intro">Derivativos são instrumentos financeiros cujo valor deriva de um ativo subjacente — uma ação, índice, moeda ou commodity. São ferramentas poderosas para proteção e geração de renda quando usados com conhecimento.</p>
<p>Derivativos têm má reputação por casos famosos de perdas bilionárias. Mas esses casos envolvem uso especulativo excessivo e alavancagem irresponsável. Usados corretamente, derivativos são ferramentas de gestão de risco — exatamente o que grandes fundos, bancos e empresas fazem diariamente.</p>
<p>Um agricultor que vende contratos futuros de soja antes da colheita está usando derivativos para se proteger de queda de preços. Uma exportadora que compra contratos de dólar está protegendo sua receita cambial. Um investidor que compra put options está segurando contra queda da carteira. Todos usam derivativos de forma prudente e racional.</p>
<h3>Os Dois Grandes Grupos</h3>
<p><strong>Futuros e Forwards:</strong> contratos que obrigam a compra ou venda de um ativo em data futura a preço predeterminado. Negociados na B3 via mini contratos de índice (WINM) e dólar (WDOM).</p>
<p><strong>Opções:</strong> contratos que dão o direito (mas não a obrigação) de comprar (call) ou vender (put) um ativo a preço predeterminado até uma data de vencimento. São os mais versáteis e com mais estratégias disponíveis.</p>
<div class="box"><div class="box-title">Regra de Ouro</div><p>Nunca use derivativos com dinheiro que não pode perder. Comece com posições pequenas (2-5% do portfólio) até dominar completamente o instrumento.</p></div>`,

    `<h2>Estratégias de Proteção com Opções (Hedge)</h2>
<p class="intro">As melhores estratégias com derivativos para a maioria dos investidores são as de proteção. Proteger uma carteira de ações contra quedas expressivas é o uso mais racional das opções.</p>
<h3>Estratégia 1 — Compra de Put (Seguro de Carteira)</h3>
<p>Comprar uma opção de venda (put) sobre BOVA11 ou sobre ações individuais é como contratar um seguro. Se sua carteira cair 20%, a put pode compensar parcialmente ou totalmente essa perda. O custo é o prêmio pago pela opção — normalmente 1-3% ao ano.</p>
<p>Como fazer: com carteira de R$100.000 em BOVA11, compre puts com strike 5% abaixo do preço atual, com vencimento de 3 meses. Se o BOVA11 cair abaixo do strike, você começa a ser compensado. Se não cair, perde apenas o prêmio pago.</p>
<h3>Estratégia 2 — Collar (Teto e Piso)</h3>
<p>O collar combina compra de put (proteção abaixo) com venda de call (venda do upside acima). A venda da call financia parcialmente a compra da put, reduzindo o custo da proteção. Ideal quando você quer proteger ganhos existentes sem pagar muito pelo seguro.</p>
<h3>Estratégia 3 — Put Spread (Proteção de Custo Reduzido)</h3>
<p>Compra uma put e vende outra put com strike mais baixo. O custo é menor que a put simples, mas a proteção é limitada à faixa entre os dois strikes. Funciona bem para proteger contra quedas moderadas (10-20%) sem pagar muito.</p>
<table>
<tr><th>Estratégia</th><th>Custo</th><th>Proteção</th><th>Complexidade</th></tr>
<tr><td>Put simples</td><td>Alto</td><td>Total abaixo do strike</td><td>Baixa</td></tr>
<tr><td>Collar</td><td>Médio</td><td>Total abaixo do strike</td><td>Média</td></tr>
<tr><td>Put spread</td><td>Baixo</td><td>Limitada à faixa</td><td>Média</td></tr>
</table>`,

    `<h2>Estratégias de Geração de Renda com Opções</h2>
<p class="intro">Além da proteção, opções permitem gerar renda adicional sobre uma carteira existente. São estratégias que funcionam melhor em mercados laterais ou levemente altistas.</p>
<h3>Estratégia 4 — Venda Coberta de Call (Covered Call)</h3>
<p>É a estratégia mais popular entre investidores de longo prazo. Você possui ações e vende calls sobre elas. O prêmio recebido gera renda adicional — como um "aluguel" das suas ações. Se as ações subirem acima do strike, você as "entrega" ao comprador (perdendo o upside acima do strike). Se não subirem, fica com o prêmio.</p>
<p>Exemplo: você tem 1.000 PETR4 a R$38. Vende calls com strike R$42 e vencimento de 30 dias, recebendo R$0,80 de prêmio por ação (R$800 total). Se a Petrobras não chegar a R$42, você fica com os R$800 e repete a estratégia no mês seguinte. Em um ano, pode gerar de 10% a 20% adicional sobre a posição.</p>
<h3>Estratégia 5 — Venda de Put Cash-Secured</h3>
<p>Você quer comprar uma ação mas acha o preço atual alto. Venda uma put com o preço que considera justo. Se a ação cair até esse preço, você compra com desconto. Se não cair, fica com o prêmio — foi pago para esperar.</p>
<h3>Estratégias 6 a 10 — Para Investidores Avançados</h3>
<p><strong>6. Iron Condor:</strong> venda de put spread + venda de call spread. Lucra em mercados laterais. <strong>7. Butterfly:</strong> operação em três strikes, lucra em mercados sem tendência. <strong>8. Calendar Spread:</strong> vende opção de curto prazo, compra de longo prazo. <strong>9. Straddle/Strangle:</strong> aposta em volatilidade alta, independente da direção. <strong>10. Ratio Spread:</strong> vende mais opções do que compra, gerando crédito com risco limitado.</p>
<div class="end"><h3>Conclusão</h3><p>Derivativos são ferramentas, não apostas. Começe pelas estratégias de venda coberta e compra de puts — são as mais simples e as mais úteis para quem já tem carteira de ações. Domine-as completamente antes de avançar para estruturas mais complexas. O conhecimento dos derivativos é um diferencial raro e valioso no mercado.</p></div>`,
  ]
);

// ─── EBOOK 9 ────────────────────────────────────────────────────────────────
const eb9 = html(
  'FIRE no Brasil',
  'Como alcançar a independência financeira e se aposentar mais cedo no contexto brasileiro',
  [
    `<h2>O Que É o Movimento FIRE</h2>
<p class="intro">FIRE significa Financial Independence, Retire Early — Independência Financeira, Aposentadoria Antecipada. É um estilo de vida e uma estratégia financeira que desafia o modelo tradicional de trabalhar até os 65 anos.</p>
<p>O movimento começou nos Estados Unidos na década de 1990, popularizado pelo livro "Your Money or Your Life" e mais tarde pelo blog Mr. Money Mustache. A ideia central: acumular patrimônio suficiente para que os rendimentos cubram suas despesas indefinidamente — sem precisar trabalhar.</p>
<p>No Brasil, o FIRE ganhou força nos últimos anos. Com a Selic elevada e um mercado de capitais crescente, o país oferece condições únicas para aceleração da independência financeira. Ao mesmo tempo, desafios como inflação, tributação e custo de vida variável exigem adaptações da metodologia americana.</p>
<h3>As Variantes do FIRE</h3>
<ul>
<li><strong>Fat FIRE:</strong> independência financeira com alto padrão de vida (gastos acima de R$15.000/mês)</li>
<li><strong>Lean FIRE:</strong> independência financeira com estilo de vida simples (gastos abaixo de R$6.000/mês)</li>
<li><strong>Barista FIRE:</strong> patrimônio parcial + renda de trabalho de baixa intensidade escolhida por prazer</li>
<li><strong>Coast FIRE:</strong> patrimônio suficiente para crescer sozinho até a aposentadoria sem novos aportes</li>
</ul>
<div class="box"><div class="box-title">FIRE não é sobre parar de trabalhar</div><p>É sobre ter a escolha. Muitas pessoas que atingem o FIRE continuam trabalhando — mas fazendo o que amam, no ritmo que querem, sem depender do salário para sobreviver.</p></div>`,

    `<h2>Calculando Seu Número FIRE</h2>
<p class="intro">O "número FIRE" é o patrimônio total necessário para que seus rendimentos cubram suas despesas indefinidamente. Calculá-lo corretamente é o primeiro passo concreto do plano.</p>
<p>A fórmula base vem da pesquisa Trinity Study (1998): com uma taxa de retirada de 4% ao ano sobre o patrimônio, há alta probabilidade histórica de o portfólio durar 30+ anos sem se esgotar. Isso ficou conhecido como a Regra dos 4%.</p>
<h3>O Cálculo Básico</h3>
<p>Número FIRE = Gastos Anuais × 25. Se você precisa de R$8.000 por mês → R$96.000 por ano → Número FIRE = R$96.000 × 25 = R$2.400.000.</p>
<table>
<tr><th>Gastos Mensais</th><th>Gastos Anuais</th><th>Número FIRE</th></tr>
<tr><td>R$ 3.000</td><td>R$ 36.000</td><td>R$ 900.000</td></tr>
<tr><td>R$ 6.000</td><td>R$ 72.000</td><td>R$ 1.800.000</td></tr>
<tr><td>R$ 10.000</td><td>R$ 120.000</td><td>R$ 3.000.000</td></tr>
<tr><td>R$ 20.000</td><td>R$ 240.000</td><td>R$ 6.000.000</td></tr>
</table>
<h3>Ajustes para o Brasil</h3>
<p>A taxa de retirada segura pode ser diferente no Brasil. Com juros reais historicamente mais altos (5-7% ao ano), alguns especialistas argumentam que taxas de 5-6% são sustentáveis. Mas a volatilidade política e econômica brasileira sugere conservadorismo — manter os 4% ou usar 4,5% no máximo.</p>
<p>Também considere: plano de saúde (custo crescente com a idade), inflação médica acima do IPCA, e possível benefício de Previdência Social (INSS) que pode complementar as retiradas quando atingida a idade mínima.</p>`,

    `<h2>A Regra dos 4% no Contexto Brasileiro</h2>
<p class="intro">A Regra dos 4% funciona bem nos EUA, mas precisa de ajustes para o Brasil. Entender essas diferenças é crucial para construir um plano FIRE robusto e realista.</p>
<h3>O Que Diz o Trinity Study</h3>
<p>O estudo analisou carteiras americanas de 1926 a 1995 e concluiu que uma carteira de 50% ações / 50% renda fixa com retirada de 4% ao ano sobreviveu a todos os períodos históricos de 30 anos — incluindo 1929, 1973 e outros momentos adversos.</p>
<p>No Brasil, o principal diferencial positivo são os juros reais elevados. Um portfólio de renda fixa rendendo IPCA + 6% ao ano permite retirada real de 6% com patrimônio estável — teoricamente superior à regra dos 4% americana.</p>
<h3>Os Riscos Específicos do Brasil</h3>
<p><strong>Risco de mudança de regras tributárias:</strong> o governo pode tributar dividendos, aumentar o IR sobre investimentos, ou mudar a isenção dos FIIs. Um plano FIRE depende de décadas — o que é verdadeiro hoje pode não ser em 20 anos.</p>
<p><strong>Risco inflacionário setorial:</strong> saúde e educação inflacionam muito acima do IPCA. Uma família que planeja com base no IPCA pode se surpreender com esses custos na prática.</p>
<p><strong>Risco político e cambial:</strong> crises políticas podem gerar volatilidade extrema. Ter parte do patrimônio dolarizado reduz esse risco estruturalmente.</p>
<div class="box"><div class="box-title">Recomendação</div><p>Use a Regra dos 4% como ponto de partida, mas construa um buffer de 20-25% adicional sobre o número calculado. Tenha flexibilidade para reduzir gastos em anos de mercado adverso e planos B para gerar renda se necessário.</p></div>`,

    `<h2>Estratégias de Acumulação Acelerada e Pós-FIRE</h2>
<p class="intro">Atingir o número FIRE mais rapidamente requer maximizar a taxa de poupança e otimizar cada real investido. E depois de atingir? Há novas habilidades a desenvolver.</p>
<h3>A Variável Mais Importante: Taxa de Poupança</h3>
<p>A taxa de poupança (renda poupada / renda total) é o fator que mais acelera o FIRE. Com taxa de poupança de 10%, leva ~43 anos para atingir o FIRE. Com 50%, leva ~17 anos. Com 75%, apenas ~7 anos. A diferença é astronômica.</p>
<h3>Estratégias para Acelerar</h3>
<p><strong>Aumento de renda:</strong> freelances, negócio paralelo, desenvolvimento de habilidades valorizadas no mercado. Aumentar a renda tem efeito duplo — mais para poupar e base maior para crescimento.</p>
<p><strong>Redução de gastos estruturais:</strong> moradia, transporte e alimentação são os três maiores itens de qualquer orçamento. Otimizar esses três pode liberar 20-40% de renda extra para investimento.</p>
<p><strong>Maximizar aportes cedo:</strong> por causa dos juros compostos, R$1.000 investido aos 30 anos vale muito mais do que R$1.000 investido aos 45. Priorize aportes nos primeiros anos acima de tudo.</p>
<h3>Pós-FIRE — O Que Ninguém Te Conta</h3>
<p>Atingir o FIRE traz liberdade, mas também desafios inesperados: identidade sem trabalho, relacionamentos que mudam, necessidade de novos propósitos. A saúde mental no pós-FIRE é tão importante quanto a saúde financeira. Tenha clareza sobre como você quer passar seu tempo antes de chegar lá.</p>
<div class="end"><h3>Conclusão</h3><p>O FIRE no Brasil é possível e há muitos que já o atingiram. Não é um caminho fácil — exige sacrifícios hoje por liberdade amanhã. Mas para quem está comprometido, a independência financeira é uma meta concreta, calculável e alcançável. Defina seu número, trace seu plano, e comece agora.</p></div>`,
  ]
);

// ─── EBOOK 10 ────────────────────────────────────────────────────────────────
const eb10 = html(
  'Melhores Práticas do Investidor',
  'Os princípios, hábitos e mentalidades que separam investidores mediocres dos extraordinários',
  [
    `<h2>A Mentalidade do Investidor de Sucesso</h2>
<p class="intro">Mais do que técnica, investir bem é uma questão de mentalidade. Os maiores investidores da história não eram os mais inteligentes — eram os mais disciplinados, pacientes e emocionalmente controlados.</p>
<p>Daniel Kahneman, prêmio Nobel e pai da economia comportamental, demonstrou que humanos são sistematicamente irracionais quando tomam decisões financeiras. Temos vieses cognitivos que nos levam a comprar na alta (euforia), vender na baixa (pânico) e tomar decisões baseadas em emoções disfarçadas de razão.</p>
<p>O investidor de sucesso não elimina essas emoções — isso é impossível. Mas cria sistemas e processos que impedem que essas emoções controlem suas decisões. Uma política de investimento escrita, aportes automáticos e regras claras de rebalanceamento são exemplos desses sistemas.</p>
<h3>Os Cinco Vieses Mais Perigosos</h3>
<ul>
<li><strong>Viés de confirmação:</strong> buscar apenas informações que confirmam o que já acredita</li>
<li><strong>Efeito manada:</strong> fazer o que todo mundo está fazendo porque "todo mundo sabe"</li>
<li><strong>Aversão à perda:</strong> sofrer 2x mais com perdas do que se alegrar com ganhos equivalentes</li>
<li><strong>Ancoragem:</strong> apegar-se ao preço de compra como referência de valor "justo"</li>
<li><strong>Excesso de confiança:</strong> superestimar a própria capacidade de prever o mercado</li>
</ul>
<div class="box"><div class="box-title">A Regra de Ouro</div><p>Se você está animado para comprar, provavelmente está comprando tarde. Se está com medo de comprar, provavelmente é a melhor hora. O mercado recompensa quem faz o que é difícil psicologicamente.</p></div>`,

    `<h2>Diversificação e Rebalanceamento</h2>
<p class="intro">Diversificação é a proteção mais acessível que existe. Rebalanceamento é a disciplina que mantém a proteção ativa ao longo do tempo. Juntos, são a dupla mais poderosa da gestão de portfólio.</p>
<h3>Diversificação Inteligente</h3>
<p>Diversificar não é ter 50 ativos. É ter ativos com baixa correlação entre si — que não caem e sobem juntos. Ações brasileiras e bonds americanos têm correlação negativa em crises. IPCA+ e ações têm comportamentos distintos em diferentes fases do ciclo. FIIs e ações de tecnologia respondem de forma diferente a mudanças de juros.</p>
<p>Uma carteira realmente diversificada cobre: geografias (Brasil + internacional), classes de ativos (ações, renda fixa, FIIs, alternativos), setores (finanças, energia, consumo, tecnologia, saúde) e moedas (real, dólar, euro).</p>
<h3>Rebalanceamento — A Disciplina Mais Valiosa</h3>
<p>Com o tempo, a carteira se afasta da alocação original. Uma crise pode fazer ações caírem de 40% para 25% da carteira. Sem rebalanceamento, você fica subexposto à classe que mais vai se recuperar. Com rebalanceamento, você compra o que caiu (barato) usando o que subiu (caro).</p>
<p>Rebalance anualmente ou quando qualquer classe se afastar mais de 5 pontos percentuais da meta. Não rebalanceie com frequência excessiva — gera custo de transação e pode ser subótimo em tendências longas.</p>
<table>
<tr><th>Frequência</th><th>Vantagem</th><th>Desvantagem</th></tr>
<tr><td>Mensal</td><td>Sempre alinhado</td><td>Alto custo transacional</td></tr>
<tr><td>Trimestral</td><td>Equilíbrio razoável</td><td>Pode perder tendências</td></tr>
<tr><td>Anual</td><td>Baixo custo, simples</td><td>Desvios temporários</td></tr>
</table>`,

    `<h2>Planejamento Tributário e os 10 Mandamentos</h2>
<p class="intro">Cada real não pago em imposto é um real que continua compondo a seu favor. O planejamento tributário legal é uma das ferramentas mais poderosas e menos utilizadas pelos investidores brasileiros.</p>
<h3>Estratégias Tributárias Legais</h3>
<p><strong>Isenção de ações:</strong> vendas de ações até R$20.000 por mês são isentas de IR. Para investidores de longo prazo, essa isenção pode ser usada para rebalancear gradualmente sem pagar imposto.</p>
<p><strong>Day trade vs. swing trade:</strong> day trade tem alíquota de 20% + IRRF obrigatório. Operações normais pagam 15% apenas no lucro mensal acima de R$20.000. Evite day trade por razões tributárias além das razões de rentabilidade.</p>
<p><strong>Prejuízo a abater:</strong> prejuízos em renda variável podem ser compensados com lucros futuros na mesma categoria (ações com ações, FIIs com FIIs — mas não entre categorias). Registre todos os prejuízos na declaração mesmo sem lucros naquele ano.</p>
<p><strong>LCI/LCA e FII:</strong> use ao máximo os benefícios fiscais existentes. Priorize esses produtos quando o retorno líquido for equivalente ou superior à alternativa tributada.</p>
<div class="dark"><h3>Os 10 Mandamentos do Investidor</h3><ul>
<li>1. Construa e mantenha sua reserva de emergência antes de investir</li>
<li>2. Defina sua política de investimento por escrito e siga-a</li>
<li>3. Automatize aportes — não dependa de força de vontade mensal</li>
<li>4. Nunca invista o que não pode perder no prazo definido</li>
<li>5. Diversifique entre classes, geografias e moedas</li>
<li>6. Rebalanceie anualmente, não emocionalmente</li>
<li>7. Minimize custos — taxa de administração e IR fazem diferença enorme no longo prazo</li>
<li>8. Invista em si mesmo — educação financeira é o melhor retorno</li>
<li>9. Nunca tome decisões importantes em momentos de euforia ou pânico</li>
<li>10. Pense em décadas, não em meses</li>
</ul></div>
<div class="end"><h3>Conclusão Final</h3><p>Investir bem é uma habilidade aprendida, não um talento inato. Os princípios são simples, a execução é o desafio. Consistência, paciência e educação contínua são os únicos "segredos" que realmente funcionam. O mercado recompensa generosamente quem entende isso e age de acordo — durante décadas.</p></div>`,
  ]
);

// ─── INFRASTRUCTURE ─────────────────────────────────────────────────────────

async function generatePdf(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: FOOTER,
      margin: { top: '12mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });
  } finally {
    await browser.close();
  }
}

function uploadToSupabase(localPath, storageKey) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(localPath);
    const urlPath = `/storage/v1/object/biblioteca/${storageKey}`;
    const options = {
      hostname: `${require_env('SUPABASE_PROJECT_REF')}.supabase.co`,
      port: 443,
      path: urlPath,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/pdf',
        'Content-Length': fileData.length,
        'x-upsert': 'true',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

const EBOOKS = [
  { filename: 'primeiros-passos-do-investidor.pdf', content: eb1 },
  { filename: 'renda-fixa-descomplicada.pdf', content: eb2 },
  { filename: 'tesouro-direto-guia-definitivo.pdf', content: eb3 },
  { filename: 'titulos-tesouro-americano.pdf', content: eb4 },
  { filename: 'debentures-credito-privado.pdf', content: eb5 },
  { filename: 'fiis-do-zero-ao-avancado.pdf', content: eb6 },
  { filename: 'dividendos-renda-passiva-eterna.pdf', content: eb7 },
  { filename: 'derivativos-10-estrategias.pdf', content: eb8 },
  { filename: 'fire-no-brasil.pdf', content: eb9 },
  { filename: 'melhores-praticas-do-investidor.pdf', content: eb10 },
];

async function main() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const ebook of EBOOKS) {
    const localPath = path.join(TMP_DIR, ebook.filename);
    const storageKey = `ebooks/${ebook.filename}`;
    process.stdout.write(`Gerando ${ebook.filename}... `);
    try {
      await generatePdf(ebook.content, localPath);
      const stat = fs.statSync(localPath);
      process.stdout.write(`${Math.round(stat.size / 1024)}KB — Enviando... `);
      await uploadToSupabase(localPath, storageKey);
      console.log('OK');
    } catch (err) {
      console.log(`ERRO: ${err.message}`);
    }
  }
  console.log('\nConcluído!');
}

main().catch(console.error);
