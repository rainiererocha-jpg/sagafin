import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, Tag, Calendar, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Post {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  conteudo_html: string;
  data_publicacao: string;
  tempo_leitura: string;
  tags: string[];
  destaque: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20li%20o%20blog%20e%20gostaria%20de%20saber%20mais.";

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPost(data as Post);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="pt-[42px]"><Header /></div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="pt-[42px]"><Header /></div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
          <h1 className="text-4xl font-serif text-foreground">Post não encontrado</h1>
          <p className="text-muted-foreground">Este artigo não existe ou foi removido.</p>
          <Link to="/blog">
            <Button variant="gold">← Voltar ao Blog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[42px]" />
      </div>
      <div className="pt-[42px]">
        <Header />
      </div>

      {/* Hero */}
      <section className="pt-32 pb-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
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

          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-6">
            {post.titulo}
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed mb-8">{post.resumo}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-b border-border py-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              {formatDate(post.data_publicacao)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              {post.tempo_leitura} de leitura
            </span>
            <span className="ml-auto text-gold font-medium">Rainiere Rocha · XP Investimentos</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="post-content" dangerouslySetInnerHTML={{ __html: post.conteudo_html }} />

          {/* CTA */}
          <div className="mt-16 p-10 bg-card/50 rounded-2xl border border-gold/20 text-center">
            <p className="text-xs text-gold tracking-widest uppercase mb-3 font-semibold">
              Assessoria Personalizada
            </p>
            <h3 className="text-2xl font-serif text-foreground mb-3">
              Quer aplicar isso na sua carteira?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Fale com Rainiere Rocha e receba uma análise personalizada para o seu perfil e objetivos.
            </p>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="lg">
                Falar com o Assessor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>

          <div className="mt-8 text-center">
            <Link to="/blog" className="text-muted-foreground hover:text-gold transition-colors text-sm">
              ← Ver todos os artigos
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
