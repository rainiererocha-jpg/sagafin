import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { adminSupabase, isEmailAllowed } from "@/lib/adminSupabase";

type AuthCtx = { user: User | null; signOut: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, signOut: async () => {} });
export const useAdminAuth = () => useContext(Ctx);

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = adminSupabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await adminSupabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        Carregando…
      </div>
    );
  }

  const email = session?.user?.email;
  const allowed = !!session && isEmailAllowed(email);

  if (!allowed) {
    return <Login deniedEmail={session ? email : undefined} onSignOut={signOut} />;
  }

  return <Ctx.Provider value={{ user: session!.user, signOut }}>{children}</Ctx.Provider>;
}

function Login({ deniedEmail, onSignOut }: { deniedEmail?: string | null; onSignOut: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await adminSupabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    setBusy(false);
    if (error) {
      setErr(
        error.message.includes("Signups not allowed") || error.message.includes("not allowed")
          ? "E-mail não autorizado. Fale com o administrador."
          : error.message
      );
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Saga · <span className="text-teal-400">Studio</span>
        </h1>
        <p className="text-xs text-slate-500 mb-6">Central de gestão de conteúdo — acesso restrito.</p>

        {deniedEmail && (
          <div className="mb-4 text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3">
            <code>{deniedEmail}</code> não está autorizado.{" "}
            <button onClick={onSignOut} className="underline">sair</button>
          </div>
        )}

        {sent ? (
          <div className="text-sm text-slate-300">
            ✓ Link de acesso enviado para <code className="text-teal-400">{email}</code>.<br />
            Abra o e-mail e clique para entrar.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:border-teal-500 outline-none"
            />
            {err && <div className="text-xs text-red-400">{err}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition disabled:opacity-60"
            >
              {busy ? "Enviando…" : "Enviar link de acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
