// Conteúdo estático do Manual do iniciante: como investir em dólar nos EUA pela tastytrade.
// Mesmo padrão de trading-metodologia.ts: só texto, sem lógica. Dados ao vivo vêm da RPC trading_contexto.
import { IOF_REMESSA_TXT, ISENCAO_GANHO_CAPITAL_TXT, TASTY_REFERRAL_BONUS_TXT } from "./tastytrade-referral";

export interface CapituloManual {
  id: string;
  titulo: string;
  resumo: string;
  paragrafos: string[];
  passos?: string[];
  avisos?: string[];
  links?: { rotulo: string; url: string }[];
}

export const MANUAL_TITULO = "Manual do iniciante: como investir em dólar nos EUA pela tastytrade";

export const MANUAL_CAPITULOS: CapituloManual[] = [
  {
    id: "por-que",
    titulo: "1. Por que investir em dólar e o que é a tastytrade",
    resumo: "Diversificar moeda, acessar o maior mercado do mundo e usar uma corretora feita para opções.",
    paragrafos: [
      "Investir em dólar não é apostar contra o real. É ter parte do patrimônio em uma moeda forte, nos mercados mais líquidos do mundo, com acesso a empresas e ETFs que não existem na B3. Para quem tem despesas futuras em dólar (viagem, estudo, compras) ou quer reduzir o risco Brasil, é uma proteção natural.",
      "A tastytrade é uma corretora dos Estados Unidos, registrada na FINRA e com proteção SIPC, conhecida por ter nascido de traders de opções. A plataforma mostra, de graça, métricas que outras corretoras escondem: IV rank, probabilidade de lucro, nota de liquidez. É a mesma fonte de dados que o agente da Sagafin lê quatro vezes por dia.",
      "Ela aceita clientes residentes no Brasil, opera em dólar, não cobra custódia nem taxa de inatividade e cobra comissão apenas em opções (com teto por perna). Ações e ETFs são negociados sem comissão. Não há conta em real: você envia dólares para lá.",
    ],
    avisos: ["Este manual é educacional. Não é recomendação de investimento nem de corretora. A escolha da plataforma e dos ativos é sua."],
  },
  {
    id: "elegibilidade",
    titulo: "2. Quem pode abrir conta e o que precisa ter em mãos",
    resumo: "Residentes no Brasil são aceitos. Separe documento com foto, comprovante de endereço e CPF.",
    paragrafos: [
      "A tastytrade mantém uma lista oficial de países atendidos, e o Brasil está nela. Mesmo assim, a corretora pode mudar a lista a qualquer momento: confira o link oficial antes de começar.",
      "Você precisa ser maior de 18 anos, ter um documento de identidade com foto (passaporte é o mais aceito; RG ou CNH podem ser pedidos como complemento), um comprovante de endereço recente (conta de luz, água, extrato bancário) e o CPF, que funciona como número de identificação fiscal no formulário W-8BEN.",
      "O cadastro é todo em inglês. Tenha um e-mail que você acessa com frequência e um número de celular para a verificação em duas etapas.",
    ],
    links: [{ rotulo: "Países atendidos (tastytrade)", url: "https://tastyworks.freshdesk.com/support/solutions/43000224158" }],
    avisos: ["Confirme a elegibilidade diretamente na corretora. Regras de cadastro mudam sem aviso."],
  },
  {
    id: "abertura",
    titulo: "3. Abrindo a conta passo a passo",
    resumo: "Cadastro online em 15 a 30 minutos, com o W-8BEN preenchido dentro do próprio formulário.",
    paragrafos: [
      "O processo é feito pelo site, sem papel. Com os documentos em mãos, leva de 15 a 30 minutos. A aprovação costuma sair em um a três dias úteis.",
      "Use o link de indicação da Sagafin para abrir a conta. " + TASTY_REFERRAL_BONUS_TXT,
    ],
    passos: [
      "Acesse o link de indicação e clique em Open an Account.",
      "Escolha Individual (conta pessoa física). Entre Margin e Cash, iniciantes devem escolher Cash: sem alavancagem e sem risco de chamada de margem.",
      "Preencha dados pessoais, endereço no Brasil, profissão e origem dos recursos. Use o CPF como Foreign Tax ID.",
      "Na etapa de perfil, responda com honestidade sobre experiência e objetivos. Isso define o nível de opções liberado (Level 1 cobre covered call e cash-secured put, o suficiente para começar).",
      "Preencha o formulário W-8BEN dentro do cadastro. Ele declara que você não é residente fiscal dos EUA e garante a retenção correta de imposto sobre dividendos. Sem ele, a conta não é aprovada.",
      "Envie as fotos dos documentos e aguarde o e-mail de aprovação.",
    ],
    links: [{ rotulo: "W-8BEN: como a tastytrade coleta (suporte oficial)", url: "https://tastyworks.freshdesk.com/support/solutions/articles/43000472765" }],
  },
  {
    id: "remessa",
    titulo: "4. Enviando dinheiro: câmbio, IOF e prazos",
    resumo: "Transferência internacional em dólar, 3 a 5 dias úteis, com IOF e spread de câmbio.",
    paragrafos: [
      "A conta aprovada começa vazia. Para financiá-la, você converte reais em dólares e envia por transferência internacional (wire) para a conta da tastytrade, identificando o seu número de conta no campo de referência.",
      "Os caminhos mais usados por brasileiros: uma plataforma de câmbio online (Remessa Online, Wise, Nomad e similares) ou o internet banking do seu banco. Compare o custo total: spread sobre o dólar comercial, tarifa fixa da remessa e IOF.",
      IOF_REMESSA_TXT,
      "A tastytrade não aceita depósito de terceiros: o remetente precisa ser você, com o mesmo nome do cadastro. Prazo típico de três a cinco dias úteis para o valor aparecer disponível.",
    ],
    links: [{ rotulo: "Depósitos internacionais na tastytrade (suporte oficial)", url: "https://tastyworks.freshdesk.com/support/solutions/articles/43000475189" }],
    avisos: ["Comece com um valor que você aceita ver oscilar. Não envie dinheiro de emergência."],
  },
  {
    id: "plataforma",
    titulo: "5. Conhecendo a plataforma",
    resumo: "Desktop, web e aplicativo. Ordem limitada sempre. Pregão das 11h30 às 18h de Brasília.",
    paragrafos: [
      "A tastytrade tem três versões: programa para computador (a mais completa), versão web e aplicativo de celular. Para iniciantes, a web resolve. Tudo em inglês.",
      "Os três tipos de ordem que importam: Limit (você fixa o preço máximo de compra ou mínimo de venda), Market (executa ao preço que estiver, evite) e Stop (dispara uma ordem quando o preço cruza um nível). Regra de ouro: iniciante só usa ordem limitada.",
      "Buying Power é o quanto você pode comprar agora. Em conta Cash, é o saldo em dólar já liquidado. Net Liq é o valor total da conta marcado a mercado.",
      "O pregão americano vai das 9h30 às 16h de Nova York. No horário de Brasília isso costuma ser 11h30 às 18h, mas muda com o horário de verão dos EUA. A plataforma mostra o relógio de mercado.",
    ],
  },
  {
    id: "primeiros-ativos",
    titulo: "6. O que comprar primeiro",
    resumo: "ETFs amplos antes de ações. Brasil em dólar via ADRs e EWZ.",
    paragrafos: [
      "A primeira compra de quase todo iniciante deveria ser um ETF amplo: SPY ou VOO (S&P 500, as 500 maiores empresas dos EUA), QQQ (Nasdaq 100, tecnologia) ou VT (mundo inteiro). Um ETF compra centenas de empresas de uma vez, com taxa anual abaixo de 0,1%.",
      "Ações individuais vêm depois, quando você já entende como a conta funciona. Na tastytrade a unidade mínima é uma ação inteira. Para opções, a unidade é o contrato, que representa 100 ações.",
      "Brasil em dólar: as grandes empresas brasileiras têm ADRs negociados em Nova York (PBR para Petrobras, VALE, ITUB, BBD, NU, MELI) e o EWZ é o ETF que replica o índice MSCI Brazil. Esses ativos têm cadeias de opções líquidas, o que permite estudar o Brasil com as mesmas ferramentas do mercado americano. A tabela ao vivo no fim deste manual mostra como eles estão hoje.",
    ],
  },
  {
    id: "opcoes",
    titulo: "7. Opções para iniciantes: as regras que o agente usa",
    resumo: "Covered call e cash-secured put. Delta 16 a 25, IV rank acima de 30, 45 dias, sair a 50%.",
    paragrafos: [
      "Opções são contratos que dão o direito (call) de comprar ou (put) de vender um ativo a um preço fixo (strike) até uma data. Quem compra paga um prêmio; quem vende recebe o prêmio e assume a obrigação.",
      "As duas estruturas mais seguras para começar: covered call (você tem 100 ações e vende uma call acima do preço, recebendo prêmio e aceitando vender se subir) e cash-secured put (você tem o dinheiro para comprar 100 ações e vende uma put abaixo do preço, recebendo prêmio e aceitando comprar se cair). Nas duas, a perda máxima é a mesma de ter a ação, menos o prêmio recebido.",
      "As regras mecânicas que o agente da Sagafin copia das referências de mercado (tastylive e estudos acadêmicos) valem para quem quer operar por conta própria:",
    ],
    passos: [
      "Vencimento de 28 a 60 dias (alvo 45): o tempo trabalha a favor de quem vende sem o risco da última semana.",
      "Strike no delta 16 a 25: probabilidade teórica de 65% a 80% de a opção vencer sem valor.",
      "IV rank acima de 30: só vender prêmio quando a volatilidade implícita está alta para o padrão do ativo.",
      "Liquidez de 3 ou 4 estrelas na tastytrade: sem isso, o spread come o lucro.",
      "Sair ao capturar 50% do prêmio ou a 21 dias do vencimento, o que vier primeiro.",
      "Evitar vencimentos que cruzam data de balanço da empresa.",
    ],
    avisos: ["Vender opções descobertas (sem as ações ou sem o caixa) pode gerar perdas maiores que o capital investido. Não é para iniciantes."],
  },
  {
    id: "risco",
    titulo: "8. Gestão de risco",
    resumo: "Tamanho de posição pequeno, sem alavancagem, diário de operações.",
    paragrafos: [
      "A regra mais importante de todas: nenhuma posição deve ser grande o bastante para tirar você do jogo. Comece com 1% a 2% da conta por operação de opções e no máximo 5% a 10% por ação individual.",
      "Conta Cash e Level 1 de opções são travas naturais: a plataforma não deixa você se alavancar. Mantenha assim por pelo menos seis meses.",
      "Registre cada operação: data, ativo, estrutura, motivo de entrada, resultado e o que aprendeu. Em três meses esse diário vale mais que qualquer curso.",
      "Resultados hipotéticos, inclusive os desta página, não descontam comissões, spread, câmbio nem imposto. O resultado real é sempre menor.",
    ],
  },
  {
    id: "impostos",
    titulo: "9. Impostos no Brasil e nos EUA",
    resumo: "Ganho de capital com DARF código 8523, dividendos com 30% retidos nos EUA, bens no exterior na DIRPF.",
    paragrafos: [
      "Ganho de capital: quando você vende um ativo no exterior com lucro, paga imposto no Brasil via DARF (código de receita 8523) até o último dia útil do mês seguinte à venda. A alíquota começa em 15%. " + ISENCAO_GANHO_CAPITAL_TXT,
      "Dividendos de empresas americanas: os EUA retêm 30% na fonte para residentes no Brasil. No Brasil, o valor entra como rendimento tributável, e o imposto pago lá pode ser compensado conforme a regra vigente. Todo ano a corretora emite o Form 1042-S com o resumo das retenções.",
      "Declaração anual: os ativos no exterior entram na ficha de Bens e Direitos da DIRPF, pelo custo em reais na data de cada compra. Desde 2024 a Lei 14.754 mudou a tributação de aplicações no exterior (apuração anual, compensação de perdas); peça a um contador para revisar a sua situação.",
      "Prêmio recebido em opções vendidas e lucro em opções seguem a mesma lógica de ganho de capital no exterior.",
    ],
    links: [{ rotulo: "Form 1042-S na tastytrade (suporte oficial)", url: "https://tastyworks.freshdesk.com/support/solutions/articles/43000468113" }],
    avisos: ["Este capítulo é um mapa, não aconselhamento tributário. A legislação muda com frequência. Consulte um contador."],
  },
  {
    id: "glossario",
    titulo: "10. Glossário",
    resumo: "Os termos que aparecem na plataforma e nos estudos da Sagafin.",
    paragrafos: [],
    passos: [
      "ADR: recibo negociado nos EUA que representa ações de uma empresa estrangeira (PBR é a Petrobras em Nova York).",
      "Buying Power: quanto você pode comprar agora com o saldo disponível.",
      "Call e Put: opção de compra e opção de venda.",
      "Delta: sensibilidade do preço da opção ao preço do ativo. Também aproxima a probabilidade de a opção vencer dentro do dinheiro (delta 16 = cerca de 16%).",
      "DTE (days to expiration): dias até o vencimento.",
      "ETF: fundo negociado em bolsa que replica um índice ou cesta.",
      "IV rank: onde a volatilidade implícita de hoje está em relação ao último ano (0 = mínima, 100 = máxima).",
      "IVx: volatilidade implícita esperada para o próximo ano, em percentual.",
      "POP (probability of profit): probabilidade teórica de a operação terminar com lucro.",
      "Prêmio: o preço da opção. Quem vende recebe, quem compra paga.",
      "Strike: preço de exercício da opção.",
      "W-8BEN: formulário do fisco americano que declara que você não é residente fiscal dos EUA.",
    ],
  },
];

export const MANUAL_PROXIMO_PASSO = {
  titulo: "11. Próximo passo: operar com acompanhamento",
  texto:
    "Abrir a conta é a parte fácil. O difícil é montar uma carteira em dólar que converse com a sua carteira no Brasil, com o seu prazo e com o seu imposto. É nisso que a assessoria ajuda: Rainiere Rocha é assessor de investimentos registrado na CVM (InvestSmart/XP) e atende por WhatsApp, sem custo para a primeira conversa.",
};
