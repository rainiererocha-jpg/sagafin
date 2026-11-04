// Utilidades comuns das edge functions do RAY (Deno). Só lê configuração por Deno.env.get.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.101.1";

export const SUPABASE_URL = () => Deno.env.get("SUPABASE_URL") ?? "";
export const SERVICE_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function clienteServico(): SupabaseClient {
  return createClient(SUPABASE_URL(), SERVICE_KEY(), { auth: { persistSession: false } });
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Comparação em tempo constante (evita vazar o segredo pelo tempo de resposta). */
export function iguaisSeguro(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export function bearer(req: Request): string {
  return (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

/** Funções internas (ray-agent, ray-send, ray-agendar) só aceitam a chave de serviço. */
export function chamadaDeServico(req: Request): boolean {
  const k = SERVICE_KEY();
  return !!k && iguaisSeguro(bearer(req), k);
}

/** Chama outra edge function do mesmo projeto com a chave de serviço. */
export async function chamarFuncao<T = Record<string, unknown>>(nome: string, corpo: unknown): Promise<T & { _status: number }> {
  const res = await fetch(`${SUPABASE_URL()}/functions/v1/${nome}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY()}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await res.json().catch(() => ({}));
  return { ...(dados as T), _status: res.status };
}

/** Só dígitos. */
export const soDigitos = (v: unknown): string => String(v ?? "").replace(/\D/g, "");
