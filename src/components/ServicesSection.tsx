import { motion } from "framer-motion";
import { FadeInUp, defaultViewport } from "@/components/ui/motion";
import advisorImage from "@/assets/rainiere-assessor.jpg";
import { ArrowRight } from "lucide-react";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20assessoria.";

const services = [
  {
    code: "01",
    title: "Renda Variável",
    description:
      "Ações, ETFs, BDRs e fundos imobiliários com análise fundamentalista e técnica para maximizar retornos.",
  },
  {
    code: "02",
    title: "Renda Fixa",
    description:
      "CDBs, LCIs, LCAs, Tesouro Direto e debêntures selecionados para seu perfil de risco e objetivos.",
  },
  {
    code: "03",
    title: "Previdência Privada",
    description:
      "PGBL e VGBL com as melhores taxas do mercado para seu planejamento de aposentadoria.",
  },
  {
    code: "04",
    title: "Derivativos & Opções",
    description:
      "Operações estruturadas, opções e proteção de carteira para investidores experientes.",
  },
  {
    code: "05",
    title: "Consórcios & Crédito",
    description:
      "Consórcios imobiliários, automotivos e produtos de crédito com as melhores condições do mercado.",
  },
  {
    code: "06",
    title: "Planejamento Financeiro",
    description:
      "Planejamento sucessório, gestão patrimonial e estratégias personalizadas para pessoa física e jurídica.",
  },
];

export function ServicesSection() {
  return (
    <section id="sobre" className="bg-background relative overflow-hidden">

      {/* ── Assessor Bio — full editorial split-panel ──────────────── */}
      <div className="relative min-h-[80vh] flex overflow-hidden">

        {/* Mobile: photo as full-bleed background */}
        <div className="absolute inset-0 lg:hidden">
          <img
            src={advisorImage}
            alt="Rainiere Rocha"
            className="w-full h-full object-cover object-[center_top]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/55" />
        </div>

        {/* Desktop: photo panel — right 52% */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden lg:block absolute right-0 inset-y-0 w-[52%] overflow-hidden"
        >
          <img
            src={advisorImage}
            alt="Rainiere Rocha — Assessor de Investimentos XP"
            className="w-full h-full object-cover object-[center_20%]"
            loading="lazy"
          />
          {/* Left gradient — blends into content panel */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          {/* Warm gold tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, transparent 45%, hsl(42 85% 55% / 0.04) 100%)" }}
          />

          {/* Credential badge — bottom left of photo */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="absolute bottom-12 right-12"
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

        {/* Content panel — left 50% */}
        <div className="relative z-10 flex flex-col justify-center w-full lg:w-[50%] px-6 sm:px-10 lg:px-14 xl:px-20 py-24 lg:py-20">

          {/* Decorative section number */}
          <span
            aria-hidden
            className="absolute -top-6 left-4 lg:left-8 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(8rem, 14vw, 14rem)" }}
          >
            04
          </span>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-px w-10 shrink-0"
                style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }}
              />
              <span className="text-label">Seu Assessor</span>
            </div>

            <h2
              className="font-serif font-light text-foreground mb-2 leading-[0.88] uppercase tracking-[0.04em]"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
            >
              Rainiere
            </h2>
            <h2
              className="font-serif font-bold text-foreground mb-6 leading-[0.88] uppercase tracking-[0.02em]"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
            >
              Rocha
            </h2>

            {/* Gold rule */}
            <div
              className="mb-6"
              style={{
                height: "1px",
                width: "60%",
                background: "linear-gradient(to right, hsl(42 85% 55%), hsl(42 85% 55% / 0.2), transparent)",
              }}
            />

            <p className="font-serif italic text-gold mb-5" style={{ fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}>
              Assessor de Investimentos
            </p>

            <p className="text-muted-foreground text-sm leading-relaxed max-w-[380px] mb-10">
              Credenciado à XP Investimentos, especializado em assessoria personalizada,
              consórcios, crédito, derivativos, planejamento patrimonial e gestão de risco.
              Atendo clientes em Goiânia e em todo o Brasil com acompanhamento individualizado
              e estratégias sob medida.
            </p>

            {/* Stats */}
            <div className="flex items-start gap-8 mb-10 pt-6 border-t border-white/[0.07]">
              {[
                { value: "100+", label: "Clientes Ativos" },
                { value: "R$ 1M+", label: "Sob Assessoria" },
                { value: "6+", label: "Anos de Mercado" },
              ].map((stat, i) => (
                <div key={i} className={i > 0 ? "border-l border-white/10 pl-8" : ""}>
                  <p
                    className="font-serif font-bold text-foreground"
                    style={{ fontSize: "clamp(1.35rem, 2.2vw, 1.8rem)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground/55 tracking-[0.18em] uppercase mt-1 font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 px-7 py-3.5 bg-gold text-background text-[11.5px] tracking-[0.16em] uppercase font-semibold hover:bg-gold/88 transition-colors duration-200">
                Agendar Assessoria Gratuita
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </a>
          </motion.div>
        </div>
      </div>

      {/* ── Services Grid ───────────────────────────────────────────── */}
      <div className="py-20 lg:py-24 bg-secondary/10 relative">
        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          <FadeInUp delay={0.1} className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-px w-10"
                style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }}
              />
              <span className="text-label">Soluções Completas</span>
            </div>
            <h3
              className="font-serif font-light text-foreground"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
            >
              800+ produtos via{" "}
              <em className="not-italic text-gradient-gold font-semibold">XP Investimentos</em>
            </h3>
          </FadeInUp>

          {/* Services index — editorial grid */}
          <div className="editorial-rule mb-0" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y divide-white/[0.06] sm:divide-y-0">
            {services.map((service, i) => (
              <motion.div
                key={service.code}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={defaultViewport}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                className={`group py-7 px-3 hover:bg-white/[0.02] transition-colors duration-200
                  ${i % 3 !== 2 ? "lg:border-r border-white/[0.06]" : ""}
                  ${i % 2 === 0 ? "sm:border-r lg:border-r-0 border-white/[0.06]" : ""}
                  ${i < 3 ? "lg:border-b border-white/[0.06]" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  <span className="font-serif font-bold text-white/16 group-hover:text-gold/25 transition-colors duration-300 text-xl shrink-0 leading-none mt-0.5">
                    {service.code}
                  </span>
                  <div>
                    <h4 className="font-sans font-semibold text-foreground/82 text-[14.5px] mb-1.5 group-hover:text-foreground transition-colors duration-200">
                      {service.title}
                    </h4>
                    <p className="text-muted-foreground text-[12.5px] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="editorial-rule mt-0" />
        </div>
      </div>
    </section>
  );
}
