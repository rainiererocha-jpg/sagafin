// ─────────────────────────────────────────────────────────────────────────────
// Episódios de conversa do RAY.
//
// Uma pessoa tem UMA linha em ray_conversas para sempre (o humano precisa ver o
// histórico inteiro). Mas o RAY não pode tratar semanas e assuntos diferentes
// como uma conversa só. Episódio = trecho do histórico que o RAY trata como "a
// conversa de agora": começa no mais recente entre um marcador (tipo 'disparo',
// gravado quando uma mensagem proativa chega ao contato) e a primeira mensagem
// depois de um silêncio de HORAS_EPISODIO (72 h).
//
// Adaptado de coopcred-glow/supabase/functions/_shared/episodio.ts.
// Sem imports: roda no Deno das edge functions e no Vitest.
// ─────────────────────────────────────────────────────────────────────────────

export const HORAS_EPISODIO = 72;

export interface MensagemConversa {
  role: string;
  content: string;
  ts?: string;
  autor?: string;
  tipo?: string;
  /** Nome do template ou da campanha de uma mensagem proativa (marcador). */
  campanha_nome?: string | null;
}

export function ehMarcador(m: MensagemConversa | null | undefined): boolean {
  return m?.tipo === "disparo";
}

function instante(m: MensagemConversa | undefined): number {
  const t = Date.parse(m?.ts ?? "");
  return Number.isFinite(t) ? t : NaN;
}

/** Índice da primeira mensagem do episódio atual (0 se o histórico é um episódio só). */
export function inicioDoEpisodio(mensagens: MensagemConversa[], horas = HORAS_EPISODIO): number {
  const limite = horas * 3_600_000;
  let inicio = 0;
  for (let i = 0; i < mensagens.length; i++) {
    if (ehMarcador(mensagens[i])) {
      inicio = i;
      continue;
    }
    if (i === 0) continue;
    const agora = instante(mensagens[i]);
    const antes = instante(mensagens[i - 1]);
    // Sem os dois instantes não dá para medir o silêncio, então não corta ali.
    if (Number.isFinite(agora) && Number.isFinite(antes) && agora - antes >= limite) inicio = i;
  }
  return inicio;
}

/** Último marcador dentro do episódio, ou null. */
export function ultimoMarcador(mensagens: MensagemConversa[], desde: number): MensagemConversa | null {
  for (let i = mensagens.length - 1; i >= Math.max(0, desde); i--) {
    if (ehMarcador(mensagens[i])) return mensagens[i];
  }
  return null;
}

/** Falas reais do episódio (sem marcadores), na ordem. */
export function mensagensDoEpisodio(mensagens: MensagemConversa[], desde: number): MensagemConversa[] {
  return mensagens.slice(Math.max(0, desde)).filter((m) => !ehMarcador(m));
}

/** O contato ainda não falou neste episódio (instruções [SISTEMA] não contam). */
export function episodioSemFalaDoCliente(mensagens: MensagemConversa[], desde: number): boolean {
  return !mensagensDoEpisodio(mensagens, desde)
    .some((m) => m.role === "user" && !String(m.content ?? "").startsWith("[SISTEMA]"));
}

/** O RAY (ou um humano) ainda não respondeu neste episódio. */
export function episodioSemResposta(mensagens: MensagemConversa[], desde: number): boolean {
  return !mensagensDoEpisodio(mensagens, desde).some((m) => m.role === "assistant");
}

/** Últimas n falas do episódio (para montar o contexto do modelo). */
export function ultimasDoEpisodio(mensagens: MensagemConversa[], n = 16): MensagemConversa[] {
  return mensagensDoEpisodio(mensagens, inicioDoEpisodio(mensagens)).slice(-n);
}

/** Primeira resposta do episódio? (decide se vai a apresentação + aviso). Confirmações de sistema (opt-in/opt-out) não contam. */
export function primeiraRespostaDoEpisodio(mensagens: MensagemConversa[]): boolean {
  return !mensagensDoEpisodio(mensagens, inicioDoEpisodio(mensagens))
    .some((m) => m.role === "assistant" && m.tipo !== "sistema");
}
