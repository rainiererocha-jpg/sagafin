import { Shield, TrendingUp, PiggyBank, LineChart, Building2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FadeInUp, SlideInLeft, SlideInRight, staggerItem, defaultTransition, defaultViewport } from "@/components/ui/motion";
import advisorImage from "@/assets/rainiere-assessor.jpg";

const services = [
  {
    icon: TrendingUp,
    title: "Renda Variável",
    description: "Ações, ETFs, BDRs e fundos imobiliários com análise fundamentalista e técnica para maximizar seus retornos."
  },
  {
    icon: PiggyBank,
    title: "Renda Fixa",
    description: "CDBs, LCIs, LCAs, Tesouro Direto e debêntures selecionados para o seu perfil de risco e objetivos."
  },
  {
    icon: Shield,
    title: "Previdência Privada",
    description: "PGBL e VGBL com as melhores taxas do mercado para seu planejamento de aposentadoria."
  },
  {
    icon: LineChart,
    title: "Derivativos & Opções",
    description: "Operações estruturadas, opções e proteção de carteira para investidores experientes."
  },
  {
    icon: Building2,
    title: "Consórcios & Crédito",
    description: "Consórcios imobiliários, automotivos e produtos de crédito com as melhores condições do mercado."
  },
  {
    icon: Users,
    title: "Planejamento Financeiro",
    description: "Planejamento sucessório, gestão patrimonial e estratégias personalizadas para pessoa física e jurídica."
  }
];

export function ServicesSection() {
  return (
    <section id="sobre" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
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
        </FadeInUp>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={defaultViewport}
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
              },
            },
          }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                variants={staggerItem}
                transition={{ duration: 0.6, ease: "easeOut" }}
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
              </motion.div>
            );
          })}
        </motion.div>

        {/* About Advisor */}
        <FadeInUp>
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <SlideInLeft>
                <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
                  Seu Assessor
                </span>
                <h3 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
                  Rainiere Rocha
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  A verdadeira assessoria de investimentos vai além da escolha de ativos; trata-se de arquitetar um plano de vida resiliente. Um bom especialista, atua na intersecção entre o gerenciamento de risco rigoroso e a busca por oportunidades em derivativos e produtos de crédito. Através da XP Investimentos, ofereço aos meus clientes uma análise de viabilidade honesta. Seja no planejamento financeiro pessoal ou na estruturação de garantias para o futuro, meu objetivo é transformar complexidade técnica em segurança e crescimento patrimonial sustentável.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <p className="text-2xl font-bold text-gold">100+</p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <p className="text-2xl font-bold text-gold">R$ 1M+</p>
                    <p className="text-xs text-muted-foreground">
                      Sob Assessoria
                    </p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-xl">
                    <p className="text-2xl font-bold text-gold">6+</p>
                    <p className="text-xs text-muted-foreground">
                      Anos de Mercado
                    </p>
                  </div>
                </div>
                <a href="https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20assessoria." target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="lg">
                  Agendar Assessoria Gratuita
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                </a>
              </SlideInLeft>
              <SlideInRight className="hidden md:flex justify-center">
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
              </SlideInRight>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
