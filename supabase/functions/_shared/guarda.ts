// ─────────────────────────────────────────────────────────────────────────────
// Guarda-corpo do RAY: funções PURAS (sem rede, sem banco, sem imports).
//
// Implementa em código as regras de ray-conhecimento/99-guarda-corpo.md:
//   (a) preFiltro  - antes do modelo: pedido de recomendação pessoal, de análise
//                    de carteira ou de percentual de alocação vira encaminhamento
//                    ao Rainiere, sem gastar uma chamada ao modelo.
//   (b) posFiltro  - depois do modelo: bloqueia "golpe/fraude", "compre/venda
//                    agora", promessa de retorno e ticker recomendado; acrescenta
//                    o aviso curto quando o assunto é produto/rentabilidade/imposto.
//   (c) detectaOptOut / detectaOptIn / pedeHumano - comandos do WhatsApp.
// Roda no Deno das edge functions e no Vitest.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Textos fixos ─────────────────────────────────────────────────────────────

export const IDENTIDADE_RAY =
  "Olá! Eu sou o RAY, assistente de inteligência artificial da Saga Financeira. " +
  "Posso explicar conceitos e produtos de investimento, resumir o mercado, aplicar um questionário educativo de perfil " +
  "e agendar uma reunião gratuita com Rainiere Rocha, assessor de investimentos vinculado à XP. " +
  "Não faço recomendações de investimento. Como o que explico é educativo, confira sempre nas fontes oficiais.";

export const DISCLAIMER_CURTO =
  "Conteúdo educativo, não é recomendação de investimento. Rentabilidade passada não garante resultados futuros, " +
  "e investir envolve riscos, inclusive de perda do capital.";

export const DISCLAIMER_COMPLETO =
  "Conteúdo educativo e informativo. Não constitui recomendação, oferta ou análise de investimento, nem promessa de rentabilidade. " +
  "Rentabilidade passada não garante resultados futuros. Investimentos envolvem riscos, inclusive a perda do capital investido. " +
  "A análise de adequação do seu perfil (suitability) é feita pela XP. Rainiere Rocha é assessor de investimentos vinculado à XP. " +
  "Regras tributárias e regulatórias mudam: confira a regra vigente nas fontes oficiais.";

export const MSG_ENCAMINHAR_RAINIERE =
  "Essa é uma conversa que depende da sua situação, e eu só consigo explicar conceitos. " +
  "Quem pode ajudar com o seu caso é o Rainiere Rocha, assessor de investimentos vinculado à XP. " +
  "A reunião de apresentação é gratuita. Quer que eu agende?";

export const MSG_DEVO_COMPRAR =
  "Não posso dizer se você deve comprar, vender ou manter um investimento específico, porque isso depende dos seus objetivos, " +
  "prazo, situação financeira e perfil, e eu só explico conceitos. O que posso fazer é mostrar como o produto funciona, " +
  "quais são os riscos, os custos e a tributação, e quais perguntas vale fazer antes de decidir. " +
  "Para uma conversa sobre o seu caso, o Rainiere Rocha, assessor vinculado à XP, atende em reunião gratuita. " +
  "Quer começar pelo funcionamento do produto?";

export const MSG_FALLBACK_BLOQUEIO =
  "Prefiro não responder desse jeito, porque isso passaria de uma explicação educativa. " +
  "Posso explicar como o assunto funciona, os riscos e como conferir as informações nas fontes oficiais, " +
  "ou agendar uma conversa gratuita com o Rainiere Rocha, assessor vinculado à XP. O que prefere?";

export const MSG_OPT_OUT =
  "Pronto, você não vai mais receber mensagens da Saga Financeira por aqui. Se mudar de ideia, é só chamar. Obrigado pela atenção!";

export const MSG_OPT_IN =
  "Obrigado! Está confirmado: você vai receber o Diário Saga e avisos da Saga Financeira. " +
  "Para parar de receber, é só responder PARAR a qualquer momento.";

export const MSG_HUMANO =
  "Claro! Já avisei o Rainiere Rocha, que vai falar com você assim que possível. Se preferir, posso sugerir horários para uma reunião.";

// ─── Normalização ─────────────────────────────────────────────────────────────

