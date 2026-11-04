// ─────────────────────────────────────────────────────────────────────────────
// Lógica pura da agenda do Rainiere (sem rede): gera os horários possíveis e
// tira os que o Google Calendar acusou como ocupados.
//
// Fuso: America/Sao_Paulo está fixo em UTC-3 desde 2019 (sem horário de verão),
// então a conta usa deslocamento fixo. Se o Brasil voltar a ter horário de
// verão, trocar OFFSET_HORAS por uma biblioteca de fuso.
// Sem imports: roda no Deno e no Vitest.
// ─────────────────────────────────────────────────────────────────────────────

export const OFFSET_HORAS = -3;
export const FUSO = "America/Sao_Paulo";

export interface OpcoesAgenda {
  dias?: number; // janela, padrão 7
  horaInicio?: number; // padrão 9
  horaFim?: number; // padrão 18 (último horário começa 17:30)
  duracaoMin?: number; // padrão 30
  /** Antecedência mínima em minutos a partir de "agora" (padrão 120). */
  antecedenciaMin?: number;
}

export interface Intervalo {
  start: string; // ISO
  end: string; // ISO
}

export interface Slot {
  inicio: string; // ISO UTC
  fim: string; // ISO UTC
  rotulo: string; // "ter, 27/10 às 14:00"
}

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Data "de parede" em São Paulo, como um Date cujos getters UTC mostram o horário local. */
function paraLocal(d: Date): Date {
  return new Date(d.getTime() + OFFSET_HORAS * 3_600_000);
}

function deLocal(ano: number, mes: number, dia: number, hora: number, min: number): Date {
  return new Date(Date.UTC(ano, mes, dia, hora, min) - OFFSET_HORAS * 3_600_000);
}

const dois = (n: number) => String(n).padStart(2, "0");

export function rotuloSlot(inicio: Date): string {
  const l = paraLocal(inicio);
  return `${DIAS_SEMANA[l.getUTCDay()]}, ${dois(l.getUTCDate())}/${dois(l.getUTCMonth() + 1)} às ${dois(l.getUTCHours())}:${dois(l.getUTCMinutes())}`;
}

/** Todos os horários candidatos (seg-sex, horaInicio-horaFim, de 30 em 30 min), sem olhar a agenda. */
export function gerarSlots(agora: Date, opcoes: OpcoesAgenda = {}): Slot[] {
  const dias = opcoes.dias ?? 7;
  const hIni = opcoes.horaInicio ?? 9;
  const hFim = opcoes.horaFim ?? 18;
  const dur = opcoes.duracaoMin ?? 30;
  const antecedencia = (opcoes.antecedenciaMin ?? 120) * 60_000;
  const limiteInicial = agora.getTime() + antecedencia;

  const hoje = paraLocal(agora);
  const slots: Slot[] = [];
  for (let i = 0; i <= dias; i++) {
    const ref = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + i));
    const dow = ref.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    for (let minutos = hIni * 60; minutos + dur <= hFim * 60; minutos += dur) {
      const ini = deLocal(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), Math.floor(minutos / 60), minutos % 60);
      if (ini.getTime() < limiteInicial) continue;
      if (ini.getTime() > agora.getTime() + dias * 86_400_000) continue;
      slots.push({
        inicio: ini.toISOString(),
        fim: new Date(ini.getTime() + dur * 60_000).toISOString(),
        rotulo: rotuloSlot(ini),
      });
    }
  }
  return slots;
}

/** Dois intervalos se sobrepõem? (encostar na ponta não conta) */
export function sobrepoe(aIni: number, aFim: number, bIni: number, bFim: number): boolean {
  return aIni < bFim && bIni < aFim;
}

/** Remove os horários que colidem com algum intervalo ocupado (freebusy). */
export function filtrarLivres(slots: Slot[], ocupados: Intervalo[]): Slot[] {
  const occ = ocupados
    .map((o) => [Date.parse(o.start), Date.parse(o.end)] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  return slots.filter((s) => {
    const i = Date.parse(s.inicio);
    const f = Date.parse(s.fim);
    return !occ.some(([a, b]) => sobrepoe(i, f, a, b));
  });
}

/** Limita a quantidade e espalha pelos dias (no máximo `porDia` por dia), para a mensagem não virar lista de 80 itens. */
export function resumirSlots(slots: Slot[], max = 6, porDia = 2): Slot[] {
  const contagem = new Map<string, number>();
  const out: Slot[] = [];
  for (const s of slots) {
    const dia = paraLocal(new Date(s.inicio)).toISOString().slice(0, 10);
    const n = contagem.get(dia) ?? 0;
    if (n >= porDia) continue;
    contagem.set(dia, n + 1);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export type ErroSlot = "formato_invalido" | "passado" | "fora_do_expediente" | "fim_de_semana" | "ocupado" | "fora_da_janela";

/** Confere se um horário escolhido ainda é válido antes de criar o evento. */
export function validarSlot(
  inicioIso: string,
  agora: Date,
  ocupados: Intervalo[],
  opcoes: OpcoesAgenda = {},
): { ok: true; fim: string } | { ok: false; erro: ErroSlot } {
  const dur = opcoes.duracaoMin ?? 30;
  const hIni = opcoes.horaInicio ?? 9;
  const hFim = opcoes.horaFim ?? 18;
  const dias = opcoes.dias ?? 7;
  const t = Date.parse(inicioIso);
  if (!Number.isFinite(t)) return { ok: false, erro: "formato_invalido" };
  if (t < agora.getTime()) return { ok: false, erro: "passado" };
  if (t > agora.getTime() + (dias + 1) * 86_400_000) return { ok: false, erro: "fora_da_janela" };
  const l = paraLocal(new Date(t));
  const dow = l.getUTCDay();
  if (dow === 0 || dow === 6) return { ok: false, erro: "fim_de_semana" };
  const minutos = l.getUTCHours() * 60 + l.getUTCMinutes();
  if (minutos < hIni * 60 || minutos + dur > hFim * 60 || minutos % dur !== 0) {
    return { ok: false, erro: "fora_do_expediente" };
  }
  const fim = t + dur * 60_000;
  if (ocupados.some((o) => sobrepoe(t, fim, Date.parse(o.start), Date.parse(o.end)))) {
    return { ok: false, erro: "ocupado" };
  }
  return { ok: true, fim: new Date(fim).toISOString() };
}
