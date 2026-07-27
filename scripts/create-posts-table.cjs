'use strict';
const https = require('https');
const { require_env } = require('./env.cjs');

const TOKEN = require_env('SUPABASE_ACCESS_TOKEN');
const PROJECT = require_env('SUPABASE_PROJECT_REF');
const SERVICE_KEY = require_env('SUPABASE_SERVICE_ROLE_KEY');

function runSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
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

function restInsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
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
        'Prefer': 'resolution=ignore-duplicates',
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

const QUERIES = [
  // 1. Create table
  `CREATE TABLE IF NOT EXISTS posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    titulo text NOT NULL,
    resumo text,
    conteudo_html text,
    data_publicacao date DEFAULT CURRENT_DATE,
    tempo_leitura text DEFAULT '5 min',
    tags text[] DEFAULT '{}',
    destaque boolean DEFAULT false,
    status text DEFAULT 'published',
    criado_em timestamptz DEFAULT now()
  )`,
  // 2. RLS on
  `ALTER TABLE posts ENABLE ROW LEVEL SECURITY`,
  // 3. Read policy
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='read_published') THEN
      CREATE POLICY read_published ON posts FOR SELECT USING (status = 'published');
    END IF;
  END $$`,
  // 4. Insert policy
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='service_insert') THEN
      CREATE POLICY service_insert ON posts FOR INSERT WITH CHECK (true);
    END IF;
  END $$`,
  // 5. Update policy
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='service_update') THEN
      CREATE POLICY service_update ON posts FOR UPDATE USING (true);
    END IF;
  END $$`,
];

const SEED_POSTS = [
  {
    slug: 'assessoria-xp-goiania',
    titulo: 'Como escolher um assessor de investimentos XP em Goiânia',
    resumo: 'Entenda o que é um assessor de investimentos credenciado XP, quais as vantagens em relação ao gerente de banco e como escolher o profissional certo para o seu perfil.',
    conteudo_html: `<h2>O que é um Assessor de Investimentos XP?</h2>
<p>Um assessor de investimentos credenciado XP é um profissional autônomo, habilitado pela Comissão de Valores Mobiliários (CVM) e pela própria XP Investimentos, para orientar clientes na construção e gestão de carteiras de investimento. Diferente do gerente de banco, o assessor não tem metas de produtos próprios para vender — seu interesse é o resultado do cliente.</p>
<p>Em Goiânia, o mercado de assessoria de investimentos cresceu significativamente nos últimos anos. A capital goiana, com sua economia dinâmica e classe média em expansão, tem demanda crescente por profissionais qualificados capazes de orientar desde o pequeno poupador até o empresário com patrimônio consolidado.</p>
<h2>Assessor vs. Gerente de Banco: as diferenças que importam</h2>
<p>O gerente de banco trabalha para a instituição financeira. Sua remuneração está atrelada à venda de produtos do próprio banco — CDBs, seguros, fundos exclusivos com taxas elevadas. Não há nada de errado nisso, mas significa que os produtos que ele oferece nem sempre são os melhores do mercado para você.</p>
<p>O assessor XP tem acesso a uma plataforma com mais de 1.000 produtos de diferentes emissores: CDBs de bancos médios com taxas superiores, LCIs e LCAs, debêntures incentivadas, fundos de gestoras independentes, ETFs, FIIs, ações. A remuneração vem da própria XP, baseada no patrimônio do cliente — não em comissões por produto vendido.</p>
<h2>Como escolher o assessor certo para seu perfil</h2>
<p>Verifique o registro na CVM (todos os assessores devem estar registrados como Agentes Autônomos de Investimento). Pergunte sobre a experiência com perfis similares ao seu — investidores conservadores têm necessidades muito diferentes de investidores arrojados. Avalie a qualidade da comunicação: um bom assessor explica em linguagem clara, sem jargões desnecessários.</p>
<p>Por fim, verifique se o assessor investe no próprio produto que recomenda. Alinhamento de interesses é o melhor indicador de qualidade em qualquer relação de assessoria financeira.</p>`,
    data_publicacao: '2026-03-15',
    tempo_leitura: '5 min',
    tags: ['Assessoria', 'XP Investimentos', 'Goiânia'],
    destaque: true,
    status: 'published',
  },
  {
    slug: 'derivativos-opcoes',
    titulo: 'Derivativos e Opções: como usar para proteger e alavancar sua carteira',
    resumo: 'Guia completo sobre derivativos financeiros: o que são, como funcionam as opções de compra e venda, estratégias de hedge e quando usá-los na sua carteira.',
    conteudo_html: `<h2>O que são Derivativos?</h2>
