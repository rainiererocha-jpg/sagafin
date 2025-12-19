import { MarketTicker } from "@/components/MarketTicker";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { InvestorProfileQuiz } from "@/components/InvestorProfileQuiz";
import { FixedIncomeComparator } from "@/components/FixedIncomeComparator";
import { ServicesSection } from "@/components/ServicesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";

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

      {/* Hero with Simulator */}
      <div className="pt-[42px]">
        <HeroSection />
      </div>

      {/* Investor Profile Quiz */}
      <section id="perfil" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-gold font-semibold text-sm tracking-wider uppercase mb-3">
              Análise de Perfil
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Descubra seu{" "}
              <span className="text-gradient-gold">Perfil de Investidor</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Responda 7 perguntas rápidas e receba uma análise personalizada
              com sugestões de alocação para seu perfil.
            </p>
          </div>

          <InvestorProfileQuiz />
        </div>
      </section>

      {/* Fixed Income Comparator */}
      <section id="renda-fixa" className="py-20 bg-ice-blue">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block text-gold font-semibold text-sm tracking-wider uppercase mb-3">
              Comparador
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare produtos de{" "}
              <span className="text-gradient-gold">Renda Fixa</span>
            </h2>
            <p className="text-muted-foreground text-lg">
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
    </div>
  );
};

export default Index;