/** Minúsculas, sem acentos, espaços simples. */
export function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto curto de comando: sem pontuação nem emojis. */
function comando(texto: unknown): string {
  return normalizar(texto).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

const TICKER = /\b[A-Za-z]{4}\d{1,2}\b/;
const TICKER_MAIUSC = /\b[A-Z]{4}\d{1,2}\b/;

// ─── (a) preFiltro ────────────────────────────────────────────────────────────

export type CategoriaPre = "recomendacao" | "ativo" | "carteira" | "alocacao";

export interface DecisaoPre {
  redirecionar: boolean;
  categoria?: CategoriaPre;
  /** Texto pronto para o cliente quando redirecionar = true. */
  resposta?: string;
}

const VERBO_DECISAO =
  "(comprar|compro|compra|vender|vendo|vende|manter|mantenho|investir|aplicar|aplico|colocar|coloco|botar|apostar|entrar|resgatar|trocar)";

const REGRAS_PRE_BRUTAS: { categoria: CategoriaPre; re: RegExp }[] = [
  // "devo comprar", "posso colocar", "vale a pena comprar/investir", "é bom comprar"
  {
    categoria: "recomendacao",
    re: new RegExp(
      `\\b(devo|deveria|posso|poderia|da pra|vale a pena|valeria a pena|compensa|e bom|e uma boa|e hora de|hora de)\\b.{0,25}\\b${VERBO_DECISAO}\\b`,
    ),
  },
  { categoria: "recomendacao", re: /\bvale a pena\b.{0,40}\b(comprar|investir|ter|entrar)\b/ },
  {
    categoria: "recomendacao",
    re: /\b(recomend\w*|indic\w*|sugir\w*|sugest\w*)\b.{0,30}\b(investimento|acao|acoes|fii|fiis|fundo|fundos|cdb|lci|lca|tesouro|papel|cripto|bitcoin|aplicacao|corretora)\b/,
  },
  { categoria: "recomendacao", re: /\bo que (voce )?(recomenda|indica|sugere)\b/ },
  { categoria: "recomendacao", re: /\bonde (devo|posso|eu devo|invisto|aplico|coloco)\b.{0,30}(invest|aplic|colocar|dinheiro)/ },
  {
    categoria: "recomendacao",
    re: /\bqual (a )?(melhor )?(acao|acoes|fii|fiis|fundo|fundos|cdb|lci|lca|investimento|papel|cripto|criptomoeda|bitcoin|corretora)\b.{0,40}\b(comprar|compro|investir|invisto|recomend\w*|indic\w*|escolher|vale|entrar|aplicar)\b/,
  },
  { categoria: "recomendacao", re: /\bqual (a )?(melhor )?(acao|acoes|fii|fiis|fundo|cdb|investimento|papel)\b/ },
  { categoria: "recomendacao", re: /\bmelhor (acao|fii|fundo|cdb|investimento|papel) (para|pra|do|de)\b/ },
  // percentuais de alocação
  { categoria: "alocacao", re: /\b\d{1,3}\s*(%|por ?cento)\s*(do meu|da minha|em|de|na|no|para|pra)\b/ },
  {
    categoria: "alocacao",
    re: /\bquanto (do meu|da minha|de|devo|posso|eu devo|eu posso)\b.{0,30}\b(colocar|alocar|investir|aplicar|deixar|ter|botar)\b/,
  },
  {
    categoria: "alocacao",
    re: /\b(alocar|alocacao|distribuir|dividir)\b.{0,30}\b(patrimonio|dinheiro|carteira|grana|investimentos)\b/,
  },
  { categoria: "alocacao", re: /\bmonte? (uma |minha |a )?carteira\b/ },
  // carteira individual
  { categoria: "carteira", re: /\bminha carteira\b/ },
  {
    categoria: "carteira",
    re: /\b(minha|minhas|meus|meu)\s+(posicao|posicoes|portfolio|investimentos|aplicacoes|fundos|acoes|fiis)\b.{0,60}\b(esta|estao|certo|errado|bom|boa|ruim|bem|mal|diversificad\w*|concentrad\w*|adequad\w*)\b/,
  },
  {
    categoria: "carteira",
    re: /\b(analis\w*|avali\w*|revis\w*|olh\w*|confer\w*|opin\w*)\b.{0,25}\b(minha|meus|meu|minhas)\s+(posicao|portfolio|investimentos|aplicacoes)\b/,
  },
  { categoria: "carteira", re: /\bo que (voce )?(acha|acham)\b.{0,30}\b(meus|minha|meu)\b/ },
];

// Alocação e carteira têm prioridade sobre a recomendação genérica ("posso colocar 50% em FII" é alocação).
const PRIORIDADE: Record<CategoriaPre, number> = { ativo: 0, alocacao: 1, carteira: 2, recomendacao: 3 };
const REGRAS_PRE = [...REGRAS_PRE_BRUTAS].sort((a, b) => PRIORIDADE[a.categoria] - PRIORIDADE[b.categoria]);

/** Compra/venda de ticker: "compro PETR4?", "vendo VALE3 agora?", "HGLG11 é boa?" */
function pedidoSobreTicker(original: string, norm: string): boolean {
  if (!TICKER.test(original)) return false;
  return /\b(compr\w*|vend\w*|mant\w*|entr\w*|aplic\w*|invist\w*|invest\w*|vale a pena|e bom|e boa|compensa|devo|posso|recomend\w*|indic\w*|subir|cair|sobe|cai|vai valorizar|preco alvo|alvo)\b/
    .test(norm);
}

export function preFiltro(texto: string): DecisaoPre {
  const original = String(texto ?? "");
  const norm = normalizar(original);
  if (!norm) return { redirecionar: false };

  if (pedidoSobreTicker(original, norm)) {
    return { redirecionar: true, categoria: "ativo", resposta: MSG_DEVO_COMPRAR + "\n\n" + DISCLAIMER_CURTO };
  }
  for (const r of REGRAS_PRE) {
    if (r.re.test(norm)) {
      const base = r.categoria === "recomendacao" ? MSG_DEVO_COMPRAR : MSG_ENCAMINHAR_RAINIERE;
      return { redirecionar: true, categoria: r.categoria, resposta: base + "\n\n" + DISCLAIMER_CURTO };
    }
  }
  return { redirecionar: false };
}

/** A pessoa pede para falar com um humano? */
export function pedeHumano(texto: string): boolean {
  const n = normalizar(texto);
  if (!n) return false;
  return /\b(falar|conversar|chamar|passar|atendimento|atendente)\b.{0,25}\b(humano|pessoa|atendente|rainiere|assessor|alguem de verdade|gente de verdade|consultor)\b/.test(n) ||
    /\b(quero|preciso|prefiro)\b.{0,15}\b(um )?(humano|atendente|pessoa de verdade)\b/.test(n) ||
    /\bfalar com (o )?(rainiere|assessor)\b/.test(n) ||
    /^(humano|atendente)\W*$/.test(n);
}

// ─── (b) posFiltro ────────────────────────────────────────────────────────────

export interface DecisaoPos {
  /** Texto final a enviar (original, com aviso, ou o fallback de bloqueio). */
  texto: string;
  bloqueado: boolean;
  motivos: string[];
  avisoAnexado: boolean;
}

const NEGACAO = /\b(nao|nunca|jamais|nenhum\w*|nem|sem)\b/;

/** Há negação até 40 caracteres antes da ocorrência? */
function negado(norm: string, indice: number): boolean {
  return NEGACAO.test(norm.slice(Math.max(0, indice - 40), indice));
}

function acha(norm: string, re: RegExp, aceitarNegado = false): boolean {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(norm))) {
    if (aceitarNegado || !negado(norm, m.index)) return true;
    if (m[0].length === 0) g.lastIndex++;
  }
  return false;
}

