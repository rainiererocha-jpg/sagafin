import { Target, Lightbulb, TrendingUp, Crown } from "lucide-react";

const sagaSteps = [
  {
    number: "01",
    icon: Target,
    title: "Diagnóstico Preciso",
    description:
      "Identificamos onde você está e para onde deseja ir. Analisamos seu patrimônio, objetivos e tolerância ao risco.",
  },
  {
    number: "02",
    icon: Lightbulb,
    title: "Estratégia Sob Medida",
    description:
      "Desenvolvemos um plano personalizado que equilibra crescimento e proteção, alinhado ao seu perfil único.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Execução Disciplinada",
    description:
      "Implementamos a estratégia com acesso aos melhores produtos do mercado via plataforma XP Investimentos.",
  },
  {
    number: "04",
    icon: Crown,
    title: "Prosperidade Contínua",
    description:
      "Monitoramento constante e ajustes estratégicos para garantir que você alcance a liberdade financeira desejada.",
  },
];

export function SagaStorySection() {
  return (
    <section id="saga" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/3 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
            A Jornada
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            A Saga do Seu{" "}
            <span className="text-gradient-gold">Patrimônio</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma metodologia comprovada que transforma sonhos financeiros em 
            conquistas reais, passo a passo.
          </p>
        </div>

        {/* Story Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sagaSteps.map((step, index) => (
            <div
              key={step.number}
              className="group relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-gold/30 transition-all duration-500 hover:shadow-gold"
            >
              {/* Number Badge */}
              <div className="absolute -top-4 left-6">
                <span className="text-5xl font-serif font-bold text-gold/20 group-hover:text-gold/40 transition-colors">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="mt-6 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <step.icon className="w-6 h-6 text-gold" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Connection Line (except last) */}
              {index < sagaSteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-gold/30 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}