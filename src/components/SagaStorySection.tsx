import { motion } from "framer-motion";
import { FadeInUp, defaultViewport } from "@/components/ui/motion";

const sagaSteps = [
  {
    number: "01",
    title: "Diagnóstico Preciso",
    description:
      "Identificamos onde você está e para onde deseja ir. Analisamos seu patrimônio, objetivos e tolerância ao risco com profundidade cirúrgica.",
  },
  {
    number: "02",
    title: "Estratégia Sob Medida",
    description:
      "Desenvolvemos um plano personalizado que equilibra crescimento e proteção, alinhado ao seu perfil único e horizonte de tempo.",
  },
  {
    number: "03",
    title: "Execução Disciplinada",
    description:
      "Implementamos a estratégia com acesso ao maior universo de produtos do mercado via plataforma XP Investimentos.",
  },
  {
    number: "04",
    title: "Prosperidade Contínua",
    description:
      "Monitoramento ativo e ajustes estratégicos garantem que seu patrimônio avance em direção à liberdade financeira real.",
  },
];

export function SagaStorySection() {
  return (
    <section id="saga" className="py-28 lg:py-36 bg-background relative overflow-hidden">

      {/* Decorative section number */}
      <span
        aria-hidden
        className="absolute -top-8 right-8 lg:right-16 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
      >
        02
      </span>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">

        {/* Section header */}
        <FadeInUp className="mb-16 lg:mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
            <span className="text-label">A Jornada</span>
          </div>
          <h2 className="font-serif font-light text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            A Saga do Seu{" "}
            <em className="not-italic text-gradient-gold font-semibold">Patrimônio</em>
          </h2>
          <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
            Transformamos sonhos financeiros em conquistas reais, passo a passo,
            com método e disciplina.
          </p>
        </FadeInUp>

        {/* Top gold rule */}
        <div className="editorial-rule mb-0" />

        {/* Steps */}
        <div className="divide-y divide-white/[0.06]">
          {sagaSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={defaultViewport}
              transition={{ duration: 0.65, delay: index * 0.1, ease: "easeOut" }}
              className="group grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_2fr] gap-x-8 lg:gap-x-16 items-start py-8 lg:py-10 hover:bg-white/[0.015] transition-colors duration-300 px-2 -mx-2"
            >
              {/* Step number — decorative large numeral */}
              <div className="pt-0.5">
                <span
                  className="font-serif font-bold text-white/20 group-hover:text-gold/30 transition-colors duration-400 leading-none block"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
                >
                  {step.number}
                </span>
              </div>

              {/* Title (always visible, aligns with number) */}
              <div className="flex flex-col justify-center">
                <h3
                  className="font-serif font-semibold text-foreground/90 group-hover:text-foreground transition-colors duration-200 leading-tight"
                  style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.65rem)" }}
                >
                  {step.title}
                </h3>
                {/* Description on mobile shows here */}
                <p className="lg:hidden text-muted-foreground text-sm leading-relaxed mt-2">
                  {step.description}
                </p>
              </div>

              {/* Description on desktop — third column */}
              <p className="hidden lg:block text-muted-foreground text-sm leading-relaxed self-center">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom gold rule */}
        <div className="editorial-rule mt-0" />
      </div>
    </section>
  );
}
