import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FadeInUp, SlideInLeft, SlideInRight } from "@/components/ui/motion";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20consultoria.";

const benefits = [
  "Análise completa do seu perfil de investidor",
  "Diagnóstico da sua carteira atual",
  "Sugestões de produtos adequados ao seu objetivo",
  "Sem compromisso — totalmente gratuita",
];

export function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    investmentRange: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("leads").insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          investment_range: formData.investmentRange,
          message: formData.message,
          source: "site",
        });
        if (error) throw error;
      }
      const accessKey = (import.meta as any).env?.VITE_WEB3FORMS_KEY || "";
      if (accessKey) {
        await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            subject: `Novo lead: ${formData.name} - ${formData.investmentRange}`,
            from_name: "Saga Financeira",
            ...formData,
          }),
        });
      }
      toast({ title: "Mensagem enviada!", description: "Rainiere entrará em contato em até 24 horas." });
      setFormData({ name: "", email: "", phone: "", investmentRange: "", message: "" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar", description: "Tente pelo WhatsApp.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "bg-transparent border-0 border-b border-white/12 rounded-none px-0 py-3 text-foreground placeholder:text-white/20 focus:border-gold/50 focus:ring-0 focus-visible:ring-0 text-sm transition-colors duration-200";

  return (
    <section id="contato" className="py-28 lg:py-36 bg-background relative overflow-hidden">
      {/* Decorative section number */}
      <span
        aria-hidden
        className="absolute -bottom-4 right-6 lg:right-16 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
      >
        06
      </span>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Left — editorial intro */}
          <SlideInLeft>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
              <span className="text-label">Entre em Contato</span>
            </div>

            <h2
              className="font-serif font-light text-foreground mb-5 leading-tight"
              style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}
            >
              Vamos{" "}
              <em className="not-italic text-gradient-gold font-semibold">
                Conversar?
              </em>
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-md">
              O primeiro passo para a independência financeira é uma conversa honesta.
              Convido você para uma reunião sem compromisso, onde exploraremos juntos
              o mapa do seu futuro financeiro.
            </p>

            {/* Contact details — clean text rows */}
            <div className="space-y-5 mb-10">
              {[
                { icon: Phone, label: "WhatsApp", value: "(62) 99416-0930", href: WA_URL },
                { icon: Mail, label: "E-mail", value: "rainiererocha@sagafinanceira.com.br", href: `mailto:rainiererocha@sagafinanceira.com.br` },
                { icon: MapPin, label: "Atendimento", value: "Online para todo o Brasil", href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4 group">
                  <Icon className="w-4 h-4 text-gold/50 shrink-0" />
                  <div>
                    <p className="text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground/45 font-medium mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-foreground/75 hover:text-foreground transition-colors duration-200">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground/75">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="pt-8 border-t border-white/[0.06]">
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground/40 font-medium mb-5">
                O que esperar da assessoria
              </p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold/50 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </SlideInLeft>

          {/* Right — form */}
          <SlideInRight delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/45 font-medium block mb-2">
                  Nome Completo *
                </label>
                <Input
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={inputCls}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/45 font-medium block mb-2">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/45 font-medium block mb-2">
                    WhatsApp *
                  </label>
                  <Input
                    type="tel"
                    placeholder="(62) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/45 font-medium block mb-2">
                  Valor Disponível para Investir *
                </label>
                <Select
                  value={formData.investmentRange}
                  onValueChange={(v) => setFormData({ ...formData, investmentRange: v })}
                  required
                >
                  <SelectTrigger className="bg-transparent border-0 border-b border-white/12 rounded-none px-0 py-3 text-sm text-foreground/75 focus:ring-0 focus:border-gold/50 h-auto">
                    <SelectValue placeholder="Selecione uma faixa" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="10-50k">R$ 10.000 – R$ 50.000</SelectItem>
                    <SelectItem value="50-100k">R$ 50.000 – R$ 100.000</SelectItem>
                    <SelectItem value="100-500k">R$ 100.000 – R$ 500.000</SelectItem>
                    <SelectItem value="500k-1m">R$ 500.000 – R$ 1.000.000</SelectItem>
                    <SelectItem value="1m+">Acima de R$ 1.000.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground/45 font-medium block mb-2">
                  Mensagem (opcional)
                </label>
                <Textarea
                  placeholder="Conte seus objetivos financeiros..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-gold text-background text-[11.5px] tracking-[0.2em] uppercase font-semibold hover:bg-gold/88 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Solicitar Assessoria Gratuita
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground/30 text-center mt-3 tracking-wide">
                  Ao enviar, você concorda com nossa política de privacidade.
                </p>
              </div>
            </form>
          </SlideInRight>
        </div>
      </div>
    </section>
  );
}
