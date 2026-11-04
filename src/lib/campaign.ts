// Campanha "Manual Pós-Eleições" (04/11/2026). Constantes da landing /pos-eleicoes.
export const CAMPAIGN = "manual-pos-eleicoes";
export const SOURCE = "pos-eleicoes";

export const FAIXAS = [
  { value: "ate-100k", label: "Até R$ 100 mil" },
  { value: "100-300k", label: "R$ 100 mil a R$ 300 mil" },
  { value: "300k-1m", label: "R$ 300 mil a R$ 1 milhão" },
  { value: "acima-1m", label: "Acima de R$ 1 milhão" },
] as const;

export const ONDE_INVESTE = [
  { value: "banco", label: "No banco" },
  { value: "corretora", label: "Em corretora" },
  { value: "nao-invisto", label: "Ainda não invisto" },
] as const;

export type Faixa = (typeof FAIXAS)[number]["value"];

/** Qualificado para o diagnóstico: R$ 100 mil ou mais investidos. */
export const isQualified = (faixa: string) => faixa !== "ate-100k" && faixa !== "";
export const faixaLabel = (faixa: string) => FAIXAS.find((f) => f.value === faixa)?.label ?? faixa;

export const MANUAL_PDF = "/ebooks/manual-pos-eleicoes-v2.pdf";
export const WHATSAPP = "5562994160930";
export const XP_CODE: string = (import.meta as any).env?.VITE_XP_ASSESSOR_CODE ?? "";
export const XP_OUVIDORIA = "0800 722 3730";

export const xpOpenAccountUrl = () =>
  XP_CODE ? `https://cadastro.xpi.com.br/desktop/step/1?assessor=${encodeURIComponent(XP_CODE)}` : "";

export const waDiagnosticoUrl = (nome: string, faixa: string) => {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  const msg = `Olá, Rainiere! Sou ${primeiro}. Baixei o Manual Pós-Eleições e tenho ${faixaLabel(faixa)} investidos. Quero agendar o diagnóstico da minha carteira.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
};
