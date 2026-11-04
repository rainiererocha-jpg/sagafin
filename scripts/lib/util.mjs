// Utilitários compartilhados pelos scripts de automação (Diário Saga, agente de trading).
// Sem dependências externas: só Node 20+ (fetch nativo).

export function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

export function env(name, fallback) {
  const v = process.env[name];
  if (!v) {
    if (fallback !== undefined) return fallback;
    fail(`Variável ${name} não configurada.`);
  }
  return v.trim();
}

/** Data de hoje (YYYY-MM-DD) num fuso IANA. Default: America/Sao_Paulo. */
export function hojeISO(timeZone = "America/Sao_Paulo", date = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** Partes de data/hora num fuso (ano, mês, dia, hora, minuto, dia da semana 0-6). */
export function partesNoFuso(timeZone, date = new Date()) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const g = (t) => p.find((x) => x.type === t)?.value;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  return {
    iso: `${g("year")}-${g("month")}-${g("day")}`,
    hora: Number(g("hour")) % 24,
    minuto: Number(g("minute")),
    dow,
  };
}

export function dataExtenso(iso, timeZone = "America/Sao_Paulo") {
  const d = new Date(`${iso}T12:00:00-03:00`);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

export function ddmm(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export async function fetchJson(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* não é JSON */ }
    return { ok: r.ok, status: r.status, json, text };
  } finally {
    clearTimeout(t);
  }
}

export function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function contarPalavras(texto) {
  return String(texto).split(/\s+/).filter(Boolean).length;
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmt(n, dec = 2) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/d";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmtVar(ch) {
  if (typeof ch !== "number" || !Number.isFinite(ch)) return "";
  const sinal = ch > 0 ? "+" : "";
  return ` (${sinal}${fmt(ch)}%)`;
}

/** Extrai um objeto JSON de uma resposta de LLM (tolera crases e texto em volta). */
export function extrairJson(texto) {
  const limpo = String(texto).trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(limpo); } catch { /* tenta recortar */ }
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (ini >= 0 && fim > ini) {
    try { return JSON.parse(limpo.slice(ini, fim + 1)); } catch { /* cai no erro abaixo */ }
  }
  return null;
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
