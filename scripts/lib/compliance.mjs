// Regras de compliance compartilhadas (Res. CVM 178/23 — assessor; Res. CVM 20 — analista).
// Qualquer texto gerado por IA passa por aqui antes de ser publicado.
import { stripHtml } from "./util.mjs";

export const AVISO_LEGAL =
  "Rainiere Rocha é assessor de investimentos vinculado à Invest Smart Assessor de Investimento Ltda., inscrita sob o CNPJ nº 19.438.577/0001-08, empresa de Assessoria de Investimento devidamente registrada na Comissão de Valores Mobiliários na forma da Resolução CVM 178/23, que mantém contrato de distribuição de produtos financeiros com a XP Investimentos Corretora de Câmbio, Títulos e Valores Mobiliários S.A. (\"XP\") e pode, por conta e ordem dos seus clientes, operar no mercado de capitais segundo a legislação vigente. Na forma da legislação da CVM, o Assessor de Investimento não pode administrar ou gerir o patrimônio de investidores. O Diário Saga é um informativo de caráter meramente educacional e informativo, elaborado com apoio de inteligência artificial a partir de dados públicos (Banco Central do Brasil, B3 e agências de notícias); não constitui e não deve ser interpretado como oferta, solicitação de compra ou venda ou recomendação de qualquer ativo financeiro, nem como relatório de análise (Resolução CVM 20) ou consultoria de valores mobiliários. O investimento em ações é um investimento de risco e rentabilidade passada não é garantia de rentabilidade futura. Na realização de operações com derivativos existe a possibilidade de perdas superiores aos valores investidos, podendo resultar em significativas perdas patrimoniais. Antes de investir, verifique a adequação dos produtos ao seu perfil de investidor. Para informações e dúvidas sobre produtos, contate seu assessor de investimentos. Para reclamações, contate a Ouvidoria da XP pelo telefone 0800 722 3730.";

export const AVISO_TRADING =
  "Os Destaques de Trading Sagafin são estudos de caráter exclusivamente educacional, elaborados com apoio de inteligência artificial a partir de dados de mercado obtidos via tastytrade e fontes públicas. Não constituem recomendação de investimento, relatório de análise (Resolução CVM 20) nem consultoria de valores mobiliários; nenhuma estrutura aqui descrita deve ser executada sem avaliação própria. Resultados exibidos são hipotéticos, calculados sobre preços de referência do momento da publicação, sem custos, comissões ou impostos, e não representam operações reais. Operações com opções e ativos alavancados podem gerar perdas superiores ao capital investido. " +
  AVISO_LEGAL;

// Expressões vedadas para qualquer texto publicado (Diário e Trading).
export const PROIBIDAS =
  /\b(compre|venda agora|recomendo comprar|recomendamos comprar|recomendo vender|recomendamos vender|preço-alvo|preço alvo|alvo de preço|garantido|rentabilidade garantida|lucro certo|lucro garantido|entre agora|monte hoje|monte agora|oportunidade imperdível|imperdível|não perca|hora de comprar|hora de vender|compra forte|venda forte|strong buy|strong sell)\b/i;

// Imperativos de execução vedados nos estudos de trading (além da lista acima).
export const PROIBIDAS_TRADING =
  /\b(compre|venda|vendam|comprem|execute|executem|abra a posição|abram a posição|monte a operação|montem a operação|faça a operação|faz a operação|opere|operem|entre na operação|entrem na operação|aposte|apostem)\b/i;

/** Devolve a expressão proibida encontrada (ou null). Aceita HTML ou texto. */
export function checarCompliance(texto, { trading = false } = {}) {
  const limpo = stripHtml(texto);
  const m = limpo.match(PROIBIDAS);
  if (m) return m[0];
  if (trading) {
    const t = limpo.match(PROIBIDAS_TRADING);
    if (t) return t[0];
  }
  return null;
}

/** Tags HTML permitidas em conteúdo gerado. */
export const TAGS_OK = /^<\/?(h2|h3|p|ul|ol|li|strong|em|br)\b[^>]*>$/i;

export function tagsEstranhas(html) {
  return [...new Set((String(html).match(/<[^>]+>/g) || []).filter((t) => !TAGS_OK.test(t)))];
}
