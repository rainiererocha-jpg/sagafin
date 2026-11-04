// Calendários de pregão (B3 e NYSE). Arquivos JSON: { "_comentario": "...", "2026": ["YYYY-MM-DD", ...] }.
import { readFile } from "node:fs/promises";

export async function carregarFeriados(caminho) {
  return JSON.parse(await readFile(caminho, "utf8"));
}

/** Diz se há pregão numa data ISO, dado o mapa de feriados por ano. */
export function diaDePregao(iso, feriados, { aviso = console.warn } = {}) {
  const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
  if (dow === 0 || dow === 6) return { rodar: false, motivo: "fim de semana" };
  const ano = iso.slice(0, 4);
  if (!feriados[ano]) aviso(`⚠ lista de feriados não tem o ano ${ano}; atualize o JSON.`);
  if ((feriados[ano] || []).includes(iso)) return { rodar: false, motivo: "feriado" };
  return { rodar: true };
}

/** Dias corridos entre duas datas ISO (b - a). */
export function diasEntre(aISO, bISO) {
  return Math.round((Date.parse(`${bISO}T00:00:00Z`) - Date.parse(`${aISO}T00:00:00Z`)) / 86400000);
}

export function somarDias(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
