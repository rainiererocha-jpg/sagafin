'use strict';
// Conteúdo do "Manual Completo do Investidor" (isca do funil social "EU QUERO").
// Condensa a Biblioteca Saga (ebooks eb1–eb10 em scripts/generate-ebook-pdfs-v2.cjs e o guia de Derivativos)
// e acrescenta o capítulo de Mercado Futuro. Conteúdo AUTORAL e educacional: nada de material interno da XP,
// nenhum ativo recomendado, exemplos com números hipotéticos. Revisar antes de cada nova versão.
//
// Cada capítulo: { num, eyebrow, titulo, lead, html }. Tags permitidas no html: h3, p, ul, ol, li, strong, em,
// table/tr/th/td e as classes .box, .box-gold, .num-grid (ver template.cjs).

const capitulos = [
  {
    num: '01',
    eyebrow: 'Organização financeira',
    titulo: 'Antes de investir, descubra para onde o dinheiro vai.',
    lead: 'Quem não mede, não controla. O primeiro investimento é um mês de extrato lido com atenção.',
    html: `
<p>A maioria das pessoas não tem um problema de rentabilidade, tem um problema de fluxo. Ganhar mais sem organizar o orçamento costuma só aumentar o padrão de gastos. Por isso o manual começa aqui.</p>
<h3>O método 50-30-20, adaptado</h3>
<div class="num-grid">
  <div><strong>50%</strong><span>Necessidades: moradia, alimentação, saúde, transporte, escola.</span></div>
  <div><strong>30%</strong><span>Estilo de vida: lazer, viagens, assinaturas, restaurantes.</span></div>
  <div><strong>20%</strong><span>Futuro: reserva, investimentos, previdência, quitar dívidas caras.</span></div>
</div>
<p>Os percentuais são ponto de partida, não regra. Quem tem renda alta deve inverter a lógica: <strong>primeiro separa o investimento, depois vive com o resto</strong>. Programe a transferência para o dia seguinte ao salário.</p>
<h3>Os vazamentos da renda alta</h3>
<ul>
  <li><strong>Assinaturas esquecidas</strong>: some todas; o total costuma surpreender.</li>
  <li><strong>Parcelamentos que se acumulam</strong>: 10 parcelas "pequenas" viram um segundo aluguel.</li>
  <li><strong>Dinheiro parado na conta corrente</strong>: perde para a inflação todos os dias.</li>
  <li><strong>Seguros e tarifas duplicados</strong>: cartão, conta e seguro que se sobrepõem.</li>
</ul>
<h3>Dívidas: a ordem certa</h3>
<p>Nenhum investimento conservador paga mais que os juros do rotativo do cartão ou do cheque especial. Quite primeiro as dívidas mais caras (cartão, cheque especial, crédito pessoal) antes de pensar em carteira. Financiamentos imobiliários com juros baixos podem conviver com investimentos.</p>
<div class="box-gold"><strong>Tarefa da semana:</strong> baixe os extratos dos últimos 3 meses, classifique cada gasto em uma das três caixas e descubra seu percentual real de "futuro".</div>`,
  },
  {
    num: '02',
    eyebrow: 'Reserva de emergência',
    titulo: 'A reserva é o que deixa você investir com calma.',
    lead: 'Sem reserva, qualquer imprevisto vira resgate no pior momento do mercado.',
    html: `
<p>A reserva de emergência não existe para render; existe para <strong>proteger o resto da carteira</strong>. É ela que permite segurar um investimento de longo prazo quando o mercado cai.</p>
<h3>Quanto guardar</h3>
<table>
  <tr><th>Perfil de renda</th><th>Reserva sugerida</th></tr>
  <tr><td>Servidor público / renda muito estável</td><td>3 a 6 meses de custo de vida</td></tr>
  <tr><td>CLT</td><td>6 meses</td></tr>
  <tr><td>Autônomo, PJ, empresário, comissionado</td><td>9 a 12 meses</td></tr>
</table>
<h3>Onde deixar</h3>
<p>Três critérios, nesta ordem: <strong>segurança, liquidez diária e rendimento</strong>. Servem bem o Tesouro Selic, CDBs de liquidez diária de bancos sólidos (cobertos pelo FGC até o limite por CPF e instituição) e fundos DI de taxa baixa.</p>
<ul>
  <li>Evite deixar a reserva em ações, fundos com cotização longa ou títulos que oscilam com o juro (prefixados longos, IPCA+).</li>
  <li>Poupança é segura, mas costuma render menos que as alternativas acima.</li>
</ul>
<div class="box">Depois de montada, a reserva só é usada para emergência de verdade. Usou? A prioridade passa a ser recompô-la.</div>`,
  },
  {
    num: '03',
    eyebrow: 'Perfil e objetivos',
    titulo: 'Cada dinheiro tem um prazo. Cada prazo tem um investimento.',
    lead: 'A pergunta certa não é "qual investimento rende mais", e sim "para quando eu preciso deste dinheiro".',
    html: `
<p>O perfil de investidor (conservador, moderado, arrojado) não é um rótulo fixo: ele combina sua tolerância a oscilações, seu conhecimento e, principalmente, o <strong>prazo</strong> de cada objetivo.</p>
<h3>Organize por caixas de objetivo</h3>
<table>
  <tr><th>Prazo</th><th>Exemplo</th><th>Prioridade</th></tr>
  <tr><td>Até 2 anos</td><td>Viagem, troca de carro</td><td>Previsibilidade: pós-fixados, prefixados curtos</td></tr>
  <tr><td>2 a 5 anos</td><td>Entrada de imóvel, estudos</td><td>Equilíbrio: renda fixa diversificada, um pouco de risco</td></tr>
  <tr><td>Acima de 5 anos</td><td>Aposentadoria, independência</td><td>Crescimento real: IPCA+, ações, FIIs, exterior</td></tr>
</table>
<h3>Risco, retorno e diversificação</h3>
<p>Retorno maior sempre vem com mais risco: de crédito (o emissor não pagar), de mercado (o preço oscilar), de liquidez (não conseguir vender quando precisa) e cambial. Diversificar é combinar ativos que <strong>não caem todos ao mesmo tempo</strong>.</p>
<div class="box-gold">O melhor operador de mercado é o tempo. Uma carteira coerente com o prazo aguenta as quedas sem que você precise vender no prejuízo.</div>`,
  },
  {
    num: '04',
    eyebrow: 'Renda fixa e Tesouro Direto',
    titulo: 'A base da carteira: entender pós, pré e IPCA+.',
    lead: 'Renda fixa não quer dizer rendimento fixo. Quer dizer que as regras de remuneração são conhecidas na compra.',
    html: `
<h3>Os três tipos de remuneração</h3>
<div class="num-grid">
  <div><strong>Pós-fixado</strong><span>Acompanha a Selic/CDI. Ideal para reserva e curto prazo. Oscila pouco.</span></div>
  <div><strong>Prefixado</strong><span>Taxa travada na compra. Ganha se os juros caírem; oscila se subirem.</span></div>
  <div><strong>IPCA+</strong><span>Inflação + taxa real. Protege o poder de compra no longo prazo.</span></div>
</div>
<h3>Marcação a mercado em uma frase</h3>
<p>Quando a taxa de juros do mercado sobe, o preço dos títulos que você já tem cai (e vice-versa). Se você <strong>levar o título até o vencimento</strong>, recebe exatamente a taxa contratada. A oscilação só vira perda se você vender antes.</p>
<h3>Os principais produtos</h3>
<ul>
  <li><strong>Tesouro Direto</strong> (Selic, Prefixado, IPCA+, Renda+, Educa+): risco do governo federal.</li>
  <li><strong>CDB</strong>: emitido por bancos, coberto pelo FGC dentro dos limites.</li>
  <li><strong>LCI e LCA</strong>: isentas de IR para pessoa física, com carência mínima; também cobertas pelo FGC.</li>
</ul>
<h3>Imposto de renda (tabela regressiva)</h3>
<table>
  <tr><th>Prazo da aplicação</th><th>Alíquota sobre o rendimento</th></tr>
  <tr><td>Até 180 dias</td><td>22,5%</td></tr>
  <tr><td>181 a 360 dias</td><td>20%</td></tr>
  <tr><td>361 a 720 dias</td><td>17,5%</td></tr>
  <tr><td>Acima de 720 dias</td><td>15%</td></tr>
</table>
<p class="nota">Regras tributárias mudam. Confira a legislação vigente na data do investimento.</p>`,
  },
  {
    num: '05',
    eyebrow: 'Crédito privado',
    titulo: 'Debêntures, CRI e CRA: mais taxa, mais análise.',
    lead: 'Você empresta dinheiro a uma empresa. A taxa maior é o pagamento pelo risco de crédito.',
    html: `
<p>O crédito privado é a renda fixa emitida por empresas. Não tem cobertura do FGC, então a pergunta central é: <strong>essa empresa vai conseguir me pagar até o vencimento?</strong></p>
<h3>Os instrumentos</h3>
<ul>
  <li><strong>Debêntures comuns</strong>: tributadas pela tabela regressiva.</li>
  <li><strong>Debêntures incentivadas</strong> (infraestrutura): isentas de IR para pessoa física.</li>
  <li><strong>CRI e CRA</strong>: lastreados em recebíveis imobiliários e do agronegócio; isentos de IR para pessoa física.</li>
</ul>
<h3>Checklist de análise</h3>
<ol>
  <li>Rating de agência e tendência dele.</li>
  <li>Alavancagem (dívida líquida / EBITDA) e geração de caixa.</li>
  <li>Garantias e posição do título na fila de credores.</li>
  <li>Prazo, liquidez no secundário e concentração: nenhum emissor deve pesar demais na carteira.</li>
  <li>Spread: compare a taxa com um título público de prazo parecido. Se o prêmio é pequeno, o risco pode não valer.</li>
</ol>
<div class="box">Isenção de IR é vantagem, não motivo de compra. Avalie primeiro o crédito, depois o benefício fiscal.</div>`,
  },
  {
    num: '06',
    eyebrow: 'Fundos imobiliários',
    titulo: 'FIIs: renda mensal de imóveis sem comprar um imóvel.',
    lead: 'Cotas negociadas na bolsa dão acesso a lajes, galpões, shoppings e recebíveis imobiliários.',
    html: `
<h3>Tijolo, papel e híbridos</h3>
<div class="num-grid">
  <div><strong>Tijolo</strong><span>Imóveis físicos: logística, lajes, shoppings, renda urbana. Renda de aluguel.</span></div>
  <div><strong>Papel</strong><span>CRIs e títulos imobiliários. Renda ligada a juros e inflação.</span></div>
  <div><strong>Híbridos / FoFs</strong><span>Combinam estratégias ou investem em outros FIIs.</span></div>
</div>
<h3>Como analisar um FII</h3>
<ul>
  <li><strong>P/VP</strong>: preço da cota sobre o valor patrimonial. Abaixo de 1 pode ser desconto ou sinal de problema.</li>
  <li><strong>Vacância</strong> física e financeira, e qualidade dos inquilinos.</li>
  <li><strong>Prazo e tipo dos contratos</strong> (típicos ou atípicos), reajuste e revisões.</li>
  <li><strong>Gestão</strong>: histórico, taxas e transparência dos relatórios.</li>
  <li><strong>Liquidez diária</strong> da cota na bolsa.</li>
</ul>
<h3>Tributação (pessoa física)</h3>
<p>Os rendimentos mensais distribuídos por FIIs que cumprem os requisitos legais são isentos de IR para pessoa física. O ganho na venda das cotas é tributado em 20%. Confira as regras vigentes antes de investir.</p>
<div class="box-gold">Comparado a um imóvel direto, o FII tem mais diversificação, menos burocracia e venda fracionada. Mas a cota oscila na bolsa como uma ação.</div>`,
  },
  {
    num: '07',
    eyebrow: 'Ações e dividendos',
    titulo: 'Seja sócio de boas empresas e deixe os dividendos trabalharem.',
    lead: 'Ação é um pedaço de uma empresa. No longo prazo, quem gera lucro crescente tende a ser recompensado.',
    html: `
<h3>O que observar numa boa pagadora</h3>
<ul>
  <li>Lucros consistentes ao longo de vários ciclos, não só no último ano.</li>
  <li><strong>Payout</strong> sustentável: distribuir 100% do lucro sempre pode faltar para crescer.</li>
  <li>Dívida sob controle e setor com demanda previsível (energia, saneamento, bancos, seguros).</li>
  <li>Governança: histórico de respeito ao acionista minoritário.</li>
</ul>
<h3>Dividend yield x crescimento de dividendos</h3>
<p>Um yield alto hoje pode ser armadilha (preço caiu por um problema). Às vezes vale mais uma empresa que paga menos hoje, mas <strong>aumenta o dividendo todo ano</strong>.</p>
<h3>O motor do reinvestimento</h3>
<p>Reinvestir os proventos compra mais ações, que pagam mais proventos. Em prazos longos, a maior parte do retorno de uma carteira de dividendos vem desse efeito composto.</p>
<h3>Tributação</h3>
<p>Ganho na venda de ações no mercado à vista: 15% (operações comuns), com isenção para vendas totais de até R$ 20 mil por mês. Day trade: 20%. A Lei nº 15.270/2025 passou a prever retenção na fonte sobre dividendos acima de determinado valor mensal pagos por uma mesma empresa a uma pessoa física. Confira os detalhes vigentes com seu assessor e contador.</p>`,
  },
  {
    num: '08',
    eyebrow: 'Investimento internacional',
    titulo: 'Não coloque o patrimônio inteiro em um único país.',
    lead: 'Dolarizar parte da carteira é diversificação, não aposta contra o Brasil.',
    html: `
<p>Investir só no Brasil é concentrar tudo em uma moeda, uma economia e um cenário político. Uma parcela no exterior reduz esse risco.</p>
<h3>Caminhos sem complicação</h3>
<ul>
  <li><strong>ETFs de índices globais listados na B3</strong> (como os que replicam o S&amp;P 500): compra pela corretora brasileira, como uma ação.</li>
  <li><strong>BDRs</strong>: recibos de ações estrangeiras negociados aqui. Replicam empresas específicas.</li>
  <li><strong>Fundos com exposição internacional</strong>, com ou sem proteção cambial (hedge).</li>
  <li><strong>Conta no exterior</strong>: acesso direto a ações, ETFs e Treasuries; exige atenção a câmbio e declaração.</li>
</ul>
<h3>Treasuries: a renda fixa do governo americano</h3>
<p>Bills (até 1 ano), Notes (2 a 10 anos) e Bonds (20 a 30 anos) são considerados referência de baixo risco de crédito em dólar. Para o brasileiro, a principal variável é o <strong>câmbio</strong>: o resultado em reais depende do dólar na entrada e na saída.</p>
<div class="box">Com ou sem hedge? Sem hedge você ganha exposição ao dólar (protege em crises locais). Com hedge você fica só com o ativo, sem a variação cambial.</div>`,
  },
  {
    num: '09',
    eyebrow: 'Previdência e PGBL',
    titulo: 'O benefício fiscal que muita gente deixa na mesa.',
    lead: 'Para quem faz a declaração completa, o PGBL pode devolver parte do imposto todo ano.',
    html: `
<h3>PGBL x VGBL</h3>
<table>
  <tr><th></th><th>PGBL</th><th>VGBL</th></tr>
  <tr><td>Para quem</td><td>Declaração completa do IR</td><td>Declaração simplificada ou quem já atingiu o limite do PGBL</td></tr>
  <tr><td>Benefício</td><td>Deduz até 12% da renda tributável bruta</td><td>Sem dedução</td></tr>
  <tr><td>IR no resgate</td><td>Sobre o valor total</td><td>Só sobre o rendimento</td></tr>
</table>
<h3>Servidor público também pode</h3>
<p>Quem contribui para regime próprio de previdência (RPPS) também cumpre o requisito de contribuir para a previdência oficial e pode usar o PGBL. Na faixa de 27,5% do IR, cada real aportado dentro do limite reduz a base de cálculo do imposto.</p>
<h3>Tabela regressiva: o prazo trabalha a seu favor</h3>
<p>Na tributação regressiva, a alíquota começa em 35% e cai 5 pontos a cada 2 anos, chegando a 10% após 10 anos. Diferir o imposto hoje (27,5%) para pagar 10% lá na frente é o coração da estratégia.</p>
<ul>
  <li>Compare a <strong>taxa de administração</strong>: no longo prazo, ela pesa mais que quase tudo.</li>
  <li>Previdência também é ferramenta sucessória: em geral não entra em inventário.</li>
</ul>
<p class="nota">A conta depende da sua declaração. Faça a simulação com seus números antes de aportar.</p>`,
  },
  {
    num: '10',
    eyebrow: 'Independência financeira',
    titulo: 'Qual é o seu número? O método FIRE no Brasil.',
    lead: 'Independência financeira é quando a carteira paga seu custo de vida sem você precisar trabalhar.',
    html: `
<h3>Calcule o seu número</h3>
<p>Uma referência clássica é a "regra dos 4%": acumular cerca de <strong>25 vezes o seu gasto anual</strong>. Exemplo hipotético: custo de vida de R$ 10 mil por mês = R$ 120 mil por ano × 25 = R$ 3 milhões.</p>
<h3>Ajustes para o Brasil</h3>
<ul>
  <li>A regra nasceu de dados americanos. No Brasil, juros reais historicamente mais altos e inflação mais volátil pedem prudência: muitos planejadores trabalham com taxas de retirada entre 3% e 4%.</li>
  <li>Proteja a carteira da inflação: títulos IPCA+ são peça central.</li>
  <li>Considere saúde, imprevistos e longevidade no cálculo.</li>
</ul>
<h3>As três alavancas da acumulação</h3>
<div class="num-grid">
  <div><strong>Taxa de poupança</strong><span>É a alavanca mais poderosa nos primeiros anos.</span></div>
  <div><strong>Tempo</strong><span>Juros compostos precisam de prazo para aparecer.</span></div>
  <div><strong>Custos e impostos</strong><span>Taxas baixas e eficiência fiscal valem retorno extra.</span></div>
</div>`,
  },
  {
    num: '11',
    eyebrow: 'Opções',
    titulo: 'Opções: proteção e renda, com regras claras de risco.',
    lead: 'Derivativos são ferramentas. Nas mãos certas, protegem a carteira; sem gestão de risco, amplificam perdas.',
    html: `
<h3>O básico</h3>
<ul>
  <li><strong>Call</strong>: direito de comprar um ativo a um preço definido (strike) até uma data.</li>
  <li><strong>Put</strong>: direito de vender a um preço definido. Funciona como um seguro.</li>
  <li>Quem compra a opção paga um <strong>prêmio</strong>; quem vende recebe o prêmio e assume a obrigação.</li>
</ul>
<h3>As 10 estratégias da Biblioteca, em uma linha cada</h3>
<table>
  <tr><th>Estratégia</th><th>Objetivo</th></tr>
  <tr><td>Venda coberta</td><td>Gerar renda sobre ações que você já tem</td></tr>
  <tr><td>Protective put</td><td>Seguro contra queda forte</td></tr>
  <tr><td>Collar</td><td>Proteção com custo reduzido, abrindo mão de parte da alta</td></tr>
  <tr><td>Bull / Bear spread</td><td>Posição direcional com risco limitado</td></tr>
  <tr><td>Straddle / Strangle</td><td>Posição em volatilidade, não em direção</td></tr>
  <tr><td>Butterfly</td><td>Lucro se o preço ficar perto de um ponto</td></tr>
  <tr><td>Calendar spread</td><td>Aproveitar a passagem do tempo entre vencimentos</td></tr>
  <tr><td>Iron Condor</td><td>Renda em mercado lateral, com perda máxima definida</td></tr>
</table>
<h3>Gestão de risco</h3>
<ol>
  <li>Defina a perda máxima antes de montar qualquer estrutura.</li>
  <li>Nunca venda opção descoberta sem entender o risco ilimitado.</li>
  <li>Tamanho de posição pequeno em relação ao patrimônio.</li>
  <li>Liquidez: opções sem negócios podem ser impossíveis de desmontar.</li>
</ol>
<p class="nota">Exemplos educacionais. Operações com derivativos podem gerar perdas superiores ao valor investido.</p>`,
  },
  {
    num: '12',
    eyebrow: 'Mercado futuro',
    titulo: 'Mini-índice e mini-dólar: como funciona o mercado futuro.',
    lead: 'No mercado futuro você negocia um preço para uma data. Não compra o ativo: assume o compromisso e acerta a diferença todo dia.',
    html: `
<h3>Os contratos mais negociados na B3</h3>
<table>
  <tr><th>Contrato</th><th>Código</th><th>Referência</th><th>Valor do ponto</th></tr>
  <tr><td>Mini-índice</td><td>WIN</td><td>Ibovespa futuro</td><td>R$ 0,20 por ponto</td></tr>
  <tr><td>Mini-dólar</td><td>WDO</td><td>Dólar comercial (US$ 10 mil)</td><td>R$ 10,00 por ponto</td></tr>
</table>
<p>Exemplo hipotético: comprar 1 WIN e o índice futuro subir 1.000 pontos gera R$ 200 de ganho (1.000 × R$ 0,20). Se cair 1.000 pontos, R$ 200 de perda.</p>
<h3>Margem de garantia e ajuste diário</h3>
<p>Para abrir posição, a B3 exige uma <strong>margem de garantia</strong>, uma fração do valor do contrato: é isso que cria a <strong>alavancagem</strong>. Todo dia a posição é comparada ao preço de ajuste e ganhos entram ou perdas saem da sua conta (<strong>ajuste diário</strong>). Se o saldo não cobrir as perdas, a corretora pode exigir mais garantia ou encerrar a posição.</p>
<h3>Para que serve</h3>
<p><strong>Hedge</strong>: proteger uma carteira de ações (vendendo índice) ou uma dívida em dólar (comprando dólar). <strong>Especulação</strong>: posicionar-se na direção do mercado, com técnica, disciplina e capital que você aceita perder. <strong>Arbitragem</strong>: aproveitar distorções de preço entre mercados (uso profissional).</p>
<h3>Tributação</h3>
<p>Day trade: 20% sobre o lucro líquido (com retenção de 1% na fonte). Operações comuns (swing trade) no mercado futuro: 15%. Não há isenção de R$ 20 mil para futuros. O imposto é pago via DARF até o último dia útil do mês seguinte.</p>
<h3>Regras de sobrevivência</h3>
<p>1) Comece em simulador, depois com 1 contrato. 2) <strong>Stop definido antes da entrada</strong>, sempre. 3) Arrisque uma fração pequena do capital por operação. 4) Registre cada operação. 5) Nunca use a reserva de emergência como margem.</p>
<div class="box-gold">A alavancagem multiplica os dois lados. A maioria das pessoas físicas que operam day trade de forma recorrente perde dinheiro. Entenda o risco antes de operar.</div>`,
  },
];

