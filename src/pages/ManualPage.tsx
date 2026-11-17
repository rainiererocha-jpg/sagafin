import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Layers, LineChart, Wallet } from "lucide-react";
import { HeroFadeIn } from "@/components/ui/motion";
import { Footer } from "@/components/Footer";
import { ComplianceNotice } from "@/components/ComplianceNotice";
import { PosEleicoesForm } from "@/components/campaign/PosEleicoesForm";
import { PosEleicoesResult } from "@/components/campaign/PosEleicoesResult";
import { MANUAL_INVESTIDOR } from "@/lib/campaign";

// Landing do funil social: "comente EU QUERO / MANUAL / GUIA" → DM com link → aqui.
const TITULO = "Manual Completo do Investidor (grátis) | Saga Financeira";
const DESCRICAO =
  "Da organização financeira ao mercado futuro em 12 capítulos: reserva, renda fixa, FIIs, ações, exterior, PGBL, FIRE, opções e mini-índice. Baixe grátis.";

const TRILHAS = [
  { icon: Wallet, t: "Base", d: "Orçamento 50-30-20, vazamentos da renda alta, dívidas, reserva de emergência e objetivos por prazo." },
  { icon: Layers, t: "Carteira", d: "Renda fixa e Tesouro, crédito privado, FIIs, ações e dividendos, investimento no exterior e PGBL." },
  { icon: LineChart, t: "Avançado", d: "Independência financeira (FIRE), as 10 estratégias com opções e mercado futuro: mini-índice e mini-dólar." },
];

const CAPITULOS = [
  "Organização financeira",
  "Reserva de emergência",
  "Perfil e objetivos",
  "Renda fixa e Tesouro Direto",
  "Crédito privado",
  "Fundos imobiliários",
  "Ações e dividendos",
  "Investimento internacional",
  "Previdência e PGBL",
  "Independência financeira",
  "Opções",
  "Mercado futuro",
];

export default function ManualPage() {
  const [resultado, setResultado] = useState<{ faixa: string; nome: string } | null>(null);

  useEffect(() => {
    document.title = TITULO;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", DESCRICAO);
  }, []);

  const aoEnviar = (faixa: string, nome: string, email: string) => {
    setResultado({ faixa, nome });
    // Manda o PDF por e-mail também (o navegador interno do Instagram costuma perder downloads). Não bloqueia.
    if (email) {
      fetch("/api/manual-enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome }),
      }).catch(() => undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-[38px] bg-black/60 backdrop-blur-sm border-b border-white/[0.06] flex items-center">
        <div className="container mx-auto px-6 lg:px-10 flex items-center justify-between text-[10.5px] tracking-[0.2em] uppercase text-white/45">
          <Link to="/" className="font-medium text-[hsl(42_85%_62%)]">Saga Financeira</Link>
          <span className="hidden sm:inline">Rainiere Rocha · Assessor de Investimentos</span>
        </div>
      </div>

      <main>
        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pt-14 pb-10">
          <HeroFadeIn>
            <p className="text-[10.5px] tracking-[0.25em] uppercase text-[hsl(42_85%_62%)] font-medium mb-5">
              Manual gratuito · 12 capítulos
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.08] text-foreground mb-6" style={{ textWrap: "balance" }}>
              Manual Completo do Investidor: da organização financeira ao mercado futuro.
            </h1>
            <p className="text-[16px] leading-relaxed text-white/60 mb-8 max-w-xl">
              Tudo o que a Biblioteca Saga ensina, condensado num único PDF: o que fazer antes de investir, como montar a carteira e
              como funcionam opções, mini-índice e mini-dólar. Linguagem simples, exemplos com números e sem promessa de
              rentabilidade.
            </p>
            <a
              href="#formulario"
              className="inline-block px-8 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold text-background rounded-sm"
              style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
            >
              Eu quero o manual
            </a>
          </HeroFadeIn>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-12">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            {resultado ? (
              <PosEleicoesResult
                faixa={resultado.faixa}
                nome={resultado.nome}
                pdf={MANUAL_INVESTIDOR.pdf}
                nomeManual={MANUAL_INVESTIDOR.nome}
                leitura="16 páginas. Também enviamos uma cópia para o seu e-mail."
              />
            ) : (
              <>
                <h2 className="font-serif text-2xl text-foreground mb-5">Receba o manual agora</h2>
                <PosEleicoesForm
                  source={MANUAL_INVESTIDOR.source}
                  campaign={MANUAL_INVESTIDOR.campaign}
                  ctaLabel="Eu quero o manual"
                  onSuccess={aoEnviar}
                />
              </>
            )}
          </div>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-12">
          <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[hsl(42_85%_55%)]" aria-hidden /> Três trilhas, um caminho
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {TRILHAS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <Icon className="h-5 w-5 text-[hsl(42_85%_55%)] mb-3" aria-hidden />
                <p className="font-medium text-foreground text-[14px] mb-1.5">{t}</p>
                <p className="text-[12.5px] leading-relaxed text-white/55">{d}</p>
              </div>
            ))}
          </div>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {CAPITULOS.map((c, i) => (
              <li key={c} className="flex items-baseline gap-3 border-b border-white/[0.06] py-2 text-[13.5px] text-white/65">
                <span className="font-serif text-[hsl(42_85%_55%)] w-6">{String(i + 1).padStart(2, "0")}</span>
                {c}
              </li>
            ))}
          </ol>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-14">
          <div className="flex items-center gap-4 mb-4">
            <img src="/rr-monogram-logo.png" alt="Rainiere Rocha" className="h-14 w-14 rounded-md object-cover" loading="lazy" />
            <div>
              <p className="font-serif text-xl text-foreground leading-tight">Rainiere Rocha</p>
              <p className="text-[11px] tracking-[0.18em] uppercase text-white/45 mt-0.5">
                Assessor de Investimentos · XP Investimentos via InvestSmart · Goiânia
              </p>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-white/60 max-w-xl">
            Escrevo o Diário Saga todo dia útil e mantenho a Biblioteca Saga aberta. Este manual junta o essencial num lugar só, para
            você investir com método. Se tiver a partir de R$ 100 mil investidos, peça também o diagnóstico da sua carteira.
          </p>
        </section>
      </main>

      <ComplianceNotice />
      <Footer />
    </div>
  );
}
