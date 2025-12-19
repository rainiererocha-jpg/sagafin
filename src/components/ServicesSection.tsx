import {
  Shield,
  TrendingUp,
  PiggyBank,
  LineChart,
  Building2,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: TrendingUp,
    title: "Renda Variável",
    description:
      "Ações, ETFs, BDRs e fundos imobiliários com análise fundamentalista e técnica para maximizar seus retornos.",
  },
  {
    icon: PiggyBank,
    title: "Renda Fixa",
    description:
      "CDBs, LCIs, LCAs, Tesouro Direto e debêntures selecionados para o seu perfil de risco e objetivos.",
  },
  {
    icon: Shield,
    title: "Previdência Privada",
    description:
      "PGBL e VGBL com as melhores taxas do mercado para seu planejamento de aposentadoria.",
  },
  {
    icon: LineChart,
    title: "Derivativos",
    description:
      "Operações estruturadas, opções e proteção de carteira para investidores experientes.",
  },
  {
    icon: Building2,
    title: "Planejamento Sucessório",
    description:
      "Holdings familiares e estruturação patrimonial para transmissão eficiente de bens.",
  },
  {
    icon: Users,
    title: "Assessoria Empresarial",
    description:
      "Gestão de caixa, aplicações de curto prazo e estratégias para pessoa jurídica.",
  },
];

export function ServicesSection() {
  return (
    <section id="sobre" className="py-20 bg-ice-blue">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-gold font-semibold text-sm tracking-wider uppercase mb-3">
            Nossos Serviços
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Soluções completas para{" "}
            <span className="text-gradient-gold">seu patrimônio</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Com acesso à maior plataforma de investimentos da América Latina,
            oferecemos mais de 800 produtos para construir sua estratégia ideal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group bg-card rounded-xl p-6 shadow-card border border-border/50 hover:shadow-elevated hover:border-gold/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* About Advisor */}
        <div className="bg-gradient-navy rounded-2xl p-8 md:p-12 shadow-elevated">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block text-gold font-semibold text-sm tracking-wider uppercase mb-3">
                Seu Assessor
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Rainiere Rocha
              </h3>
              <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                Com mais de 10 anos de experiência no mercado financeiro e
                certificações CPA-20 e CEA, ajudo investidores a alcançarem seus
                objetivos através de estratégias personalizadas e acesso aos
                melhores produtos da XP Investimentos.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold">500+</p>
                  <p className="text-xs text-primary-foreground/60">Clientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold">R$ 200M+</p>
                  <p className="text-xs text-primary-foreground/60">
                    Sob Assessoria
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold">10+</p>
                  <p className="text-xs text-primary-foreground/60">
                    Anos de Mercado
                  </p>
                </div>
              </div>
              <Button variant="gold" size="lg">
                Agendar Consultoria Gratuita
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-gold/20 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full bg-navy-medium flex items-center justify-center text-6xl font-bold text-gold">
                  RR
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
