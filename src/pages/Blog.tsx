import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const posts = [
  {
    slug: "assessoria-xp-goiania",
    title: "Como escolher um assessor de investimentos XP em Goiânia",
    excerpt: "Entenda o que é um assessor de investimentos credenciado XP, quais as vantagens em relação ao gerente de banco e como escolher o profissional certo para o seu perfil.",
    date: "15 Mar 2026",
    readTime: "5 min",
    tags: ["Assessoria", "XP Investimentos", "Goiânia"],
    featured: true,
  },
  {
    slug: "derivativos-opcoes",
    title: "Derivativos e Opções: como usar para proteger e alavancar sua carteira",
    excerpt: "Guia completo sobre derivativos financeiros: o que são, como funcionam as opções de compra e venda, estratégias de hedge e quando usá-los na sua carteira.",
    date: "22 Mar 2026",
    readTime: "8 min",
    tags: ["Derivativos", "Opções", "Estratégia"],
    featured: false,
  },
  {
    slug: "ia-financas-investimentos",
    title: "Inteligência Artificial nas finanças: como a IA está mudando os investimentos",
    excerpt: "Como ferramentas de IA estão revolucionando a análise de carteiras, detecção de oportunidades e o perfil de risco dos investidores. O futuro da assessoria de investimentos.",
    date: "01 Abr 2026",
    readTime: "6 min",
    tags: ["Inteligência Artificial", "Inovação", "Fintech"],
    featured: false,
  },
];

const WA_URL = "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20li%20o%20blog%20e%20gostaria%20de%20saber%20mais.";

export default function Blog() {
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
            Conteúdo gratuito
          </span>
          <h1 className="text-5xl md:text-6xl font-serif text-foreground mb-6">
            Blog <span className="text-gradient-gold">Saga Financeira</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Educação financeira de qualidade para você tomar decisões mais inteligentes com o seu dinheiro.
          </p>
        </div>
      </section>

      <section className="pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-gold/30 hover:shadow-gold transition-all duration-300 overflow-hidden group"
              >
                <div className="h-2 bg-gradient-gold" />
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs text-gold bg-gold/10 px-2 py-1 rounded-full">
                        <Tag className="w-3 h-3" />{tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-serif font-semibold text-foreground mb-3 group-hover:text-gold transition-colors leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    </div>
                    <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                      className="text-gold text-sm font-medium hover:underline flex items-center gap-1">
                      Ler mais <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="text-center mt-16 p-12 bg-card/50 rounded-2xl border border-border">
            <h3 className="text-2xl font-serif text-foreground mb-4">
              Quer conteúdo exclusivo sobre <span className="text-gradient-gold">investimentos</span>?
            </h3>
            <p className="text-muted-foreground mb-6">Fale com Rainiere e receba análises personalizadas para o seu perfil.</p>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                Falar com o Assessor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
