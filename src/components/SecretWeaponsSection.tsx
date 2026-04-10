import { motion } from "framer-motion";
import { FadeInUp, defaultViewport } from "@/components/ui/motion";

const weapons = [
  {
    index: "01",
    title: "Mapeamento de Perfil",
    description:
      "Análise profunda do seu perfil de investidor: tolerância ao risco, horizonte, objetivos e situação patrimonial atual.",
  },
  {
    index: "02",
    title: "Estratégias Personalizadas",
    description:
      "Planos únicos desenvolvidos especificamente para seus objetivos, sem fórmulas genéricas ou portfólios padronizados.",
  },
  {
    index: "03",
    title: "Monitoramento Constante",
    description:
      "Acompanhamento ativo do mercado e ajustes em tempo real — você nunca fica para trás enquanto o cenário muda.",
  },
  {
    index: "04",
    title: "Diversificação Inteligente",
    description:
      "Distribuição otimizada entre classes de ativos para o máximo retorno ajustado ao risco no seu horizonte de investimento.",
  },
  {
    index: "05",
    title: "Análise Fundamentalista",
    description:
      "Seleção criteriosa de ativos baseada em fundamentos sólidos, não em hype ou rumores de mercado.",
  },
  {
    index: "06",
    title: "Educação Financeira",
    description:
      "Capacitação contínua para você tomar decisões cada vez mais autônomas e seguras ao longo da jornada.",
  },
];

export function SecretWeaponsSection() {
  return (
    <section className="py-28 lg:py-36 bg-secondary/20 relative overflow-hidden">

      {/* Decorative section number */}
      <span
        aria-hidden
        className="absolute -bottom-6 left-4 lg:left-12 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
      >
        03
      </span>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">

        {/* Header */}
        <FadeInUp className="mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-label">Diferenciais</span>
            </div>
            <h2 className="font-serif font-light text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              Armas Secretas do{" "}
              <em className="not-italic text-gradient-gold font-semibold">Assessor</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ferramentas e metodologias exclusivas que utilizamos para potencializar
              os resultados do seu patrimônio.
            </p>
          </div>
        </FadeInUp>

        {/* Two-column methodology list */}
        <div className="grid lg:grid-cols-2 gap-x-16 xl:gap-x-24">
          {/* Left column */}
          <div className="divide-y divide-white/[0.06]">
            {weapons.slice(0, 3).map((weapon, i) => (
              <motion.div
                key={weapon.index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={defaultViewport}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group py-7 hover:bg-white/[0.015] transition-colors duration-200 px-2 -mx-2"
              >
                <div className="flex items-start gap-5">
                  <span className="font-serif font-bold text-white/18 group-hover:text-gold/28 transition-colors duration-300 shrink-0 leading-none mt-0.5 text-2xl">
                    {weapon.index}
                  </span>
                  <div>
                    <h4 className="font-sans font-semibold text-foreground/85 text-[15px] mb-2 group-hover:text-foreground transition-colors duration-200">
                      {weapon.title}
                    </h4>
                    <p className="text-muted-foreground text-[13px] leading-relaxed">
                      {weapon.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right column */}
          <div className="divide-y divide-white/[0.06]">
            {weapons.slice(3, 6).map((weapon, i) => (
              <motion.div
                key={weapon.index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={defaultViewport}
                transition={{ duration: 0.6, delay: i * 0.1 + 0.15 }}
                className="group py-7 hover:bg-white/[0.015] transition-colors duration-200 px-2 -mx-2"
              >
                <div className="flex items-start gap-5">
                  <span className="font-serif font-bold text-white/18 group-hover:text-gold/28 transition-colors duration-300 shrink-0 leading-none mt-0.5 text-2xl">
                    {weapon.index}
                  </span>
                  <div>
                    <h4 className="font-sans font-semibold text-foreground/85 text-[15px] mb-2 group-hover:text-foreground transition-colors duration-200">
                      {weapon.title}
                    </h4>
                    <p className="text-muted-foreground text-[13px] leading-relaxed">
                      {weapon.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
