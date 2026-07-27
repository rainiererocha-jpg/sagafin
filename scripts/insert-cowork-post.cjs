'use strict';
const https = require('https');
const { require_env } = require('./env.cjs');

const PROJECT = require_env('SUPABASE_PROJECT_REF');
const SERVICE_KEY = require_env('SUPABASE_SERVICE_ROLE_KEY');

function insert(row) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(row);
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      port: 443,
      path: '/rest/v1/posts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'resolution=ignore-duplicates,return=representation',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const post = {
  slug: 'resumo-diario-mercado-14-04-2026',
  titulo: 'Resumo Diário — Mercado Financeiro 14/04/2026',
  resumo: 'Ibovespa registra 2º recorde consecutivo acima dos 197 mil pontos, dólar recua rumo a R$ 5,00, IPCA de março surpreende com +0,88% e Copom deve cortar Selic em 0,25 p.p. em 28 de abril.',
  conteudo_html: `
<p><em>Análise diária gerada automaticamente com base em emails e notícias do dia — curada por Rainiere Rocha, Assessor de Investimentos XP.</em></p>

<h2>📈 Mercado &amp; Ações</h2>
<p>O Ibovespa encerrou o pregão de hoje acima dos <strong>197 mil pontos</strong>, marcando o segundo recorde consecutivo. O movimento reflete o apetite global por risco, com investidores internacionais voltando a alocar em emergentes após dados americanos benignos. O dólar recuou e segue em trajetória rumo a R$ 5,00 — nível não visto desde o início do ciclo de alta do Fed.</p>
<p>Destaques do dia na B3: bancos grandes (ITUB4, BBAS3) lideraram as altas, puxados pela expectativa de corte da Selic. Petrobras (PETR4) recuou levemente com o petróleo cedendo após dados de estoques americanos acima do esperado.</p>

<h2>🏛️ Copom &amp; Inflação</h2>
<p>O IPCA de março veio em <strong>+0,88%</strong>, acima do consenso de mercado (0,76%). No acumulado de 12 meses, a inflação ficou em 5,48% — acima do teto da meta (4,5%). O resultado aumenta a complexidade para o Copom na reunião de 28 de abril.</p>
<p>Apesar disso, o mercado precifica com probabilidade de 72% um corte de <strong>0,25 ponto percentual</strong> na Selic, levando a taxa para 13,50% ao ano. O Focus desta semana revisou a inflação de 2026 para <strong>4,71%</strong> e projeta Selic em <strong>12,50%</strong> no final do ano.</p>

<h2>💳 Crédito</h2>
<p>O estoque total de crédito no Brasil atingiu <strong>R$ 7,1 trilhões</strong>, crescimento de 11,2% em 12 meses. O lado preocupante: as taxas de juros livres chegaram a <strong>48,6% ao ano</strong> na média, e a inadimplência subiu para <strong>5,5%</strong> — maior nível em 18 meses. O Brasil acumula 332 milhões de dívidas em aberto, segundo o SPC/Serasa.</p>
<p>Para o investidor, o cenário de crédito caro reforça a tese de qualidade em renda variável — empresas com caixa robusto e baixa alavancagem tendem a se diferenciar quando o crédito aperta.</p>

<h2>🌍 Geopolítica</h2>
<p>Escalada no Oriente Médio continua pressionando os preços do petróleo e a percepção de risco global. A disputa entre <strong>EUA e China</strong> pela liderança em inteligência artificial ganha nova dimensão com análise de Nouriel Roubini: o economista argumenta que a corrida tecnológica entre as duas potências está "redefinindo o capitalismo global" — com implicações diretas para alocação em tecnologia e emergentes.</p>

<h2>🤖 Inteligência Artificial</h2>
<p>O FBI divulgou relatório revelando <strong>US$ 20,87 bilhões</strong> em perdas por fraudes digitais em 2025, alta de 26% em relação a 2024. Parcela crescente envolve IA generativa usada para golpes sofisticados. No setor financeiro, 59% das violações de dados em sistemas de IA envolvem informações financeiras sensíveis.</p>
<p>No lado positivo, ferramentas de IA já analisam dados macroeconômicos em tempo real, auxiliando gestores na identificação de anomalias e oportunidades antes que o mercado as precifique.</p>

<h2>📌 Resumo Executivo do Dia</h2>
<ul>
<li>Ibovespa: <strong>197 mil pts</strong> (+0,8%) — 2º recorde consecutivo</li>
<li>Dólar: <strong>R$ 5,08</strong> (-0,6%)</li>
<li>IPCA março: <strong>+0,88%</strong> (12m: 5,48%)</li>
<li>Selic esperada pós-Copom 28/04: <strong>13,50% a.a.</strong></li>
<li>Focus 2026: inflação 4,71% | Selic 12,50%</li>
</ul>

<p><em>Este resumo é produzido automaticamente pelo sistema de inteligência do Sagafin. Para análises personalizadas para sua carteira, fale com Rainiere Rocha.</em></p>
`,
  data_publicacao: '2026-04-14',
  tempo_leitura: '4 min',
  tags: ['Mercado', 'Ibovespa', 'Selic', 'IPCA', 'Resumo Diário'],
  destaque: true,
  status: 'published',
};

insert(post).then(r => {
  console.log(`Status: ${r.status}`);
  if (r.status === 201) console.log('✅ Post do COWORK inserido com sucesso!');
  else console.log(r.body.slice(0, 300));
}).catch(console.error);
