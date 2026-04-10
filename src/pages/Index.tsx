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
import { FadeInUp } from "@/components/ui/motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* Market Ticker — fixed at very top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MarketTicker />
      </div>

      {/* Header — fixed just below ticker */}
      <Header />

      {/* Hero — full viewport, accounts for ticker + header */}
      <div className="pt-[38px]">
        <HeroSection />
      </div>

      {/* A Saga do Seu Patrimônio */}
      <SagaStorySection />

      {/* Armas Secretas do Assessor */}
      <SecretWeaponsSection />

      {/* Simulador de Juros Compostos */}
      <section id="simulador" className="py-28 lg:py-36 bg-background relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-6 right-6 lg:right-16 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
          style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
        >
          S1
        </span>
        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          <FadeInUp className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-label">Simulador</span>
            </div>
            <h2 className="font-serif font-light text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              O Poder dos{" "}
              <em className="not-italic text-gradient-gold font-semibold">Juros Compostos</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              Visualize o crescimento exponencial do seu patrimônio ao longo do tempo.
            </p>
          </FadeInUp>

          <div className="bg-card/40 backdrop-blur-md rounded-lg p-6 md:p-8 border border-white/[0.06]">
            <CompoundInterestSimulator />
          </div>
        </div>
      </section>

      {/* Quiz de Perfil de Investidor */}
      <section id="perfil" className="py-28 lg:py-36 bg-secondary/15 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          <FadeInUp className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-label">Análise de Perfil</span>
            </div>
            <h2 className="font-serif font-light text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              Descubra seu{" "}
              <em className="not-italic text-gradient-gold font-semibold">Perfil de Investidor</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              Responda 7 perguntas rápidas e receba uma análise personalizada
              com sugestões de alocação para o seu perfil.
            </p>
          </FadeInUp>

          <InvestorProfileQuiz />
        </div>
      </section>

      {/* Comparador de Renda Fixa */}
      <section id="renda-fixa" className="py-28 lg:py-36 bg-background relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          <FadeInUp className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-label">Comparador</span>
            </div>
            <h2 className="font-serif font-light text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              Compare produtos de{" "}
              <em className="not-italic text-gradient-gold font-semibold">Renda Fixa</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              Veja na prática quanto você está perdendo na Poupança e descubra
              alternativas muito mais rentáveis com a mesma segurança.
            </p>
          </FadeInUp>

          <FixedIncomeComparator />
        </div>
      </section>

      {/* Serviços + Sobre o Assessor */}
      <ServicesSection />

      {/* Depoimentos */}
      <TestimonialsSection />

      {/* Formulário de Contato */}
      <ContactForm />

      {/* Footer */}
      <Footer />

      {/* Floating elements */}
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default Index;
