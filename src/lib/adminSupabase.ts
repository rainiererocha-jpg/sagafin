import { createClient } from "@supabase/supabase-js";

// Projeto Supabase da automação/aprovações (separado do projeto do blog).
// A anon/publishable key é segura no cliente — quem protege os dados é o RLS + Auth.
const ADMIN_URL =
  (import.meta.env.VITE_ADMIN_SUPABASE_URL as string) ??
  "https://ojesmvryqehcmaolkbsd.supabase.co";
const ADMIN_KEY =
  (import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY as string) ??
  "sb_publishable_QSRU-LZga7oHclWgMM7OBQ_5wUfvZM2";

export const adminSupabase = createClient(ADMIN_URL, ADMIN_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Allowlist opcional (CSV em VITE_ADMIN_ALLOWED_EMAILS). Vazio = qualquer
// usuário autenticado (o login por magic link já exige posse do e-mail e
// signInWithOtp usa shouldCreateUser:false, então só usuários pré-criados entram).
const RAW_ALLOWED = (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS as string) ?? "";
export const ALLOWED_EMAILS = RAW_ALLOWED.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;
  if (ALLOWED_EMAILS.length === 0) return true;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
