/**
 * Validador central de telefone do Sagafin.
 *
 * PADRÃO PERFEITO (o único que o sistema aceita gravar ou disparar):
 *   13 dígitos = 55 + DDD válido + 9 + 8 dígitos, e os 9 dígitos do assinante
 *   não podem ser todos iguais. Ex.: 5562981526559.
 * Fixo, número internacional e 0800 ficam de fora.
 *
 * REGRA DE OURO: nunca cortar, completar ou reinterpretar dígitos fora daqui.
 * As únicas correções permitidas são as três de `validarTelefone` abaixo.
 *
 * Adaptado de coopcred-glow/supabase/functions/_shared/telefone.ts.
 * Sem imports: roda no Deno das edge functions e no Vitest.
 */

// ─── DDDs válidos no Brasil (67) ──────────────────────────────────────────────

export const DDDS_VALIDOS: ReadonlySet<string> = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type StatusTelefone = 'aceito' | 'corrigido' | 'descartado';

export type MotivoDescarte =
  | 'DDD_INVALIDO'
  | 'TELEFONE_FIXO'
  | 'QTD_DIGITOS'
  | 'INTERNACIONAL'
  | 'DIGITOS_REPETIDOS'
  | 'VAZIO'
  | 'DUPLICADO';

export interface ResultadoTelefone {
  status: StatusTelefone;
  /** 13 dígitos no padrão perfeito, ou null quando descartado. */
  numero_final: string | null;
  /** Exatamente o que veio na planilha/formulário — para auditoria. */
  numero_original: string;
  /** Preenchido só quando status === 'descartado'. */
  motivo: MotivoDescarte | null;
}

