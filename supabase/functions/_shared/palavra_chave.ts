// Detecção da palavra-chave do funil "comente SAGA" (espelho de scripts/social/pilares.mjs — manter iguais).
export function detectarPalavraChave(texto: string): string | null {
  const t = String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/\bsaga\b/.test(t)) return "saga";
  if (/\beu\s*quero\b/.test(t)) return "eu quero";
  for (const k of ["manual", "guia", "quero"]) if (new RegExp(`\\b${k}\\b`).test(t)) return k;
  return null;
}

export function linkManual(rede: string, utmContent: string, site = "https://sagafin.com.br"): string {
  const p = new URLSearchParams({ utm_source: rede, utm_medium: "dm", utm_campaign: "saga", utm_content: utmContent });
  return `${site}/manual?${p.toString()}`;
}
