import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const KEY = "saga_utm";
const CAMPOS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type Utm = Partial<Record<(typeof CAMPOS)[number], string>>;

/** Lê utm_* da URL e guarda na sessão (o navegador interno do Instagram recarrega a página). */
export function useUtm(): Utm & { landing_path: string } {
  const [params] = useSearchParams();
  return useMemo(() => {
    let salvo: Utm = {};
    try { salvo = JSON.parse(sessionStorage.getItem(KEY) ?? "{}"); } catch { /* sem storage */ }
    const atual: Utm = {};
    for (const c of CAMPOS) {
      const v = params.get(c);
      if (v) atual[c] = v.slice(0, 80);
    }
    const final = Object.keys(atual).length ? atual : salvo;
    try { sessionStorage.setItem(KEY, JSON.stringify(final)); } catch { /* ignora */ }
    return { ...final, landing_path: window.location.pathname };
  }, [params]);
}