const glossario = [
  ['CDI', 'Taxa de referência dos empréstimos entre bancos; anda junto com a Selic.'],
  ['Selic', 'Taxa básica de juros da economia, definida pelo Copom.'],
  ['IPCA', 'Índice oficial de inflação do Brasil.'],
  ['FGC', 'Fundo Garantidor de Créditos: cobre CDB, LCI, LCA e poupança até o limite por CPF e instituição.'],
  ['Marcação a mercado', 'Atualização diária do preço de um título conforme as taxas do mercado.'],
  ['Liquidez', 'Facilidade de transformar o investimento em dinheiro sem perder valor.'],
  ['Dividend yield', 'Proventos pagos em 12 meses divididos pelo preço da ação.'],
  ['P/VP', 'Preço da cota dividido pelo valor patrimonial (usado em FIIs e ações).'],
  ['Hedge', 'Operação de proteção contra um risco específico.'],
  ['Strike', 'Preço de exercício de uma opção.'],
  ['Margem de garantia', 'Valor depositado como garantia para operar derivativos.'],
  ['Ajuste diário', 'Liquidação diária de ganhos e perdas nas posições de mercado futuro.'],
  ['Alavancagem', 'Exposição maior que o capital próprio; amplia ganhos e perdas.'],
  ['Rebalanceamento', 'Voltar a carteira aos percentuais-alvo depois que os ativos se mexem.'],
];

module.exports = { capitulos, glossario };
