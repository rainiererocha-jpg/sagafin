import { ArrowDown, Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/rainiere-hero.jpg";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20assessoria.";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex overflow-hidden bg-background">

      {/* Mobile: photo as full-bleed background */}
      <div className="absolute inset-0 lg:hidden">
        <img
          src={heroImage}
          alt="Rainiere Rocha"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/88 to-background/50" />
      </div>

      {/* Desktop: right photo panel (58% width) */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:block absolute right-0 inset-y-0 w-[58%] overflow-hidden"
      >
        <img
          src={heroImage}
          alt="Rainiere Rocha — Assessor de Investimentos XP"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Left-side gradient bleeding into content panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/25 to-transparent" />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-transparent" />
        {/* Warm gold tint on highlights */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 40%, hsl(42 85% 55% / 0.05) 100%)" }}
        />
        {/* XP credential badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="absolute bottom-14 right-14"
        >
          <div className="bg-background/72 backdrop-blur-md border border-white/10 rounded-md px-5 py-3.5 shadow-elevated">
            <p className="text-gold text-[13px] font-semibold tracking-wide leading-tight">
              Credenciado XP Investimentos
            </p>
            <p className="text-white/35 text-[11px] tracking-widest uppercase mt-1">
              Assessoria Personalizada
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Content panel — left 44% on desktop, full width on mobile */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:w-[44%] px-6 sm:px-10 lg:px-14 xl:px-20 min-h-screen py-36 lg:py-0">

        {/* Origin label */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center gap-3 mb-10"
        >
          <div
            className="h-px w-8 shrink-0"
            style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }}
          />
          <span className="text-label">
            XP Investimentos · Goiânia, Brasil
          </span>
        </motion.div>

        {/* Name — typographic centrepiece */}
        <div className="relative mb-8">
          {/* Ghost monogram behind */}
          <span
            aria-hidden
            className="absolute -top-10 -left-5 font-serif font-bold leading-none select-none pointer-events-none text-white/[0.022]"
            style={{ fontSize: "clamp(8rem, 16vw, 14rem)" }}
          >
            RR
          </span>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-light text-foreground leading-[0.86] uppercase tracking-[0.05em]"
            style={{ fontSize: "clamp(3.6rem, 7.2vw, 7.8rem)" }}
          >
            Rainiere
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-bold text-foreground leading-[0.86] uppercase tracking-[0.02em]"
            style={{ fontSize: "clamp(3.6rem, 7.2vw, 7.8rem)" }}
          >
            Rocha
          </motion.h1>
        </div>

        {/* Gold rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.66, ease: [0.22, 1, 0.36, 1] }}
          className="origin-left mb-6"
          style={{
            height: "1px",
            width: "68%",
            background: "linear-gradient(to right, hsl(42 85% 55%), hsl(42 85% 55% / 0.25), transparent)",
          }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.78 }}
          className="font-serif italic text-gold mb-5"
          style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)" }}
        >
          Assessor de Investimentos
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.88 }}
          className="text-muted-foreground leading-relaxed max-w-[360px] mb-11"
          style={{ fontSize: "clamp(0.82rem, 1.1vw, 0.9rem)" }}
        >
          Assessoria personalizada com estratégia, tecnologia e visão de longo
          prazo. Proteja e multiplique seu patrimônio com quem entende do mercado.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.02 }}
          className="flex flex-col sm:flex-row gap-3 mb-14"
        >
          <a href={WA_URL} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-background text-[11.5px] tracking-[0.16em] uppercase font-semibold hover:bg-gold/90 transition-colors duration-200 w-full sm:w-auto">
              <Phone className="w-3.5 h-3.5" />
              Agendar Assessoria
            </button>
          </a>
          <a href="#saga">
            <button className="flex items-center justify-center gap-2 px-7 py-3.5 border border-white/12 text-foreground/55 text-[11.5px] tracking-[0.16em] uppercase font-medium hover:text-foreground/85 hover:border-white/22 transition-all duration-200 w-full sm:w-auto">
              Conhecer a Metodologia
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.18 }}
          className="flex items-start gap-8 pt-8 border-t border-white/[0.07]"
        >
          {[
            { value: "100+", label: "Clientes Ativos" },
            { value: "R$ 1M+", label: "Sob Assessoria" },
            { value: "6+", label: "Anos de Mercado" },
          ].map((stat, i) => (
            <div key={i} className={i > 0 ? "border-l border-white/10 pl-8" : ""}>
              <p className="font-serif font-bold text-foreground" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}>
                {stat.value}
              </p>
              <p className="text-[10.5px] text-muted-foreground/60 tracking-[0.18em] uppercase mt-1 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="absolute bottom-8 left-6 sm:left-10 lg:left-14 xl:left-20"
        >
          <a
            href="#saga"
            className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-muted-foreground/30 hover:text-gold transition-colors duration-200"
          >
            <ArrowDown className="w-3 h-3 animate-bounce" />
            Descobrir
          </a>
        </motion.div>
      </div>
    </section>
  );
}
