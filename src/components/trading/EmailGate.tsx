import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setSubscriberEmail } from "@/lib/tradingClient";

/** Libera o estudo completo em troca do cadastro no Diário Saga (reusa a RPC subscribe_daily). */
export function EmailGate({ onUnlocked }: { onUnlocked: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Cadastro indisponível no momento.");
      const { error: subError } = await supabase.rpc("subscribe_daily", { p_email: email, p_name: name });
      if (subError) throw subError;
      const { error: leadError } = await supabase.from("leads").insert({ name, email, message: "Canal: Destaques de Trading", source: "trading" });
      if (leadError) console.error("[Trading] lead não salvo:", leadError.message);
      setSubscriberEmail(email);
      onUnlocked(email.trim().toLowerCase());
    } catch (err) {
      console.error("[Trading] cadastro falhou:", err);
      setError("Não foi possível concluir o cadastro. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-gold/30 bg-card/60 backdrop-blur-md p-8 md:p-10 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" /> Estudo completo
        </div>
        <h3 className="text-2xl font-serif text-foreground mb-2">Tese completa, strikes, cenários e gestão de risco</h3>
        <p className="text-sm text-muted-foreground mb-6">
          O resumo é público. A estrutura detalhada é liberada para quem assina o Diário Saga, gratuito, enviado antes das 9h nos dias úteis. Cancele quando quiser.
        </p>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
            className="h-11 rounded-lg bg-background/60 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/60"
          />
          <input
            required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
            className="h-11 rounded-lg bg-background/60 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/60"
          />
          <button
            type="submit" disabled={loading}
            className="h-11 px-5 rounded-lg bg-gold text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Liberar <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        <p className="text-[11px] text-muted-foreground/60 mt-4">
          Seus dados são usados apenas para o envio do Diário (LGPD). Conteúdo educacional; não é recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
