import { 
  UserCheck, 
  Settings, 
  Eye, 
  PieChart, 
  BarChart3, 
  BookOpen 
} from "lucide-react";

const weapons = [
  {
    icon: UserCheck,
    title: "Mapeamento de Perfil",
    description: "Análise profunda do seu perfil de investidor para decisões precisas.",
  },
  {
    icon: Settings,
    title: "Estratégias Personalizadas",
    description: "Planos únicos desenvolvidos especificamente para seus objetivos.",
  },
  {
    icon: Eye,
    title: "Monitoramento Constante",
    description: "Acompanhamento ativo do mercado e ajustes em tempo real.",
  },
  {
    icon: PieChart,
    title: "Diversificação Inteligente",
    description: "Distribuição otimizada entre classes de ativos para máximo retorno.",
  },
  {
    icon: BarChart3,
    title: "Análise Fundamentalista",
    description: "Seleção criteriosa de ativos baseada em fundamentos sólidos.",
  },
  {
    icon: BookOpen,
    title: "Educação Financeira",
    description: "Capacitação contínua para você tomar decisões cada vez melhores.",
  },
];

export function SecretWeaponsSection() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--gold)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
            Diferenciais
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            Armas Secretas do{" "}
            <span className="text-gradient-gold">Assessor</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            As ferramentas e metodologias exclusivas que utilizamos para 
            potencializar os resultados do seu patrimônio.
          </p>
        </div>

        {/* Weapons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {weapons.map((weapon, index) => (
            <div
              key={index}
              className="group flex items-start gap-4 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-gold"
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all">
                <weapon.icon className="w-7 h-7 text-gold" />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
                  {weapon.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {weapon.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}