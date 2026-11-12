import { useState } from "react";
import { Lock, Loader2, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setSubscriberEmail } from "@/lib/tradingClient";
import { WA_ASSESSORIA_URL } from "@/data/tastytrade-referral";

const patrimonioOptions = [
  { value: "ate-100k", label: "Até R$ 100 mil" },
  { value: "100-500k", label: "R$ 100k – R$ 500k" },
  { value: "500k-2m", label: "R$ 500k – R$ 2M" },
  { value: "acima-2m", label: "Acima de R$ 2M" },
];

const objetivoOptions = [
  { value: "crescimento", label: "Crescer patrimônio" },
  { value: "renda", label: "Gerar renda passiva" },
  { value: "aposentadoria", label: "Aposentadoria" },
  { value: "protecao", label: "Proteger o que tenho" },
];

const inputCls =
  "h-11 w-full rounded-lg bg-background/60 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/60";

/**
 * Libera o Manual tastytrade em troca de um lead de assessoria (nome, e-mail, WhatsApp, patrimônio, objetivo).
 * Mesmo fluxo do MarketDigestModal (subscribe_daily + leads), mas inline e com WhatsApp obrigatório.
 */
export function ManualGate({ onUnlocked }: { onUnlocked: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setError("Marque a autorização de contato para liberar o manual."); return; }
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Cadastro indisponível no momento.");
      const { error: subError } = await supabase.rpc("subscribe_daily", { p_email: email, p_name: name });
      if (subError) throw subError;
      const { error: leadError } = await supabase.from("leads").insert({
        name,
        email,
        phone: whatsapp,
        investment_range: patrimonio || null,
        message: `Objetivo: ${objetivo || "não informado"} | Canal: Manual tastytrade | Aceitou contato da assessoria`,
        source: "manual-tastytrade",
      });
      if (leadError) console.error("[Manual] lead não salvo:", leadError.message);
      setSubscriberEmail(email);
      setDone(true);
    } catch (err) {
      console.error("[Manual] cadastro falhou:", err);
      setError("Não foi possível concluir o cadastro. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-gold/30 bg-card/60 backdrop-blur-md p-8 md:p-10 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative">
        {done ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold/20 bg-gold/10 mb-5">
              <CheckCircle2 className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-2xl font-serif text-foreground mb-2">Manual liberado</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-[360px] mx-auto">
              Rainiere vai entrar em contato pelo WhatsApp informado. Se preferir, chame agora e já leia o manual completo abaixo.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
              <a
                href={WA_ASSESSORIA_URL} target="_blank" rel="noopener noreferrer"
                className="h-11 rounded-lg bg-gold text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <MessageCircle className="w-4 h-4" /> Falar com Rainiere agora
              </a>
              <button
                type="button" onClick={() => onUnlocked(email.trim().toLowerCase())}
                className="h-11 rounded-lg border border-gold/50 text-gold font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gold/10"
              >
                Ler o manual <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" /> Manual completo
            </div>
            <h3 className="text-2xl font-serif text-foreground mb-2">Libere o manual e receba o contato do assessor</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Onze capítulos, do cadastro ao imposto, com dados ao vivo da tastytrade. Gratuito para quem quer conhecer a assessoria de Rainiere Rocha.
            </p>
            <form onSubmit={submit} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={inputCls} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={inputCls} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  required type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp com DDD" pattern="[0-9 +\-\(\)]{10,20}" title="Informe o número com DDD" className={inputCls}
                />
                <select required value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)} className={inputCls}>
                  <option value="" disabled>Patrimônio investido</option>
                  {patrimonioOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select required value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className={inputCls}>
                  <option value="" disabled>Objetivo principal</option>
                  {objetivoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <label className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[hsl(42_85%_55%)]" />
                <span>Autorizo o contato da assessoria de Rainiere Rocha pelo WhatsApp e e-mail informados, e o envio do Diário Saga. Posso cancelar quando quiser (LGPD).</span>
              </label>
              <button
                type="submit" disabled={loading}
                className="h-11 px-5 rounded-lg bg-gold text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Liberar o manual <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <p className="text-[11px] text-muted-foreground/60 mt-4">
              Conteúdo educacional; não é recomendação de investimento. Seus dados são usados apenas para o contato da assessoria e o envio do Diário.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
