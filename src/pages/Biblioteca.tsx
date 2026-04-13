import { useState, useMemo } from "react";
import { Download, Search, BookOpen, Zap, Star, X, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { FadeInUp } from "@/components/ui/motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import {
  bibliotecaItems,
  CATEGORIAS,
  CATEGORIA_CORES,
  type BibliotecaItem,
  type ItemCategoria,
} from "@/data/biblioteca";

// ─── Lead form ──────────────────────────────────────────────────────────────

interface LeadFormData {
  nome: string;
  email: string;
}

// ─── Card ───────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onDownload,
}: {
  item: BibliotecaItem;
  onDownload: (item: BibliotecaItem) => void;
}) {
  const cor = CATEGORIA_CORES[item.categoria];

  return (
    <div
      className="group relative flex flex-col rounded-sm border border-white/[0.07] bg-card/60 backdrop-blur-sm hover:border-white/[0.16] transition-all duration-300"
      style={{
        boxShadow: "0 4px 24px -8px hsl(0 0% 0% / 0.4)",
      }}
    >
      {/* destaque badge */}
      {item.destaque && (
        <div className="absolute -top-px right-5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] tracking-[0.2em] uppercase font-semibold rounded-b-sm"
            style={{ background: cor, color: "hsl(0 0% 5%)" }}
          >
            <Star size={7} />
            Destaque
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* tipo + categoria */}
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: `${cor}18`, border: `1px solid ${cor}30` }}
          >
            {item.tipo === "ebook" ? (
              <BookOpen size={12} style={{ color: cor }} />
            ) : (
              <Zap size={12} style={{ color: cor }} />
            )}
          </span>
          <span
            className="text-[9.5px] tracking-[0.18em] uppercase font-medium"
            style={{ color: cor }}
          >
            {item.categoria}
          </span>
        </div>

        {/* título + descrição */}
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-foreground text-[17px] leading-tight mb-2 group-hover:text-gold transition-colors duration-200">
            {item.titulo}
          </h3>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed">
            {item.descricao}
          </p>
        </div>

        {/* tags */}
        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] tracking-[0.12em] uppercase font-medium px-2 py-0.5 rounded-sm text-muted-foreground/70"
              style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* botão */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onDownload(item)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[10.5px] tracking-[0.18em] uppercase font-medium border rounded-sm transition-all duration-200"
          style={{
            color: cor,
            borderColor: `${cor}35`,
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${cor}10`;
            e.currentTarget.style.borderColor = `${cor}65`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = `${cor}35`;
          }}
        >
          <Download size={11} />
          {item.tipo === "ebook" ? "Baixar Ebook" : "Baixar Skill"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal de Lead Capture ───────────────────────────────────────────────────

function LeadModal({
  item,
  open,
  onClose,
}: {
  item: BibliotecaItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>();

  const cor = item ? CATEGORIA_CORES[item.categoria] : "hsl(42 85% 55%)";

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("form");
      setErrorMsg("");
      reset();
    }, 300);
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // Salva o lead no Supabase
      const { error } = await supabase.from("leads_biblioteca").insert({
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        item_id: item.id,
        item_titulo: item.titulo,
        item_tipo: item.tipo,
        item_categoria: item.categoria,
      });

      if (error && !error.message.includes("placeholder")) {
        console.warn("Supabase não configurado ainda:", error.message);
      }

      // Trigger download — busca URL pública no Supabase Storage
      await triggerDownload(item);

      setStep("success");
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = async (item: BibliotecaItem) => {
    try {
      const { data } = supabase.storage
        .from("biblioteca")
        .getPublicUrl(item.arquivo);

      if (data?.publicUrl && !data.publicUrl.includes("placeholder")) {
        const link = document.createElement("a");
        link.href = data.publicUrl;
        link.download = item.arquivo.split("/").pop() ?? item.id + ".zip";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // Storage não configurado ainda — download será habilitado após setup do Supabase
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-md border-white/[0.08] bg-card p-0 overflow-hidden"
        style={{ boxShadow: "0 24px 80px -20px hsl(0 0% 0% / 0.7)" }}
      >
        <DialogTitle className="sr-only">
          {item ? `Baixar ${item.titulo}` : "Download"}
        </DialogTitle>

        {/* Topo colorido */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(to right, ${cor}, transparent)` }}
        />

        <div className="p-8">
          {step === "form" ? (
            <>
              {/* Cabeçalho */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={11} className="text-muted-foreground/50" />
                  <span className="text-[9.5px] tracking-[0.2em] uppercase text-muted-foreground/50 font-medium">
                    Acesso gratuito
                  </span>
                </div>
                <h2 className="font-serif font-semibold text-foreground text-[22px] leading-tight mb-2">
                  Informe seus dados
                </h2>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed">
                  Para baixar{" "}
                  <span className="text-foreground/80 font-medium">{item?.titulo}</span>,
                  precisamos de um email válido. Você também receberá atualizações exclusivas.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground/70">
                    Nome
                  </label>
                  <Input
                    {...register("nome", { required: "Informe seu nome" })}
                    placeholder="Seu nome"
                    className="bg-background/60 border-white/[0.08] focus:border-gold/40 text-sm placeholder:text-muted-foreground/30"
                  />
                  {errors.nome && (
                    <p className="text-[11px] text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground/70">
                    Email
                  </label>
                  <Input
                    {...register("email", {
                      required: "Informe seu email",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Email inválido",
                      },
                    })}
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-background/60 border-white/[0.08] focus:border-gold/40 text-sm placeholder:text-muted-foreground/30"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-[12px] text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
                    {errorMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 text-[10.5px] tracking-[0.2em] uppercase font-medium py-5"
                  style={{ background: cor, color: "hsl(0 0% 5%)" }}
                >
                  {loading ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : (
                    <>
                      <Download size={12} />
                      Baixar Agora
                      <ArrowRight size={11} />
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground/40 leading-relaxed">
                  Sem spam. Cancele quando quiser.
                </p>
              </form>
            </>
          ) : (
            /* Success */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: `${cor}18`, border: `1px solid ${cor}40` }}
              >
                <CheckCircle2 size={26} style={{ color: cor }} />
              </div>
              <h2 className="font-serif font-semibold text-foreground text-[22px] mb-2">
                Download iniciado!
              </h2>
              <p className="text-muted-foreground text-[13px] leading-relaxed mb-6">
                Seu arquivo{" "}
                <span className="text-foreground/80 font-medium">{item?.titulo}</span> está
                sendo baixado. Verifique sua pasta de downloads.
              </p>
              <button
                onClick={handleClose}
                className="text-[10.5px] tracking-[0.18em] uppercase font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function Biblioteca() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<ItemCategoria>("Todas");
  const [busca, setBusca] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState<BibliotecaItem | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const itensFiltrados = useMemo(() => {
    return bibliotecaItems.filter((item) => {
      const matchCategoria =
        categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;
      const q = busca.toLowerCase();
      const matchBusca =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategoria && matchBusca;
    });
  }, [categoriaAtiva, busca]);

  const destaques = bibliotecaItems.filter((i) => i.destaque).slice(0, 3);

  const handleDownload = (item: BibliotecaItem) => {
    setItemSelecionado(item);
    setModalAberto(true);
  };

  const totalPorCategoria = (cat: ItemCategoria) => {
    if (cat === "Todas") return bibliotecaItems.length;
    return bibliotecaItems.filter((i) => i.categoria === cat).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* MarketTicker importado pelo Header internamente via contexto de layout */}
      </div>

      <Header />

      <main className="pt-[100px]">
        {/* ─── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          {/* Orb decorativo */}
          <div
            aria-hidden
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(42 85% 55% / 0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <span
            aria-hidden
            className="absolute -top-4 right-6 lg:right-16 font-serif font-bold text-white/[0.018] leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
          >
            B
          </span>

          <div className="container mx-auto px-6 lg:px-10 relative z-10">
            <FadeInUp>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-px w-10"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)",
                  }}
                />
                <span className="text-label tracking-[0.22em] text-[9.5px] uppercase font-medium text-gold/60">
                  Biblioteca Sagafin
                </span>
              </div>

              <h1
                className="font-serif font-light text-foreground mb-5"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.4rem)" }}
              >
                Ferramentas que{" "}
                <em className="not-italic font-semibold"
                  style={{
                    background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  aceleram resultados
                </em>
              </h1>

              <p className="text-muted-foreground text-[14px] leading-relaxed max-w-xl mb-10">
                {bibliotecaItems.length} skills de IA + ebooks exclusivos para assessores
                financeiros, criadores de conteúdo e empreendedores. Tudo gratuito — basta
                informar seu email.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-8">
                {[
                  { valor: bibliotecaItems.length.toString(), label: "Skills disponíveis" },
                  { valor: "67", label: "Categorias" },
                  { valor: "100%", label: "Gratuito" },
                ].map((s) => (
                  <div key={s.label}>
                    <p
                      className="font-serif font-semibold text-[28px] leading-none"
                      style={{
                        background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.valor}
                    </p>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground/60 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeInUp>
          </div>
        </section>

        {/* ─── Destaques ──────────────────────────────────────────────────── */}
        <section className="py-14 border-t border-white/[0.05]">
          <div className="container mx-auto px-6 lg:px-10">
            <FadeInUp>
              <div className="flex items-center gap-3 mb-8">
                <Star size={13} className="text-gold/60" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-muted-foreground/60">
                  Em destaque
                </span>
              </div>
            </FadeInUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {destaques.map((item, i) => (
                <FadeInUp key={item.id} delay={i * 0.08}>
                  <div
                    className="group relative p-6 rounded-sm border cursor-pointer transition-all duration-300"
                    style={{
                      borderColor: `${CATEGORIA_CORES[item.categoria]}25`,
                      background: `linear-gradient(145deg, hsl(0 0% 8%), hsl(0 0% 6%))`,
                    }}
                    onClick={() => handleDownload(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${CATEGORIA_CORES[item.categoria]}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${CATEGORIA_CORES[item.categoria]}25`;
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded-sm"
                        style={{
                          background: `${CATEGORIA_CORES[item.categoria]}18`,
                          color: CATEGORIA_CORES[item.categoria],
                        }}
                      >
                        {item.categoria}
                      </span>
                    </div>
                    <h3 className="font-serif font-semibold text-[18px] text-foreground mb-2 group-hover:text-gold transition-colors">
                      {item.titulo}
                    </h3>
                    <p className="text-muted-foreground text-[12px] leading-relaxed mb-4">
                      {item.descricao}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase font-medium"
                      style={{ color: CATEGORIA_CORES[item.categoria] }}>
                      <Download size={10} />
                      Download gratuito
                    </div>
                  </div>
                </FadeInUp>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Busca + Filtros + Grid ──────────────────────────────────────── */}
        <section className="py-16 border-t border-white/[0.05]">
          <div className="container mx-auto px-6 lg:px-10">

            {/* Busca */}
            <FadeInUp>
              <div className="relative max-w-lg mb-10">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                />
                <Input
                  placeholder="Buscar skills e ebooks..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 bg-card/40 border-white/[0.07] focus:border-gold/30 text-sm placeholder:text-muted-foreground/30"
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </FadeInUp>

            {/* Filtros de categoria */}
            <FadeInUp delay={0.05}>
              <div className="flex flex-wrap gap-2 mb-10">
                {CATEGORIAS.map((cat) => {
                  const ativo = cat === categoriaAtiva;
                  const cor = CATEGORIA_CORES[cat];
                  const count = totalPorCategoria(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoriaAtiva(cat)}
                      className="flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] tracking-[0.14em] uppercase font-medium transition-all duration-200 border"
                      style={
                        ativo
                          ? {
                              background: `${cor}18`,
                              borderColor: `${cor}50`,
                              color: cor,
                            }
                          : {
                              background: "transparent",
                              borderColor: "hsl(0 0% 14%)",
                              color: "hsl(0 0% 50%)",
                            }
                      }
                    >
                      {cat}
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-sm font-semibold"
                        style={
                          ativo
                            ? { background: `${cor}30`, color: cor }
                            : { background: "hsl(0 0% 12%)", color: "hsl(0 0% 40%)" }
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FadeInUp>

            {/* Resultado */}
            {itensFiltrados.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground/50 text-sm">
                  Nenhum item encontrado para{" "}
                  <span className="text-foreground/60">"{busca}"</span>
                </p>
                <button
                  onClick={() => { setBusca(""); setCategoriaAtiva("Todas"); }}
                  className="mt-4 text-[10.5px] tracking-[0.16em] uppercase text-gold/60 hover:text-gold transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground/40 mb-6">
                  {itensFiltrados.length} {itensFiltrados.length === 1 ? "item" : "itens"} encontrados
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {itensFiltrados.map((item, i) => (
                    <FadeInUp key={item.id} delay={Math.min(i * 0.04, 0.3)}>
                      <ItemCard item={item} onDownload={handleDownload} />
                    </FadeInUp>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ─── CTA Final ──────────────────────────────────────────────────── */}
        <section className="py-24 border-t border-white/[0.05]">
          <div className="container mx-auto px-6 lg:px-10 text-center">
            <FadeInUp>
              <h2
                className="font-serif font-light text-foreground mb-4"
                style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
              >
                Quer ir além das ferramentas?
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto mb-8">
                Agende uma consultoria gratuita e descubra como aplicar essas
                estratégias no seu patrimônio e negócio.
              </p>
              <a
                href="https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20vi%20a%20biblioteca%20e%20gostaria%20de%20uma%20consultoria."
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="px-8 py-3.5 text-[10.5px] tracking-[0.22em] uppercase font-semibold text-background rounded-sm transition-all duration-200 hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))",
                  }}
                >
                  Agendar Consultoria Gratuita
                </button>
              </a>
            </FadeInUp>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
      <BackToTop />

      {/* Modal */}
      <LeadModal
        item={itemSelecionado}
        open={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
