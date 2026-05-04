import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, BarChart3, Loader2, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle2, Target, Lightbulb
} from "lucide-react";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20fiz%20o%20diagn%C3%B3stico%20de%20carteira%20com%20IA%20e%20gostaria%20de%20implementar%20as%20sugest%C3%B5es.";

const perfilOptions = [
  { value: "Conservador", label: "Conservador", desc: "Segurança em primeiro lugar" },
  { value: "Moderado", label: "Moderado", desc: "Equilíbrio entre risco e retorno" },
  { value: "Arrojado", label: "Arrojado", desc: "Foco em crescimento máximo" },
];

const horizonteOptions = [
  { value: "até 2 anos", label: "Até 2 anos" },
  { value: "2 a 5 anos", label: "2 a 5 anos" },
  { value: "5 a 10 anos", label: "5 a 10 anos" },
  { value: "mais de 10 anos", label: "Mais de 10 anos" },
];

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

const carteiraPlaceholder = `Exemplos:
- Poupança: R$ 20.000
- CDB Banco do Brasil 110% CDI: R$ 50.000
- Tesouro Selic 2027: R$ 30.000
- PETR4: R$ 15.000
- Fundos de ações: R$ 25.000

Ou simplesmente descreva: "Tenho tudo na poupança e alguns CDBs do banco"`;

