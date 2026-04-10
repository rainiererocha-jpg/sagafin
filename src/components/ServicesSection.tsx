import { motion } from "framer-motion";
import { FadeInUp, SlideInLeft, SlideInRight, defaultViewport } from "@/components/ui/motion";
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
    <section id="sobre" className="py-28 lg:py-36 bg-background relative overflow-hidden">

      {/* Decorative section number */}
      <span
        aria-hidden
        className="absolute -top-6 right-6 lg:right-16 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
      >
        04
      </span>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">

        {/* Assessor bio — feature card */}
        <FadeInUp className="mb-20">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center py-12 px-0 border-y border-white/[0.06]">
            <SlideInLeft>
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
                <span className="text-label">Seu Assessor</span>
              </div>
              <h2
                className="font-serif font-semibold text-foreground mb-4 leading-tight"
                style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)" }}
              >
                Rainiere Rocha
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mb-8">
                Assessor credenciado à XP Investimentos, especializado em assessoria personalizada,
                consórcios, crédito, derivativos, planejamento patrimonial e gestão de risco.
                Atendo clientes em Goiânia e em todo o Brasil com acompanhamento individualizado,
                análise honesta e estratégias sob medida para cada perfil e momento de vida.
              </p>
              <div className="flex items-center gap-10 mb-8">
                {[
                  { v: "100+", l: "Clientes" },
                  { v: "R$ 1M+", l: "Sob Assessoria" },
                  { v: "6+", l: "Anos de Mercado" },
                ].map((s, i) => (
                  <div key={i} className={i > 0 ? "border-l border-white/10 pl-10" : ""}>
                    <p className="font-serif font-bold text-foreground text-2xl">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground/55 tracking-widest uppercase mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-2 px-7 py-3.5 bg-gold text-background text-[11.5px] tracking-[0.16em] uppercase font-semibold hover:bg-gold/88 transition-colors duration-200">
                  Agendar Assessoria Gratuita
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </a>
            </SlideInLeft>

            <SlideInRight delay={0.15} className="hidden lg:block">
              <div className="relative w-52 h-52 shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-2xl scale-110"
                  style={{ background: "radial-gradient(circle, hsl(42 85% 55% / 0.12), transparent 70%)" }}
                />
                <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10">
                  <img
                    src={advisorImage}
                    alt="Rainiere Rocha"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
                </div>
              </div>
            </SlideInRight>
          </div>
        </FadeInUp>

        {/* Services index */}
        <FadeInUp delay={0.1} className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
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

        {/* Services grid — editorial index style */}
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
    </section>
  );
}
