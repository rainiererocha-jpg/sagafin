// Peças puras do ray-agent (sem rede): roteamento de persona, marcadores de agendamento
// e formatação do contexto de mercado. Roda no Deno e no Vitest.
import { normalizar } from "./guarda.ts";

export type PersonaId = "educador" | "perfil" | "mercado" | "agenda" | "prospect";

const RE_AGENDA =
  /\b(agendar|agenda|agendamento|reuniao|marcar|marcacao|horario|horarios|disponibilidade|encontro|videochamada|conversar com o rainiere|falar com o rainiere)\b/;
const RE_PERFIL = /\b(perfil|questionario|conservador|moderado|arrojado|suitability|tolerancia a risco)\b/;
const RE_MERCADO =
  /\b(mercado|cotacao|cotacoes|dolar|selic hoje|ibovespa|bolsa hoje|diario|resumo do dia|cenario|como esta a bolsa|como ta a bolsa|hoje)\b/;

/** Roteamento simples por palavra-chave. Padrão: educador (prospect para quem ainda não é cliente e abre a conversa). */
export function escolherPersona(
  texto: string,
  opcoes: { ehCliente?: boolean; personaAnterior?: string | null; primeiraDoEpisodio?: boolean } = {},
): PersonaId {
  const n = normalizar(texto);
  if (RE_AGENDA.test(n)) return "agenda";
  if (RE_PERFIL.test(n)) return "perfil";
  if (RE_MERCADO.test(n)) return "mercado";
  // Resposta curta ("terça", "de manhã", "sim") continua o fluxo de agenda/perfil em andamento.
  const curta = n.split(" ").filter(Boolean).length <= 4;
  if (curta && (opcoes.personaAnterior === "agenda" || opcoes.personaAnterior === "perfil")) {
    return opcoes.personaAnterior;
  }
  if (!opcoes.ehCliente && (opcoes.primeiraDoEpisodio || opcoes.personaAnterior === "prospect")) return "prospect";
  return "educador";
}

export interface MarcadorAgenda {
  tipo: "listar" | "criar";
  inicio?: string;
  nome?: string;
}

const RE_MARCADOR = /\[\[AGENDAR(?::([^\]|]+))?(?:\|([^\]]*))?\]\]/;

/** Tira o marcador [[AGENDAR]] / [[AGENDAR:iso|Nome]] do texto e o devolve separado. */
export function extrairMarcadorAgenda(texto: string): { texto: string; marcador: MarcadorAgenda | null } {
  const m = RE_MARCADOR.exec(texto);
  const limpo = texto.replace(new RegExp(RE_MARCADOR.source, "g"), "").replace(/\n{3,}/g, "\n\n").trim();
  if (!m) return { texto: limpo, marcador: null };
  const inicio = m[1]?.trim();
  if (!inicio) return { texto: limpo, marcador: { tipo: "listar" } };
  return { texto: limpo, marcador: { tipo: "criar", inicio, nome: m[2]?.trim() || undefined } };
}

/** Qualquer resto de marcador interno que sobrou na resposta (nunca deve chegar ao cliente). */
export function temMarcadorSolto(texto: string): boolean {
  return /\[\[[A-Z_]+/.test(texto);
}

const ROTULOS: [string, string][] = [
  ["IBOV", "Ibovespa (pontos)"],
  ["USD/BRL", "Dólar (R$)"],
  ["EUR/BRL", "Euro (R$)"],
  ["XAU", "Ouro (US$)"],
  ["SELIC", "Selic meta (% a.a.)"],
  ["CDI", "CDI (% ao dia, último dado)"],
  ["IPCA", "IPCA (% no mês, último dado)"],
];

/** Cotações em texto. Deixa de fora ações individuais de propósito (o RAY não fala de papéis). */
export function formatarCotacoes(
  dados: { updatedAt?: string; quotes?: Record<string, { value: number; change: number }> } | null | undefined,
): string {
  const q = dados?.quotes;
  if (!q) return "";
  const linhas: string[] = [];
  for (const [chave, rotulo] of ROTULOS) {
    const c = q[chave];
    if (!c || !Number.isFinite(c.value)) continue;
    const variacao = c.change ? ` (${c.change > 0 ? "+" : ""}${c.change.toFixed(2).replace(".", ",")}% no dia)` : "";
    linhas.push(`- ${rotulo}: ${c.value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${variacao}`);
  }
  if (!linhas.length) return "";
  const quando = dados?.updatedAt ? ` (atualizado em ${dados.updatedAt})` : "";
  return `Cotações${quando}:\n${linhas.join("\n")}`;
}

/** HTML do post do Diário em texto simples, limitado. */
export function textoDoPost(html: string | null | undefined, max = 1500): string {
  const t = String(html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}