<p>Derivativos são instrumentos financeiros cujo valor deriva de um ativo subjacente — uma ação, índice, moeda, commodity ou taxa de juros. Apesar da reputação assustadora, derivativos são ferramentas poderosas quando utilizados com conhecimento e disciplina.</p>
<p>Os dois tipos mais acessíveis ao investidor pessoa física são as <strong>opções</strong> (calls e puts) e os <strong>minicontratos futuros</strong> de índice (WINM) e dólar (WDOM). Cada um tem características, riscos e aplicações distintas.</p>
<h2>Opções de Compra (Call) e Venda (Put)</h2>
<p>Uma <strong>call</strong> dá ao comprador o direito de comprar um ativo a um preço predeterminado (strike) até uma data de vencimento. Uma <strong>put</strong> dá o direito de vender. Quem compra paga um prêmio. Quem vende recebe o prêmio e assume a obrigação.</p>
<p>Para o investidor de longo prazo, a estratégia mais útil é a <strong>venda coberta de call</strong>: você possui ações e vende calls sobre elas, recebendo prêmio mensal como renda adicional. É como cobrar aluguel das suas ações. Em mercados laterais, pode gerar 10-20% ao ano de renda adicional sobre a posição.</p>
<h2>Hedge: protegendo sua carteira</h2>
<p>A compra de puts funciona como um seguro para a carteira. Você paga um prêmio (1-3% ao ano) e garante que, se o mercado cair abaixo do strike, você será compensado. Para carteiras acima de R$ 100.000, essa proteção pode fazer sentido em momentos de alta incerteza política ou econômica.</p>
<p>O princípio fundamental: use derivativos como ferramenta de gestão de risco, nunca como aposta especulativa. Comece com posições pequenas (2-5% do portfólio) e apenas depois de dominar completamente o instrumento.</p>`,
    data_publicacao: '2026-03-22',
    tempo_leitura: '8 min',
    tags: ['Derivativos', 'Opções', 'Estratégia'],
    destaque: false,
    status: 'published',
  },
  {
    slug: 'ia-financas-investimentos',
    titulo: 'Inteligência Artificial nas finanças: como a IA está mudando os investimentos',
    resumo: 'Como ferramentas de IA estão revolucionando a análise de carteiras, detecção de oportunidades e o perfil de risco dos investidores. O futuro da assessoria de investimentos.',
    conteudo_html: `<h2>A IA no mercado financeiro</h2>
<p>A inteligência artificial já está presente em praticamente todos os aspectos do mercado financeiro — da detecção de fraudes em tempo real à análise preditiva de crédito, passando pela gestão algorítmica de carteiras. O que mudou recentemente é a democratização: ferramentas antes restritas a hedge funds bilionários estão acessíveis a qualquer assessor ou investidor individual.</p>
<p>Modelos de linguagem como o GPT-4 e o Claude conseguem analisar relatórios de resultados, atas do Copom e notícias geopolíticas em segundos, sintetizando informações que levariam horas para um analista humano processar. Não substituem o julgamento humano — mas amplificam a capacidade de análise de forma sem precedentes.</p>
<h2>Como a IA está mudando a assessoria de investimentos</h2>
<p>Na assessoria, a IA está transformando três áreas principais. <strong>Análise de perfil:</strong> algoritmos identificam padrões de comportamento que questionários tradicionais perdem — como o investidor reage em quedas, sua consistência nos aportes, sua sensibilidade a determinados setores. <strong>Personalização de carteira:</strong> modelos de otimização sugerem alocações considerando centenas de variáveis simultaneamente. <strong>Monitoramento contínuo:</strong> alertas automáticos quando ativos da carteira apresentam mudanças relevantes em fundamentos.</p>
<h2>O futuro próximo</h2>
<p>Nos próximos 2-3 anos, veremos assessores utilizando IA para gerar relatórios personalizados automaticamente, identificar oportunidades em ativos específicos para o perfil de cada cliente e monitorar riscos sistêmicos em tempo real. A IA não eliminará o assessor — mas tornará obsoleto o assessor que não souber usá-la. O diferencial humano — confiança, empatia, planejamento de vida — continuará sendo insubstituível.</p>`,
    data_publicacao: '2026-04-01',
    tempo_leitura: '6 min',
    tags: ['Inteligência Artificial', 'Inovação', 'Fintech'],
    destaque: false,
    status: 'published',
  },
];

async function main() {
  // Run DDL queries
  for (const q of QUERIES) {
    process.stdout.write('SQL... ');
    const r = await runSQL(q);
    if (r.status >= 200 && r.status < 300) {
      console.log('OK');
    } else {
      console.log(`AVISO (${r.status}): ${r.body.slice(0, 120)}`);
    }
  }

  // Seed posts
  console.log('\nInserindo posts...');
  const r = await restInsert(SEED_POSTS);
  console.log(`Seed: ${r.status} — ${r.body.slice(0, 200)}`);
  console.log('\nConcluído!');
}

main().catch(console.error);