const RE_PALAVRAS_PROIBIDAS = /\b(golp\w*|fraud\w*)\b/;
const RE_ORDEM =
  /\b(compre|comprem|venda agora|venda ja|venda tudo|vender agora|vender ja|mantenha (a |sua |seu |essa |esse )?(posicao|acoes|acao|fii|fiis|fundo|carteira|investimento))\b/;
const RE_GARANTIA =
  /(retorno garantido|rentabilidade garantida|lucro garantido|ganho garantido|ganhos garantidos|retorno certo|rendimento garantido|garanto\b.{0,30}\b(ganh|lucr|rend|retorno)|garantia de (lucro|retorno|ganho)|certeza de (lucro|retorno|ganho)|\bsem risco\b|\brisco zero\b|\bzero risco\b|100% seguro|vai (com certeza )?(render|valorizar|subir|dobrar)|com certeza (vai )?(render|valorizar|subir|ganhar|lucrar))/;
const RE_RECOMENDACAO_TICKER =
  /\b(recomend\w*|indic\w*|sugir\w*|sugiro|aposte|apostar|invista em|compre|boa compra|boa opcao|melhor opcao|vale a pena comprar|oportunidade de compra|entre em|escolha)\b/;

/** Há ticker em letras maiúsculas na mesma frase de uma expressão de recomendação? */
function recomendaTicker(resposta: string): boolean {
  const frases = resposta.split(/(?<=[.!?\n])\s+/);
  for (const f of frases) {
    if (!TICKER_MAIUSC.test(f)) continue;
    if (acha(normalizar(f), RE_RECOMENDACAO_TICKER)) return true;
  }
  return false;
}