function OptionCard({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? "border-[hsl(42_85%_55%/0.65)] bg-[hsl(42_85%_55%/0.07)] text-[hsl(42_85%_62%)]"
          : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white/80"
      }`}
    >
      <p className="font-medium text-[14px]">{label}</p>
      {desc && <p className="text-[12px] mt-0.5 opacity-70">{desc}</p>}
    </button>
  );
}

export default function DiagnosticoPage() {
  const [step, setStep] = useState(1);
  const [perfil, setPerfil] = useState("");
  const [horizonte, setHorizonte] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [carteira, setCarteira] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");

  const canAdvance1 = perfil && horizonte && patrimonio && objetivo;
  const canAdvance2 = carteira.trim().length > 10;

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, horizonte, patrimonio, objetivo, carteira }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro na análise");
      setAnalysis(data.analysis);
      setStep(3);
    } catch (e: any) {
      setError("Não foi possível gerar a análise. Tente novamente ou fale com Rainiere diretamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[38px] bg-black/60 backdrop-blur-sm border-b border-white/[0.06]" />
      </div>
      <div className="pt-[38px]">
        <Header />
      </div>

      {/* Hero */}
      <section className="pt-36 pb-16 bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full pointer-events-none opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(42 85% 55%), transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div className="container mx-auto px-6 lg:px-10 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-[10.5px] tracking-[0.26em] uppercase font-medium text-[hsl(42_85%_55%/0.65)]">
                Ferramenta IA · Gratuito
              </span>
            </div>
            <h1
              className="font-serif font-light text-foreground mb-4 leading-tight"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}
            >
              Diagnóstico Inteligente{" "}
              <em
                className="not-italic font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg, hsl(42 85% 62%) 0%, hsl(38 78% 42%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                da Sua Carteira
              </em>
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-xl">
              Em 3 minutos, nossa IA analisa sua carteira, identifica riscos e aponta oportunidades
              específicas para o seu perfil — o mesmo processo que um assessor XP faz em uma reunião.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tool */}
      <section className="pb-32 bg-background">
        <div className="container mx-auto px-6 lg:px-10 max-w-3xl">

          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center gap-3 mb-10">
              {["Seu Perfil", "Sua Carteira", "Análise IA"].map((label, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                          done
                            ? "bg-[hsl(42_85%_55%)] text-background"
                            : active
                            ? "border-2 border-[hsl(42_85%_55%)] text-[hsl(42_85%_62%)]"
                            : "border border-white/15 text-white/25"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
                      </div>
                      <span
                        className={`text-[11.5px] font-medium tracking-wide hidden sm:block ${
                          active ? "text-foreground/80" : done ? "text-[hsl(42_85%_55%)]" : "text-white/25"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className="flex-1 h-px"
                        style={{
                          background: done
                            ? "hsl(42 85% 55% / 0.5)"
                            : "hsl(0 0% 100% / 0.07)",
                          width: "40px",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Perfil ───────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-7 space-y-7">

                  <div>
                    <p className="text-[10.5px] tracking-[0.2em] uppercase text-white/35 font-medium mb-3">
                      Perfil de risco
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {perfilOptions.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={perfil === opt.value}
                          onClick={() => setPerfil(opt.value)}
                          label={opt.label}
                          desc={opt.desc}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10.5px] tracking-[0.2em] uppercase text-white/35 font-medium mb-3">
                      Horizonte de investimento
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {horizonteOptions.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={horizonte === opt.value}
                          onClick={() => setHorizonte(opt.value)}
                          label={opt.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10.5px] tracking-[0.2em] uppercase text-white/35 font-medium mb-3">
                      Patrimônio estimado
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {patrimonioOptions.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={patrimonio === opt.value}
                          onClick={() => setPatrimonio(opt.value)}
                          label={opt.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10.5px] tracking-[0.2em] uppercase text-white/35 font-medium mb-3">
                      Objetivo principal
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {objetivoOptions.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={objetivo === opt.value}
                          onClick={() => setObjetivo(opt.value)}
                          label={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAdvance1}
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-lg text-background text-[11.5px] tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                >
                  Próximo — Informar Carteira
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Carteira ─────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-7">
                  <h2 className="font-serif text-xl text-foreground mb-2">
                    Como está sua carteira hoje?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Liste seus investimentos — tipo, instituição e valor aproximado. Não precisa ser exato.
                    Quanto mais detalhes, mais precisa é a análise.
                  </p>
                  <textarea
                    value={carteira}
                    onChange={(e) => setCarteira(e.target.value)}
                    placeholder={carteiraPlaceholder}
                    rows={10}
                    className="w-full bg-white/[0.03] border border-white/[0.09] rounded-xl px-5 py-4 text-sm text-foreground placeholder:text-white/20 focus:outline-none focus:border-[hsl(42_85%_55%/0.4)] transition-colors resize-none font-mono leading-relaxed"
                  />
                  <div className="mt-3 flex items-center gap-2 text-[11.5px] text-white/30">
                    <Sparkles className="w-3 h-3 text-[hsl(42_85%_55%/0.5)]" />
                    <span>Suas informações são confidenciais e usadas apenas para gerar a análise.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 border border-white/10 text-white/40 hover:text-white/65 text-[11.5px] tracking-[0.18em] uppercase rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                  <button
                    disabled={!canAdvance2 || loading}
                    onClick={handleAnalyze}
                    className="flex-1 py-3.5 rounded-lg text-background text-[11.5px] tracking-[0.2em] uppercase font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Gerar Diagnóstico Inteligente
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300/80">{error}</p>
                  </div>
                )}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-white/[0.03] border border-white/[0.07] rounded-full">
                      <Loader2 className="w-4 h-4 animate-spin text-[hsl(42_85%_55%)]" />
                      <span className="text-sm text-muted-foreground">
                        Processando sua carteira com IA Claude...
                      </span>
                    </div>
                    <div className="mt-4 flex justify-center gap-6 text-[12px] text-white/25">
                      {["Identificando concentrações...", "Calculando risco...", "Mapeando oportunidades..."].map((t, i) => (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.8, 0] }}
                          transition={{ delay: i * 1.5, duration: 1.5, repeat: Infinity, repeatDelay: 4.5 - i * 1.5 }}
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Result ───────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Result header */}
                <div className="flex items-start gap-4 p-6 bg-[hsl(42_85%_55%/0.06)] border border-[hsl(42_85%_55%/0.18)] rounded-2xl">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(42_85%_55%/0.15)] border border-[hsl(42_85%_55%/0.25)] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[hsl(42_85%_62%)]" />
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.2em] uppercase text-[hsl(42_85%_55%/0.65)] font-medium mb-1">
                      Diagnóstico Gerado por IA · Rainiere Rocha · XP Investimentos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Análise baseada no seu perfil <strong className="text-foreground/70">{perfil}</strong> com horizonte de <strong className="text-foreground/70">{horizonte}</strong>
                    </p>
                  </div>
                </div>

                {/* Analysis content */}
                <div
                  className="post-content bg-white/[0.018] border border-white/[0.06] rounded-2xl p-7 lg:p-10"
                  dangerouslySetInnerHTML={{ __html: analysis }}
                />

                {/* CTA */}
                <div className="p-8 bg-card/40 rounded-2xl border border-[hsl(42_85%_55%/0.15)] text-center">
                  <p className="text-[11px] tracking-[0.24em] uppercase text-[hsl(42_85%_55%/0.65)] font-medium mb-3">
                    Próximo Passo
                  </p>
                  <h3 className="font-serif text-2xl text-foreground mb-3">
                    Pronto para implementar?
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto leading-relaxed">
                    Essa análise é o ponto de partida. Em uma reunião com Rainiere,
                    você sai com um plano de ação completo — produtos específicos, prazos e valores.
                  </p>
                  <a href={WA_URL} target="_blank" rel="noopener noreferrer">
                    <button
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-background text-[11px] tracking-[0.2em] uppercase font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                    >
                      Implementar com Rainiere — Assessoria Gratuita
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </a>
                  <button
                    onClick={() => { setStep(1); setAnalysis(""); setPerfil(""); setHorizonte(""); setPatrimonio(""); setObjetivo(""); setCarteira(""); }}
                    className="block mx-auto mt-4 text-[11.5px] tracking-wide text-white/25 hover:text-white/45 transition-colors"
                  >
                    Fazer nova análise
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-[11.5px] text-white/20 text-center leading-relaxed">
                  Este diagnóstico é gerado automaticamente por IA e tem caráter educacional.
                  Não constitui recomendação de investimento. Para decisões financeiras, consulte um assessor habilitado.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
