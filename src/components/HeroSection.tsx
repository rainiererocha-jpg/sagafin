import { Button } from "@/components/ui/button";
import { ArrowDown, Phone } from "lucide-react";
import heroImage from "@/assets/rainiere-hero.jpg";
import { HeroSlideLeft, HeroSlideRight, HeroFadeIn } from "@/components/ui/motion";

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen bg-background overflow-hidden pt-24 pb-16">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      {/* Gold Accent Glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[80vh]">
          {/* Left Content */}
          <HeroSlideLeft delay={0.2} className="order-2 lg:order-1 text-center lg:text-left">
            {/* Title with Serif Font */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-foreground mb-4 leading-[1.1]">
              RAINIERE
            </h1>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-foreground mb-6 leading-[1.1]">
              ROCHA
            </h1>
            
            {/* Subtitle with Gold Italic */}
            <p className="text-xl md:text-2xl font-serif italic text-gold mb-8">
              Assessor de Investimentos
            </p>
            
            {/* Main Tagline */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground/90 mb-6 leading-tight">
              O arquiteto da sua{" "}
              <span className="text-gradient-gold">prosperidade financeira</span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 text-base lg:text-left font-medium leading-relaxed">
              Assessoria de investimentos personalizada com estratégia, tecnologia e visão de longo prazo. Proteja e multiplique seu patrimônio com quem entende do mercado.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20assessoria." target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="lg" className="text-base px-8">
                  <Phone className="w-4 h-4 mr-2" />
                  Agende sua Assessoria
                </Button>
              </a>
              <a href="https://wa.me/5562994160930" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="text-base px-8 border-gold/30 text-foreground hover:bg-gold/10 hover:border-gold/50">
                  <Phone className="w-4 h-4 mr-2" />
                  Fale pelo WhatsApp
                </Button>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12">
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gold">10+</p>
                <p className="text-sm text-muted-foreground">Anos de Mercado</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gold">500+</p>
                <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gold">R$ 200M+</p>
                <p className="text-sm text-muted-foreground">Sob Assessoria</p>
              </div>
            </div>
          </HeroSlideLeft>

          {/* Right Content - Photo */}
          <HeroSlideRight delay={0.4} className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-gold/20 via-gold/5 to-transparent rounded-3xl blur-2xl scale-110" />
              
              {/* Photo Container */}
              <div className="relative w-[300px] md:w-[400px] lg:w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border-glow glow-gold">
                <img src={heroImage} alt="Rainiere Rocha - Assessor de Investimentos XP" className="w-full h-full object-cover object-center" />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                
                {/* XP Badge */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-background/80 backdrop-blur-md rounded-xl px-4 py-3 border border-gold/20">
                    <p className="text-gold font-semibold text-sm">Credenciado XP Investimentos</p>
                    <p className="text-foreground/70 text-xs">Assessoria Personalizada Premium</p>
                  </div>
                </div>
              </div>
            </div>
          </HeroSlideRight>
        </div>

        {/* Scroll Indicator */}
        <HeroFadeIn delay={1} className="flex justify-center mt-8">
          <a href="#saga" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
            <span className="text-sm">Conheça a Saga</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </a>
        </HeroFadeIn>
      </div>
    </section>
  );
}