const RE_ASSUNTO_COM_AVISO =
  /\b(cdb|lci|lca|tesouro|selic|cdi|ipca|fii|fiis|fundo|fundos|acao|acoes|etf|etfs|bdr|bdrs|debenture\w*|cri|cra|coe|previdencia|pgbl|vgbl|rentabilidade|rendimento\w*|retorno|juros|imposto\w*|ir|tributa\w*|come cotas|dividend\w*|inflacao|cambio|dolar|bolsa|ibovespa|mercado|cenario|investiment\w*|renda fixa|renda variavel|fgc|carteira|risco\w*)\b/;

export function posFiltro(resposta: string, opcoes: { forcarAviso?: boolean } = {}): DecisaoPos {
  const original = String(resposta ?? "").trim();
  const norm = normalizar(original);
  const motivos: string[] = [];

  if (!original) {
    return { texto: MSG_FALLBACK_BLOQUEIO, bloqueado: true, motivos: ["resposta_vazia"], avisoAnexado: false };
  }
  if (acha(norm, RE_PALAVRAS_PROIBIDAS, true)) motivos.push("palavra_proibida");
  if (acha(norm, RE_ORDEM)) motivos.push("ordem_compra_venda");
  if (acha(norm, RE_GARANTIA)) motivos.push("promessa_retorno");
  if (recomendaTicker(original)) motivos.push("ticker_recomendado");

  if (motivos.length) {
    return { texto: MSG_FALLBACK_BLOQUEIO + "\n\n" + DISCLAIMER_CURTO, bloqueado: true, motivos, avisoAnexado: true };
  }

  const jaTem = /conteudo educativo/.test(norm);
  if (!jaTem && (opcoes.forcarAviso || acha(norm, RE_ASSUNTO_COM_AVISO, true))) {
    return { texto: `${original}\n\n${DISCLAIMER_CURTO}`, bloqueado: false, motivos, avisoAnexado: true };
  }
  return { texto: original, bloqueado: false, motivos, avisoAnexado: false };
}

// ─── (c) opt-out / opt-in ─────────────────────────────────────────────────────

const OPT_OUT = new Set([
  "parar", "pare", "sair", "cancelar", "cancela", "stop", "descadastrar", "descadastra", "remover", "remova",
  "nao quero", "nao quero mais", "nao quero receber", "nao quero mais receber", "nao quero mais mensagens",
  "parar de receber", "parar mensagens", "parar de enviar", "sair da lista", "cancelar inscricao",
  "cancelar assinatura", "nao desejo receber", "nao quero receber mensagens",
]);

/** PARAR, SAIR, CANCELAR, NÃO QUERO... só vale como mensagem inteira (evita "quero sair da renda fixa"). */
export function detectaOptOut(texto: string): boolean {
  const c = comando(texto);
  if (!c) return false;
  if (OPT_OUT.has(c)) return true;
  return /^(por favor |pode |favor )?(parar|sair|cancelar|descadastrar)( por favor| obrigado| obrigada)?$/.test(c);
}

const OPT_IN = new Set([
  "sim", "sim quero", "quero", "aceito", "pode enviar", "pode mandar", "pode sim", "sim pode", "sim por favor",
]);

/** SIM como mensagem inteira. O webhook só trata como opt-in se o cliente ainda não deu opt-in. */
export function detectaOptIn(texto: string): boolean {
  const c = comando(texto);
  return c.length > 0 && OPT_IN.has(c);
}
