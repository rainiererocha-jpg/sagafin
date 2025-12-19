import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Calendar,
  CheckCircle2,
} from "lucide-react";

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

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Mensagem enviada com sucesso!",
      description:
        "Entraremos em contato em até 24 horas úteis.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      investmentRange: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  return (
    <section id="contato" className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="text-primary-foreground">
            <span className="inline-block text-gold font-semibold text-sm tracking-wider uppercase mb-3">
              Entre em Contato
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para começar sua{" "}
              <span className="text-gradient-gold">jornada financeira?</span>
            </h2>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed">
              Agende uma consultoria gratuita e descubra como podemos ajudar
              você a alcançar seus objetivos financeiros com estratégias
              personalizadas.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60">WhatsApp</p>
                  <p className="font-semibold">(11) 99999-9999</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60">E-mail</p>
                  <p className="font-semibold">rainiere.rocha@xpi.com.br</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/60">
                    Atendimento
                  </p>
                  <p className="font-semibold">Online para todo o Brasil</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-navy-medium/50 rounded-xl p-6 border border-navy-light/20">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                O que esperar da consultoria:
              </h4>
              <ul className="space-y-3">
                {[
                  "Análise completa do seu perfil de investidor",
                  "Diagnóstico da sua carteira atual",
                  "Sugestões de produtos adequados ao seu objetivo",
                  "Sem compromisso - totalmente gratuita",
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-primary-foreground/80"
                  >
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl p-8 shadow-elevated">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Solicite uma Consultoria
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Nome completo *
                </label>
                <Input
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    WhatsApp *
                  </label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Valor disponível para investir *
                </label>
                <Select
                  value={formData.investmentRange}
                  onValueChange={(value) =>
                    setFormData({ ...formData, investmentRange: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-50k">R$ 10.000 - R$ 50.000</SelectItem>
                    <SelectItem value="50-100k">
                      R$ 50.000 - R$ 100.000
                    </SelectItem>
                    <SelectItem value="100-500k">
                      R$ 100.000 - R$ 500.000
                    </SelectItem>
                    <SelectItem value="500k-1m">
                      R$ 500.000 - R$ 1.000.000
                    </SelectItem>
                    <SelectItem value="1m+">Acima de R$ 1.000.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Mensagem (opcional)
                </label>
                <Textarea
                  placeholder="Conte-nos sobre seus objetivos financeiros..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Consultoria Gratuita
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ao enviar, você concorda com nossa política de privacidade e
                termos de uso.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
