// Conteúdo estático da seção "Como as melhores referências fazem" e das regras do agente.
// Fontes: benchmark de produtos de ideias de trade (docs/benchmark-casas-recomendacao.md).

export const REGRAS_AGENTE = [
  { titulo: "45 dias para vencer", texto: "Venda de prêmio concentrada em vencimentos de 28 a 60 dias (alvo 45), a faixa em que o theta acelera sem a gama explosiva da última semana. Semanais e diários só como estudo de evento." },
  { titulo: "Delta 16 e 25", texto: "Strikes vendidos perto de 1 desvio-padrão (delta 16) em strangles e condors; delta 25 em spreads. É a referência dos estudos da tastylive para probabilidade teórica entre 65% e 80%." },
  { titulo: "IV rank acima de 30", texto: "Prêmio só é vendido quando a volatilidade implícita está no terço superior do ano e acima da volatilidade realizada. Abaixo de 20, o estudo vira estrutura comprada (debit spread)." },
  { titulo: "Liquidez 3+ estrelas", texto: "Só ativos com nota de liquidez 3 ou 4 na tastytrade e pernas com spread bid-ask de até 30% do preço. Sem isso, a vantagem estatística morre na execução." },
  { titulo: "Gerenciar a 50% ou 21 DTE", texto: "O estudo encerra ao capturar metade do lucro máximo ou ao chegar a 21 dias do vencimento, o que vier primeiro. Perdedores definidos não são gerenciados: o risco já é conhecido na entrada." },
  { titulo: "Sem resultado dentro do prazo", texto: "Estruturas mensais e semestrais evitam datas de balanço dentro do vencimento. Resultado trimestral só entra no horizonte diário, declarado como estudo de evento." },
];

export const REFERENCIAS = [
  { nome: "tastylive", oQueFaz: "Mostra ao vivo as operações da equipe de pesquisa, com strikes, crédito, POP, P50 e buying power. Não vende sinal: a receita é a corretora.", licao: "Formato de card com todos os números e regras mecânicas de entrada e saída." },
  { nome: "TradingView Ideas", oQueFaz: "Ideia = gráfico + direção + entrada, alvo e stop. Não pode ser apagada, só atualizada com status: alvo atingido, stop atingido, fechada manualmente.", licao: "Histórico público imutável. Aqui: estudos encerrados ficam na tabela com o resultado hipotético." },
  { nome: "Seeking Alpha Alpha Picks", oQueFaz: "Duas escolhas por mês, preço de abertura do dia da publicação, aba de fechadas e comparação com o S&P 500.", licao: "Cadência fixa e método de cálculo explícito do resultado." },
  { nome: "Simply Wall St", oQueFaz: "Snowflake de 5 eixos e narrativas com premissas que recalculam o valor justo quando os dados mudam.", licao: "Mostrar as premissas, não só a conclusão: cada estudo traz cenários altista, base e baixista." },
  { nome: "Motley Fool / Zacks", oQueFaz: "Publicam retorno médio de todas as recomendações e rank por revisão de lucros. Auditorias independentes apontam ~66% de acerto.", licao: "Taxa de acerto alta não é expectância: um estudo de delta 16 perde raro, mas perde grande." },
  { nome: "Casas brasileiras (XP, BTG, Suno, Empiricus)", oQueFaz: "Carteiras por tema e horizonte (semanal, mensal, dividendos, small caps) com preço-teto e rentabilidade simulada vs Ibovespa.", licao: "Organizar por horizonte. Mas no Brasil, recomendação exige analista CNPI (Res. CVM 20): por isso esta página é estudo, não recomendação." },
];

export const EVIDENCIAS = [
  { titulo: "Índice Cboe PUT (venda sistemática de puts no S&P 500)", texto: "De 1986 a 2023, 9,4% ao ano contra 9,9% do S&P 500, com desvio-padrão de 10% contra 15% e queda máxima de 33% contra 51%. A vantagem da venda de prêmio é reduzir volatilidade, não multiplicar retorno." },
  { titulo: "Prêmio de risco de volatilidade", texto: "Estudos acadêmicos (Israelov e Nielsen, 2014) mostram que a parcela vendida em volatilidade de uma covered call tem Sharpe próximo de 1, mas responde por menos de 10% do risco. Só faz sentido vender opção quando a IV supera a volatilidade realizada esperada." },
  { titulo: "Estudos da tastylive", texto: "Em SPY, estruturas de 45 dias e delta 16 tiveram cerca de 77% de acerto contra 68% teórico. Gerenciar a 50% do lucro melhorou o P&L mediano; gerenciar perdedores piorou o resultado. São estudos internos, sem custos e sem auditoria externa." },
  { titulo: "Seguidores de tendência", texto: "O índice SG Trend rendeu cerca de 5% ao ano desde 2000 com correlação negativa com ações e anos positivos em 2000-02, 2008, 2020 e 2022. Um século de dados (Hurst, Ooi e Pedersen) mostra retorno positivo em todas as décadas." },
  { titulo: "O que o investidor pessoa física replica", texto: "Regras mecânicas de DTE, delta e saída em ETFs líquidos; momentum de 3 a 12 meses com rebalanceamento mensal. O que não replica: alavancagem institucional, execução intradiária e custos de fundo." },
  { titulo: "Ressalvas obrigatórias", texto: "Os parâmetros 45/16/21/50 foram escolhidos depois de olhar os dados (risco de sobreajuste). Índices Cboe não descontam custos. Todo resultado desta página é hipotético, sem comissão nem imposto." },
];

export const BRASIL_INTRO =
  "ADRs e ETFs brasileiros negociados nos EUA permitem estudar o Brasil com opções líquidas em dólar. O agente compara o preço do ADR com a ação na B3 convertida pelo câmbio: desconto ou prêmio acima de 1,5% entra na triagem como tema de valor relativo. EWZ tem uma das cadeias de opções mais líquidas entre ETFs de país; Petrobras, Vale, Itaú, Bradesco, Nubank e Mercado Livre têm spreads aceitáveis; os demais passam pelo filtro de liquidez da tastytrade.";
