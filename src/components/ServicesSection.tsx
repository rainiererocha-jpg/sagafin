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
import advisorImage from "@/assets/rainiere-assessor.jpg";

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
    <section id="sobre" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
            Nossos Serviços
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            Soluções completas para{" "}
            <span className="text-gradient-gold">seu patrimônio</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Com acesso à maior plataforma de investimentos da América Latina,
            oferecemos mais de 800 produtos para construir sua estratégia ideal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-gold"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
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
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
                Seu Assessor
              </span>
              <h3 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
                Rainiere Rocha
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Com mais de 10 anos de experiência no mercado financeiro e
                certificações CPA-20 e CEA, ajudo investidores a alcançarem seus
                objetivos através de estratégias personalizadas e acesso aos
                melhores produtos da XP Investimentos.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-2xl font-bold text-gold">500+</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-2xl font-bold text-gold">R$ 200M+</p>
                  <p className="text-xs text-muted-foreground">
                    Sob Assessoria
                  </p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <p className="text-2xl font-bold text-gold">10+</p>
                  <p className="text-xs text-muted-foreground">
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
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-gold/20 via-gold/5 to-transparent rounded-full blur-xl" />
                <div className="relative w-full h-full rounded-full bg-secondary flex items-center justify-center border border-gold/20 overflow-hidden">
                  <img
                    src={advisorImage}
                    alt="Rainiere Rocha - Assessor de Investimentos"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}