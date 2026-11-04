import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUtm } from "@/hooks/useUtm";
import { CAMPAIGN, FAIXAS, ONDE_INVESTE, SOURCE } from "@/lib/campaign";

const GOLD = "hsl(42 85% 55%)";

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`w-full text-left px-4 py-3 rounded-xl border text-[13.5px] transition-all duration-150 ${
        ativo
          ? "border-[hsl(42_85%_55%/0.65)] bg-[hsl(42_85%_55%/0.08)] text-[hsl(42_85%_62%)]"
          : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

const campo =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-[14px] text-foreground placeholder:text-white/30 focus:outline-none focus:border-[hsl(42_85%_55%/0.6)]";

export function PosEleicoesForm({ onSuccess }: { onSuccess: (faixa: string, nome: string) => void }) {
  const { toast } = useToast();
  const utm = useUtm();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [f, setF] = useState({ nome: "", email: "", telefone: "", faixa: "", onde: "", consent: false, website: "" });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const digitos = f.telefone.replace(/\D/g, "");
    if (f.nome.trim().length < 2) return setErro("Diga como você quer ser chamado.");
    if (!/^\S+@\S+\.\S{2,}$/.test(f.email.trim())) return setErro("Confira o e-mail: ele parece incompleto.");
    if (digitos.length < 10 || digitos.length > 13) return setErro("Informe o WhatsApp com DDD, por exemplo (62) 99999-9999.");
    if (!f.faixa) return setErro("Escolha a faixa de patrimônio investido.");
    if (!f.onde) return setErro("Diga onde você investe hoje.");
    if (!f.consent) return setErro("Para receber o manual, marque o consentimento.");

    // Honeypot: robô preenche; mostra sucesso e não grava.
    if (f.website) return onSuccess(f.faixa, f.nome);

    setEnviando(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("leads").insert({
          name: f.nome.trim(),
          email: f.email.trim().toLowerCase(),
          phone: digitos,
          investment_range: f.faixa,
          where_invests: f.onde,
          source: SOURCE,
          campaign: CAMPAIGN,
          utm_source: utm.utm_source ?? null,
          utm_medium: utm.utm_medium ?? null,
          utm_campaign: utm.utm_campaign ?? null,
          utm_content: utm.utm_content ?? null,
          landing_path: utm.landing_path,
          consent_lgpd: true,
          consent_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    } catch (err) {
      // Nunca bloqueia o download: o lead pode se perder, mas a pessoa recebe o manual.
      console.error("lead não gravado", err);
      toast({ title: "Não consegui registrar seu contato agora", description: "Seu manual está liberado mesmo assim." });
    } finally {
      setEnviando(false);
    }
    onSuccess(f.faixa, f.nome);
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5" id="formulario">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pe-nome" className="block text-[12px] text-white/55 mb-1.5">Como quer ser chamado?</label>
          <input id="pe-nome" className={campo} autoComplete="given-name" value={f.nome} onChange={(e) => set("nome", e.target.value)} maxLength={80} />
        </div>
        <div>
          <label htmlFor="pe-whats" className="block text-[12px] text-white/55 mb-1.5">WhatsApp (com DDD)</label>
          <input id="pe-whats" className={campo} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(62) 99999-9999" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="pe-email" className="block text-[12px] text-white/55 mb-1.5">Seu melhor e-mail</label>
        <input id="pe-email" className={campo} type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={254} />
      </div>

      <fieldset>
        <legend className="text-[12px] text-white/55 mb-2">Quanto você tem investido hoje?</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {FAIXAS.map((o) => (
            <Opcao key={o.value} ativo={f.faixa === o.value} onClick={() => set("faixa", o.value)}>{o.label}</Opcao>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[12px] text-white/55 mb-2">Onde está o seu dinheiro investido?</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          {ONDE_INVESTE.map((o) => (
            <Opcao key={o.value} ativo={f.onde === o.value} onClick={() => set("onde", o.value)}>{o.label}</Opcao>
          ))}
        </div>
      </fieldset>

      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} />

      <label htmlFor="pe-consent" className="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer">
        <input id="pe-consent" type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(42_85%_55%)]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
        <span>
          Autorizo a Saga Financeira a me enviar o manual e a entrar em contato por WhatsApp e e-mail sobre o meu pedido. Posso
          revogar quando quiser.
        </span>
      </label>

      {erro && <p role="alert" className="text-[13px] text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-semibold text-background rounded-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(38 78% 42%))` }}
      >
        {enviando ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enviando…</>) : "Quero o manual gratuito"}
      </button>
    </form>
  );
}
