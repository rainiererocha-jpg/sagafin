import { useState } from "react";
import { X, ArrowRight, TrendingUp, CheckCircle2, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20me%20cadastrei%20no%20Di%C3%A1rio%20Saga%20e%20gostaria%20de%20uma%20assessoria%20personalizada.";

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

interface Props {
  children: React.ReactNode;
}

export function MarketDigestModal({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    patrimonio: "",
    objetivo: "",
  });
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setFormData({ name: "", email: "", patrimonio: "", objetivo: "" });
    }, 350);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      if (supabase) {
        await supabase.from("leads").insert({
          name: formData.name,
          email: formData.email,
          investment_range: formData.patrimonio,
          message: `Objetivo: ${formData.objetivo} | Canal: Diário Saga`,
          source: "newsletter",
        });
      }
    } catch {
      // silent fail — still show success
    } finally {
      setLoading(false);
      setStep(3);
    }
  };

  const progressWidth = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer", display: "contents" }}>
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={reset}
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
            />

            {/* Modal container */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto relative w-full max-w-[440px] bg-[hsl(0_0%_7%)] border border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)]">

                {/* Close button */}
                <button
                  onClick={reset}
                  aria-label="Fechar"
                  className="absolute top-4 right-4 p-1.5 text-white/25 hover:text-white/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Progress bar */}
                <div className="h-[3px] bg-white/[0.06]">
                  <motion.div
                    className="h-full"
                    style={{ background: "linear-gradient(to right, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                    initial={false}
                    animate={{ width: progressWidth }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>

                <div className="p-7 pt-6">
                  <AnimatePresence mode="wait">

                    {/* ── STEP 1 — Email capture ─────────────────── */}
                    {step === 1 && (
                      <motion.div
                        key="s1"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-3.5 h-3.5 text-gold" />
                          <span className="text-[10px] tracking-[0.24em] uppercase text-gold/65 font-medium">
                            Diário Saga · Mercado
                          </span>
                        </div>

                        <h2 className="font-serif text-[1.55rem] leading-snug text-foreground mb-2">
                          O mercado não para.<br />
                          <em className="not-italic" style={{ backgroundImage: "linear-gradient(135deg, hsl(42 85% 62%) 0%, hsl(38 78% 42%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            Você também não deveria.
                          </em>
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                          Análises diárias de Ibovespa, dólar, oportunidades em renda fixa e alertas de volatilidade — antes das 9h, direto no seu e-mail. Grátis.
                        </p>

                        <form onSubmit={handleStep1} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Seu nome"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-white/22 focus:outline-none focus:border-[hsl(42_85%_55%/0.45)] transition-colors"
                          />
                          <input
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-white/22 focus:outline-none focus:border-[hsl(42_85%_55%/0.45)] transition-colors"
                          />
                          <button
                            type="submit"
                            className="w-full py-3.5 rounded-lg text-background text-[11px] tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                          >
                            Quero Receber — É Grátis
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        <p className="text-[11px] text-center text-white/18 mt-4 tracking-wide">
                          Cancele quando quiser · Sem spam
                        </p>
                      </motion.div>
                    )}

                    {/* ── STEP 2 — Qualifier ─────────────────────── */}
                    {step === 2 && (
                      <motion.div
                        key="s2"
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="w-3.5 h-3.5 text-gold" />
                          <span className="text-[10px] tracking-[0.24em] uppercase text-gold/65 font-medium">
                            Personalize seu diário
                          </span>
                        </div>

                        <h2 className="font-serif text-[1.4rem] text-foreground mb-1.5">
                          Conte um pouco sobre você
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                          Assim personalizamos os alertas e análises para o seu perfil.
                        </p>

                        <div className="space-y-5">
                          <div>
                            <p className="text-[10.5px] tracking-[0.18em] uppercase text-white/32 font-medium mb-2.5">
                              Patrimônio estimado
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {patrimonioOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, patrimonio: opt.value })}
                                  className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all duration-150 text-left ${
                                    formData.patrimonio === opt.value
                                      ? "border-[hsl(42_85%_55%/0.6)] bg-[hsl(42_85%_55%/0.08)] text-[hsl(42_85%_62%)]"
                                      : "border-white/[0.08] bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white/70"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10.5px] tracking-[0.18em] uppercase text-white/32 font-medium mb-2.5">
                              Objetivo principal
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {objetivoOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, objetivo: opt.value })}
                                  className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all duration-150 text-left ${
                                    formData.objetivo === opt.value
                                      ? "border-[hsl(42_85%_55%/0.6)] bg-[hsl(42_85%_55%/0.08)] text-[hsl(42_85%_62%)]"
                                      : "border-white/[0.08] bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white/70"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleStep2}
                          disabled={loading || !formData.patrimonio || !formData.objetivo}
                          className="mt-6 w-full py-3.5 rounded-lg text-background text-[11px] tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-38 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                        >
                          {loading ? "Salvando..." : (
                            <>Personalizar Meu Diário <ArrowRight className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {/* ── STEP 3 — Success ───────────────────────── */}
                    {step === 3 && (
                      <motion.div
                        key="s3"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.28 }}
                        className="text-center py-2"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 240, delay: 0.1 }}
                          className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[hsl(42_85%_55%/0.2)] bg-[hsl(42_85%_55%/0.08)] mb-5"
                        >
                          <CheckCircle2 className="w-8 h-8 text-[hsl(42_85%_62%)]" />
                        </motion.div>

                        <h2 className="font-serif text-2xl text-foreground mb-2">
                          Você está dentro!
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[320px] mx-auto">
                          O <strong className="text-foreground/80">Diário Saga</strong> chegará na sua caixa de entrada amanhã cedo. Enquanto isso, quer uma análise personalizada da sua carteira?
                        </p>

                        <div className="space-y-3">
                          <a
                            href={WA_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={reset}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg text-background text-[10.5px] tracking-[0.18em] uppercase font-semibold hover:opacity-90 transition-opacity"
                            style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                          >
                            Falar com Rainiere — Assessoria Gratuita
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={reset}
                            className="w-full py-2.5 text-[11px] tracking-[0.16em] uppercase text-white/28 hover:text-white/48 transition-colors"
                          >
                            Não agora — vou aguardar o diário
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
