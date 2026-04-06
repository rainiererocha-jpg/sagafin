import { MarketTicker } from "@/components/MarketTicker";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { SagaStorySection } from "@/components/SagaStorySection";
import { SecretWeaponsSection } from "@/components/SecretWeaponsSection";
import { CompoundInterestSimulator } from "@/components/CompoundInterestSimulator";
import { InvestorProfileQuiz } from "@/components/InvestorProfileQuiz";
import { FixedIncomeComparator } from "@/components/FixedIncomeComparator";
import { ServicesSection } from "@/components/ServicesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Market Ticker */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MarketTicker />
      </div>

      {/* Header - positioned below ticker */}
      <div className="pt-[42px]">
        <Header />
      </div>

      {/* Hero with Photo */}
      <div className="pt-[42px]">
        <HeroSection />
      </div>

      {/* A Saga do Seu Patrimônio */}
      <SagaStorySection />

      {/* Armas Secretas do Assessor */}
      <SecretWeaponsSection />

      {/* Compound Interest Simulator */}
      <section id="simulador" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
              Simulador
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
              O Poder dos{" "}
              <span className="text-gradient-gold">Juros Compostos</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Visualize o crescimento exponencial do seu patrimônio ao longo do tempo.
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-card/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-border/50 shadow-elevated">
            <CompoundInterestSimulator />
          </div>
        </div>
      </section>

      {/* Investor Profile Quiz */}
      <section id="perfil" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
              Análise de Perfil
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
              Descubra seu{" "}
              <span className="text-gradient-gold">Perfil de Investidor</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Responda 7 perguntas rápidas e receba uma análise personalizada
              com sugestões de alocação para seu perfil.
            </p>
          </div>

          <InvestorProfileQuiz />
        </div>
      </section>

      {/* Fixed Income Comparator */}
      <section id="renda-fixa" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
              Comparador
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
              Compare produtos de{" "}
              <span className="text-gradient-gold">Renda Fixa</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja na prática quanto você está perdendo na Poupança e descubra
              alternativas mais rentáveis com segurança.
            </p>
          </div>

          <FixedIncomeComparator />
        </div>
      </section>

      {/* Services */}
      <ServicesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Contact Form */}
      <ContactForm />

      {/* Footer */}
      <Footer />

      {/* Floating Elements */}
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default Index;