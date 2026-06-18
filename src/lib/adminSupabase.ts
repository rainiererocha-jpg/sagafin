import { createClient } from "@supabase/supabase-js";

// Projeto Supabase da automação/aprovações (separado do projeto do blog).
// A anon/publishable key é segura no cliente — quem protege os dados é o RLS + Auth.
// Projeto Sagafin (mesmo do site/blog). A central convive com posts/leads.
const ADMIN_URL =
  (import.meta.env.VITE_ADMIN_SUPABASE_URL as string) ??
  (import.meta.env.VITE_SUPABASE_URL as string) ??
  "https://vcmnfnsjgfbudypewvjx.supabase.co";
const ADMIN_KEY =
  (import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY as string) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ??
  "sb_publishable_ls394GmNW335PK6ttwzWvQ_OV1Wd0xq";

export const adminSupabase = createClient(ADMIN_URL, ADMIN_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // storageKey distinto p/ não colidir com o client do site (mesmo projeto)
    storageKey: "saga-studio-admin",
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