export interface OpcoesValidacao {
  /**
   * Quando false, só passa o que já chega no padrão perfeito; qualquer número
   * que precisaria de conserto vira descartado. Espelha a configuração
   * `corrigir_automaticamente` (padrão: true).
   */
  corrigirAutomaticamente?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const soDigitos = (v: unknown): string => String(v ?? '').replace(/\D/g, '');

const descartar = (original: string, motivo: MotivoDescarte): ResultadoTelefone => ({
  status: 'descartado',
  numero_final: null,
  numero_original: original,
  motivo,
});

/** Formata 13 dígitos para exibição: 5562981526559 → (62) 98152-6559 */
export function formatarTelefoneBR(numero13: string | null | undefined): string {
  const d = soDigitos(numero13);
  if (d.length !== 13) return String(numero13 ?? '');
  return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
}

// ─── Validador ────────────────────────────────────────────────────────────────

/**
 * Limpa, corrige o inequívoco e valida um telefone.
 *
 * As TRÊS únicas correções permitidas:
 *   a) 11 dígitos (DDD + 9 + 8)   → prefixa 55
 *   b) 12 dígitos (55 + DDD + 8)  → insere o 9 depois do DDD (1º dos 8 em 6–9)
 *   c) 10 dígitos (DDD + 8)       → prefixa 55 e insere o 9 (1º dos 8 em 6–9)
 */
export function validarTelefone(
  bruto: unknown,
  opcoes: OpcoesValidacao = {},
): ResultadoTelefone {
  const corrigir = opcoes.corrigirAutomaticamente !== false;
  const original = String(bruto ?? '').trim();
  const d = soDigitos(original);

  if (!d) return descartar(original, 'VAZIO');

  // Comprimento de número internacional sem o 55 do Brasil.
  if (d.length >= 12 && !d.startsWith('55')) return descartar(original, 'INTERNACIONAL');
  if (d.length > 13) return descartar(original, 'QTD_DIGITOS');

  // Separa DDD e assinante conforme o formato da entrada.
  let ddd: string;
  let assinante: string;
  if (d.length === 13 && d.startsWith('55')) {
    ddd = d.slice(2, 4);
    assinante = d.slice(4); // 9 dígitos
  } else if (d.length === 12 && d.startsWith('55')) {
    ddd = d.slice(2, 4);
    assinante = d.slice(4); // 8 dígitos
  } else if (d.length === 11) {
    ddd = d.slice(0, 2);
    assinante = d.slice(2); // 9 dígitos
  } else if (d.length === 10) {
    ddd = d.slice(0, 2);
    assinante = d.slice(2); // 8 dígitos
  } else {
    return descartar(original, 'QTD_DIGITOS');
  }

  // O DDD vem antes de tudo: `(56) 28152-6559` é DDD_INVALIDO, não fixo.
  if (!DDDS_VALIDOS.has(ddd)) return descartar(original, 'DDD_INVALIDO');

  if (assinante.length === 9) {
    // Celular que já tem o nono dígito precisa começar em 9.
    if (assinante[0] !== '9') {
      return descartar(original, /^[2-5]/.test(assinante) ? 'TELEFONE_FIXO' : 'QTD_DIGITOS');
    }
  } else {
    // 8 dígitos: só é celular sem o nono se começar em 6–9.
    if (!/^[6-9]/.test(assinante)) return descartar(original, 'TELEFONE_FIXO');
    assinante = `9${assinante}`;
  }

  // 99999-9999 e afins não são número de gente.
  if (/^(\d)\1{8}$/.test(assinante)) return descartar(original, 'DIGITOS_REPETIDOS');

  const numero_final = `55${ddd}${assinante}`;

  if (numero_final === d) {
    return { status: 'aceito', numero_final, numero_original: original, motivo: null };
  }
  if (!corrigir) return descartar(original, 'QTD_DIGITOS');
  return { status: 'corrigido', numero_final, numero_original: original, motivo: null };
}

/** Atalho: o número já está no padrão perfeito, pronto para disparo? */
export function telefoneValidoParaDisparo(bruto: unknown): boolean {
  return validarTelefone(bruto, { corrigirAutomaticamente: false }).status === 'aceito';
}

/**
 * Por que este número NÃO pode ser disparado — ou null quando ele já está no
 * padrão perfeito.
 *
 * Devolve o motivo real (DDD_INVALIDO, TELEFONE_FIXO...) mesmo quando o
 * número é apenas consertável (nesse caso, QTD_DIGITOS).
 */
export function motivoBloqueio(bruto: unknown): MotivoDescarte | null {
  if (telefoneValidoParaDisparo(bruto)) return null;
  return validarTelefone(bruto).motivo ?? 'QTD_DIGITOS';
}

// ─── Validação de lista (com de-duplicação) ───────────────────────────────────

export interface ItemLista {
  nome?: string;
  telefone: unknown;
}

export interface ResultadoItemLista extends ResultadoTelefone {
  nome?: string;
  /** Posição na lista de entrada, 0-indexed. */
  indice: number;
}

export interface ResultadoLista {
  aceitos: ResultadoItemLista[];
  corrigidos: ResultadoItemLista[];
  descartados: ResultadoItemLista[];
}

/**
 * Valida uma lista inteira e remove duplicados. O primeiro número válido vence;
 * as repetições seguintes saem como DUPLICADO. `jaExistentes` recebe os números
 * que a lista de destino já tem, para não reimportar ninguém.
 */
export function validarListaTelefones(
  itens: ItemLista[],
  opcoes: OpcoesValidacao & { jaExistentes?: Iterable<string> } = {},
): ResultadoLista {
  const vistos = new Set<string>();
  for (const e of opcoes.jaExistentes ?? []) {
    const r = validarTelefone(e, opcoes);
    if (r.numero_final) vistos.add(r.numero_final);
  }

  const out: ResultadoLista = { aceitos: [], corrigidos: [], descartados: [] };

  itens.forEach((item, indice) => {
    const r = validarTelefone(item.telefone, opcoes);
    const base: ResultadoItemLista = { ...r, nome: item.nome, indice };

    if (r.status === 'descartado') {
      out.descartados.push(base);
      return;
    }
    const final = r.numero_final as string;
    if (vistos.has(final)) {
      out.descartados.push({
        ...base,
        status: 'descartado',
        numero_final: null,
        motivo: 'DUPLICADO',
      });
      return;
    }
    vistos.add(final);
    (r.status === 'aceito' ? out.aceitos : out.corrigidos).push(base);
  });

  return out;
}

/** Texto do motivo para a tela de prévia e a planilha de descartados. */
export const MOTIVO_TEXTO: Record<MotivoDescarte, string> = {
  DDD_INVALIDO: 'DDD não existe no Brasil',
  TELEFONE_FIXO: 'Telefone fixo — o WhatsApp não entrega',
  QTD_DIGITOS: 'Quantidade de dígitos fora do padrão',
  INTERNACIONAL: 'Número de fora do Brasil',
  DIGITOS_REPETIDOS: 'Número com todos os dígitos repetidos',
  VAZIO: 'Telefone em branco',
  DUPLICADO: 'Número repetido — já estava na lista',
};
