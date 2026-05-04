import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Tag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Post {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  data_publicacao: string;
  tempo_leitura: string;
  tags: string[];
  destaque: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20li%20o%20blog%20e%20gostaria%20de%20saber%20mais.";

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, slug, titulo, resumo, data_publicacao, tempo_leitura, tags, destaque")
      .eq("status", "published")
      .order("data_publicacao", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data as Post[]);
        setLoading(false);
      });
  }, []);

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
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : (
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
                      {post.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs text-gold bg-gold/10 px-2 py-1 rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-xl font-serif font-semibold text-foreground mb-3 group-hover:text-gold transition-colors leading-tight">
                      {post.titulo}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">{post.resumo}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(post.data_publicacao)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.tempo_leitura}
                        </span>
                      </div>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-gold text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        Ler mais <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <div className="text-center mt-16 p-12 bg-card/50 rounded-2xl border border-border">
            <h3 className="text-2xl font-serif text-foreground mb-4">
              Quer conteúdo exclusivo sobre{" "}
              <span className="text-gradient-gold">investimentos</span>?
            </h3>
            <p className="text-muted-foreground mb-6">
              Fale com Rainiere e receba análises personalizadas para o seu perfil.
            </p>
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
