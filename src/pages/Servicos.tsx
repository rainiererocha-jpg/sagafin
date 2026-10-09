import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MesalvaBanner } from "@/components/MesalvaBanner";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, PiggyBank, LineChart, Building2, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const WA_URL = "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os.";

const services = [
  {
    icon: TrendingUp,
    title: "Assessoria de Investimentos",
    description: "Gestão personalizada da sua carteira com acesso a mais de 800 produtos: ações, ETFs, BDRs, FIIs e muito mais via plataforma XP Investimentos.",
    items: ["Análise fundamentalista e técnica", "Carteira diversificada por perfil", "Acompanhamento mensal", "Relatórios de performance"],
  },
  {
    icon: PiggyBank,
    title: "Renda Fixa",
    description: "CDBs, LCIs, LCAs, Tesouro Direto e debêntures selecionados para o seu perfil de risco, com as melhores taxas do mercado.",
    items: ["Tesouro Direto (Selic, IPCA+, Prefixado)", "CDBs com liquidez diária", "LCIs e LCAs isentas de IR", "Debêntures incentivadas"],
  },
  {
    icon: Shield,
    title: "Previdência Privada",
    description: "PGBL e VGBL com as melhores taxas do mercado para seu planejamento de aposentadoria, com benefícios fiscais reais.",
    items: ["PGBL com dedução de IR", "VGBL para declaração simplificada", "Migração de planos", "Planejamento sucessório"],
  },
  {
    icon: LineChart,
    title: "Derivativos & Opções",
    description: "Operações estruturadas, opções e proteção de carteira (hedge) para investidores experientes que buscam alavancagem ou proteção.",
    items: ["Opções de compra e venda", "Estruturas de proteção", "Operações de hedge", "Consultoria em risco"],
  },
  {
    icon: Building2,
    title: "Consórcios & Crédito",
    description: "Consórcios imobiliários e automotivos, além de produtos de crédito com as melhores condições do mercado para pessoa física e jurídica.",
    items: ["Consórcio imobiliário", "Consórcio automotivo", "Home equity", "Crédito para empresas"],
  },
  {
    icon: Users,
    title: "Planejamento Financeiro",
    description: "Planejamento completo: orçamento pessoal, gestão patrimonial, planejamento sucessório e estratégias para liberdade financeira.",
    items: ["Diagnóstico financeiro completo", "Plano de independência financeira", "Planejamento sucessório", "Gestão de fluxo de caixa"],
  },
];

export default function Servicos() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[42px]" />
      </div>
      <div className="pt-[42px]">
        <Header />
      </div>

      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
            O que oferecemos
          </span>
          <h1 className="text-5xl md:text-6xl font-serif text-foreground mb-6">
            Serviços de <span className="text-gradient-gold">Assessoria</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Soluções completas para construir, proteger e multiplicar seu patrimônio.
            Credenciado à XP Investimentos — a maior plataforma de investimentos da América Latina.
          </p>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="lg">
              Agendar Consultoria Gratuita
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border hover:border-gold/30 hover:shadow-gold transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-gold" />
                  </div>
                  <h2 className="text-xl font-serif font-semibold text-foreground mb-3">{service.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-4">
        <MesalvaBanner variant="strip" campaign="servicos" />
      </div>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
            Pronto para começar sua <span className="text-gradient-gold">saga financeira</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Agende uma consultoria gratuita e receba um diagnóstico personalizado da sua carteira.
          </p>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="gold" size="lg" className="text-base px-10">
              Falar com Rainiere no WhatsApp
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
