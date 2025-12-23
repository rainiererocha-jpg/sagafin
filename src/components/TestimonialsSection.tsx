import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInUp, staggerItem, defaultTransition, defaultViewport } from "@/components/ui/motion";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Empresário",
    content:
      "Em 2 anos de assessoria, minha rentabilidade triplicou comparada ao que tinha no banco. O atendimento personalizado faz toda diferença.",
    rating: 5,
    initials: "CM",
  },
  {
    name: "Ana Paula Silva",
    role: "Médica",
    content:
      "Finalmente entendi como funciona o mercado financeiro. O Rainiere explica de forma clara e me ajudou a criar uma carteira diversificada.",
    rating: 5,
    initials: "AS",
  },
  {
    name: "Roberto Almeida",
    role: "Engenheiro",
    content:
      "A consultoria de planejamento sucessório foi fundamental para minha família. Profissionalismo e conhecimento técnico impecáveis.",
    rating: 5,
    initials: "RA",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-gold font-semibold text-sm tracking-widest uppercase mb-4">
            Depoimentos
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            O que nossos clientes{" "}
            <span className="text-gradient-gold">dizem</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Histórias reais de investidores que transformaram suas finanças.
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
                staggerChildren: 0.15,
                delayChildren: 0.1,
              },
            },
          }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border relative hover:border-gold/30 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-gold/10" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-gold fill-gold"
                  />
                ))}
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
