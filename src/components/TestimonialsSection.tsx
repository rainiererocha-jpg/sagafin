import { motion } from "framer-motion";
import { FadeInUp, defaultViewport } from "@/components/ui/motion";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Empresário",
    content:
      "Em 2 anos de assessoria, minha rentabilidade triplicou comparada ao que tinha no banco. O atendimento personalizado faz toda diferença.",
    initials: "CM",
  },
  {
    name: "Ana Paula Silva",
    role: "Médica",
    content:
      "Finalmente entendi como funciona o mercado financeiro. O Rainiere explica de forma clara e me ajudou a criar uma carteira diversificada.",
    initials: "AS",
  },
  {
    name: "Roberto Almeida",
    role: "Engenheiro",
    content:
      "A assessoria de planejamento sucessório foi fundamental para minha família. Profissionalismo e conhecimento técnico impecáveis.",
    initials: "RA",
  },
];

const [featured, ...secondary] = testimonials;

export function TestimonialsSection() {
  return (
    <section className="py-28 lg:py-36 bg-secondary/20 relative overflow-hidden">

      {/* Decorative section number */}
      <span
        aria-hidden
        className="absolute -top-6 left-4 lg:left-12 font-serif font-bold text-white/[0.025] leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
      >
        05
      </span>

      <div className="container mx-auto px-6 lg:px-10 relative z-10">

        {/* Section header */}
        <FadeInUp className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10" style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }} />
            <span className="text-label">Depoimentos</span>
          </div>
          <h2 className="font-serif font-light text-foreground" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
            O que nossos clientes{" "}
            <em className="not-italic text-gradient-gold font-semibold">dizem</em>
          </h2>
        </FadeInUp>

        {/* Featured testimonial — pull-quote style */}
        <FadeInUp className="mb-16 lg:mb-20">
          <div className="relative border-t border-white/[0.06] pt-10 lg:pt-14">
            {/* Giant open-quote character */}
            <span
              aria-hidden
              className="absolute top-4 left-0 font-serif text-gold/12 leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(6rem, 14vw, 13rem)", lineHeight: 0.8 }}
            >
              "
            </span>

            <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end pl-6 lg:pl-0">
              <blockquote>
                <p
                  className="font-serif italic text-foreground/85 leading-snug mb-8"
                  style={{ fontSize: "clamp(1.35rem, 2.8vw, 2.2rem)" }}
                >
                  "{featured.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-background text-[13px] font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                  >
                    {featured.initials}
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-[14px]">{featured.name}</p>
                    <p className="text-label mt-0.5">{featured.role}</p>
                  </div>
                  {/* 5 stars */}
                  <div className="hidden sm:flex items-center gap-0.5 ml-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-gold/80" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </blockquote>
            </div>
            <div className="editorial-rule mt-10 lg:mt-14" />
          </div>
        </FadeInUp>

        {/* Secondary testimonials — 2 column */}
        <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
          {secondary.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={defaultViewport}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="group"
            >
              {/* Gold top accent */}
              <div
                className="h-px mb-6 transition-all duration-300"
                style={{ background: `linear-gradient(to right, hsl(42 85% 55% / ${i === 0 ? '0.35' : '0.2'}), transparent)` }}
              />
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} className="w-3 h-3 fill-gold/65" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground/70 text-sm leading-relaxed mb-6 italic font-serif">
                "{t.content}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-background text-[11px] font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(42 85% 55% / 0.7), hsl(38 78% 42% / 0.7))" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-foreground/80 font-semibold text-[13px]">{t.name}</p>
                  <p className="text-label mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
