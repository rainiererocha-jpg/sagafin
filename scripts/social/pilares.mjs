// Calendário editorial do motor social (scripts/social-diario.mjs).
// Regra: stories todo dia útil a partir do Diário; o carrossel do dia alterna entre o Diário (mercado),
// um tema evergreen da Biblioteca e o resumo dos Destaques de Trading.
// Os temas evergreen seguem o que mais converteu no histórico (fiscal/PGBL, dolarização, organização da renda alta).

export const CTA_KEYWORD = "SAGA";
export const CTA_KEYWORDS_ACEITAS = ["saga", "eu quero", "quero", "manual", "guia"];

/** Temas evergreen em rodízio (um por terça/quinta). Cada um aponta para um capítulo do manual. */
export const EVERGREEN = [
  { id: "pgbl-servidor", capitulo: 9, tema: "PGBL para quem faz a declaração completa (inclusive servidor público com RPPS): dedução de até 12% e tabela regressiva" },
  { id: "dolarizacao-etf", capitulo: 8, tema: "Dolarizar parte da carteira sem abrir conta lá fora: ETFs de índice na B3, BDRs e o papel do câmbio" },
  { id: "vazamentos-renda-alta", capitulo: 1, tema: "Os vazamentos de quem ganha bem e não acumula: assinaturas, parcelamentos, dinheiro parado" },
  { id: "reserva-emergencia", capitulo: 2, tema: "Quanto ter de reserva de emergência por perfil de renda e onde deixar (segurança, liquidez, rendimento)" },
  { id: "marcacao-mercado", capitulo: 4, tema: "Por que o título do Tesouro fica vermelho no extrato: marcação a mercado explicada com exemplo" },
  { id: "ipca-mais", capitulo: 4, tema: "Tesouro IPCA+: como proteger o poder de compra no longo prazo e quando ele oscila" },
  { id: "credito-privado-checklist", capitulo: 5, tema: "Checklist de 5 perguntas antes de comprar debênture, CRI ou CRA" },
  { id: "fii-vs-imovel", capitulo: 6, tema: "FII ou imóvel na planta? Custos, vacância, liquidez e diversificação comparados" },
  { id: "dividendos-armadilha", capitulo: 7, tema: "A armadilha do dividend yield alto e o que olhar numa boa pagadora" },
  { id: "numero-fire", capitulo: 10, tema: "Qual é o seu número de independência financeira: a regra dos 25x e o ajuste para o Brasil" },
  { id: "opcoes-seguro", capitulo: 11, tema: "Opção como seguro da carteira: o protective put e o collar explicados sem jargão" },
  { id: "mini-indice", capitulo: 12, tema: "Mini-índice e mini-dólar: valor do ponto, margem, ajuste diário e as regras de sobrevivência" },
  { id: "carteira-por-prazo", capitulo: 3, tema: "Cada dinheiro tem um prazo: como separar a carteira em caixas de objetivo" },
];

/** Escolhe o pilar do dia. `dow`: 0=dom … 6=sáb. `seq`: contador de rodízio (ex.: semana do ano). */
export function pilarDoDia(dow, seq = 0) {
  if (dow === 2 || dow === 4) {
    const idx = (seq * 2 + (dow === 4 ? 1 : 0)) % EVERGREEN.length;
    return { pilar: "evergreen", evergreen: EVERGREEN[idx] };
  }
  if (dow === 5) return { pilar: "trading" };
  return { pilar: "mercado" };
}

/** Semana ISO aproximada (para girar o rodízio evergreen sem estado no banco). */
export function semanaDoAno(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d - inicio) / (7 * 86400000));
}

/** Link rastreável para a landing do manual. `rede` = instagram | facebook | linkedin | stories. */
export function linkManual(rede, utmContent, site = "https://sagafin.com.br") {
  const p = new URLSearchParams({
    utm_source: rede,
    utm_medium: "social",
    utm_campaign: "saga",
    utm_content: utmContent,
  });
  return `${site.replace(/\/$/, "")}/manual?${p.toString()}`;
}

/** Detecta palavra-chave do CTA num comentário (usada também pelo webhook da Meta). */
export function detectarPalavraChave(texto) {
  const t = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/\bsaga\b/.test(t)) return "saga";
  if (/\beu\s*quero\b/.test(t)) return "eu quero";
  for (const k of ["manual", "guia", "quero"]) if (new RegExp(`\\b${k}\\b`).test(t)) return k;
  return null;
}
