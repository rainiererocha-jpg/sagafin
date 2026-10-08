import { motion } from "framer-motion";
import { Mail, Clock, Users, ArrowRight } from "lucide-react";
import { MarketDigestModal } from "@/components/MarketDigestModal";

const stats = [
  { icon: Users, label: "Leitores em todo o Brasil" },
  { icon: Clock, label: "Todos os dias úteis" },
  { icon: Mail, label: "Totalmente gratuito" },
];

export function MarketDigestBanner() {
  return (
    <section className="py-20 lg:py-24 bg-[hsl(0_0%_5.5%)] border-y border-white/[0.055] relative overflow-hidden">

      {/* Subtle gold glow — top left */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(42 85% 55% / 0.07) 0%, transparent 70%)" }}
      />

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">

            {/* Left — editorial content */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="h-px w-8"
                  style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }}
                />
                <span className="text-[10.5px] tracking-[0.26em] uppercase font-medium text-[hsl(42_85%_55%/0.62)]">
                  Diário Saga · Gratuito
                </span>
              </div>

              <h2
                className="font-serif font-light text-foreground mb-3 leading-tight"
                style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.6rem)" }}
              >
                Análise de mercado{" "}
                <em
                  className="not-italic font-semibold"
                  style={{
                    backgroundImage: "linear-gradient(135deg, hsl(42 85% 62%) 0%, hsl(38 78% 42%) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  todos os dias
                </em>{" "}
                antes das 9h.
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mb-7">
                Ibovespa, dólar, IPCA, oportunidades em renda fixa e variável e alertas de volatilidade —
                sintetizados para você tomar decisões com clareza, sem perder tempo.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-5">
                {stats.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[hsl(42_85%_55%/0.5)]" />
                    <span className="text-[12px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — CTA */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col items-start lg:items-end gap-3 shrink-0"
            >
              <MarketDigestModal>
                <button
                  className="group flex items-center gap-3 px-8 py-4 rounded-sm text-background text-[11px] tracking-[0.22em] uppercase font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                >
                  Quero Receber — É Grátis
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </button>
              </MarketDigestModal>
              <p className="text-[11px] text-muted-foreground/35 tracking-wide lg:text-right">
                Cancele quando quiser · Sem spam
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
