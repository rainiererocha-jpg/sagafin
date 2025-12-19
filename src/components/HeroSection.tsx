import { CompoundInterestSimulator } from "./CompoundInterestSimulator";
import { ArrowDown, Shield, Award, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen bg-gradient-hero overflow-hidden pt-24 pb-16"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">
              Assessor Credenciado XP Investimentos
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Transforme sua relação com o{" "}
            <span className="text-gradient-gold">dinheiro</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-8">
            Assessoria de investimentos personalizada para quem busca rentabilidade 
            superior com segurança. Descubra quanto seu patrimônio pode crescer.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Award className="w-5 h-5 text-gold" />
              <span className="text-sm">+10 anos de mercado</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Users className="w-5 h-5 text-gold" />
              <span className="text-sm">+500 clientes atendidos</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm">R$ 200M+ sob assessoria</span>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <div
          id="simulador"
          className="max-w-5xl mx-auto bg-card/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-elevated border border-border/50"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Simulador de Juros Compostos
            </h2>
            <p className="text-muted-foreground">
              Veja o poder dos juros compostos trabalhando para você
            </p>
          </div>
          
          <CompoundInterestSimulator />
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-12">
          <a
            href="#perfil"
            className="flex flex-col items-center gap-2 text-primary-foreground/50 hover:text-gold transition-colors"
          >
            <span className="text-sm">Descubra seu perfil</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
