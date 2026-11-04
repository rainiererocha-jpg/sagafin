import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Percent, ShieldCheck, Users } from "lucide-react";
import { HeroFadeIn } from "@/components/ui/motion";
import { Footer } from "@/components/Footer";
import { ComplianceNotice } from "@/components/ComplianceNotice";
import { PosEleicoesForm } from "@/components/campaign/PosEleicoesForm";
import { PosEleicoesResult } from "@/components/campaign/PosEleicoesResult";

const TITULO = "Manual Pós-Eleições 2026 | Saga Financeira";
const DESCRICAO =
  "Por que os seus investimentos caíram com a eleição: curva de juros e marcação a mercado explicadas, e o que fazer agora. Manual gratuito da Saga Financeira.";

const CONTEUDO = [
  "O que aconteceu com a curva de juros e por que o mercado antecipa",
  "Marcação a mercado em uma página, com exemplo de R$ 10 mil",
  "O papel de cada peça da carteira num cenário de juros altos por mais tempo",
  "Checklist de 7 perguntas para revisar a carteira esta semana",
  "Os 5 erros clássicos de pós-eleição",
  "Como funciona a assessoria fee-based, sem comissão por produto",
];

export default function PosEleicoesPage() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-[38px] bg-black/60 backdrop-blur-sm border-b border-white/[0.06] flex items-center">
        <div className="container mx-auto px-6 lg:px-10 flex items-center justify-between text-[10.5px] tracking-[0.2em] uppercase text-white/45">
          <Link to="/" className="font-medium text-[hsl(42_85%_62%)]">Saga Financeira</Link>
          <span>Rainiere Rocha · Assessor de Investimentos</span>
        </div>
      </div>

      <main>
        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pt-14 pb-10">
          <HeroFadeIn>
            <p className="text-[10.5px] tracking-[0.25em] uppercase text-[hsl(42_85%_62%)] font-medium mb-5">
              Manual gratuito · Pós-eleições 2026
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.08] text-foreground mb-6" style={{ textWrap: "balance" }}>
              Seus investimentos caíram com a eleição? Não foi o seu lado. Foi a curva de juros.
            </h1>
            <p className="text-[16px] leading-relaxed text-white/60 mb-8 max-w-xl">
              Baixe o Manual Pós-Eleições 2026 e entenda, sem jargão, por que o título que você já tinha ficou vermelho. Se você
              tem a partir de R$ 100 mil investidos, receba também um diagnóstico da sua carteira em até 48 horas.
            </p>
            <a
              href="#formulario"
              className="inline-block px-8 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold text-background rounded-sm"
              style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
            >
              Quero o manual gratuito
            </a>
          </HeroFadeIn>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-12">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            {resultado ? <PosEleicoesResult faixa={resultado.faixa} nome={resultado.nome} /> : (
              <>
                <h2 className="font-serif text-2xl text-foreground mb-5">Receba o manual agora</h2>
                <PosEleicoesForm onSuccess={(faixa, nome) => setResultado({ faixa, nome })} />
              </>
            )}
          </div>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-12">
          <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[hsl(42_85%_55%)]" aria-hidden /> O que você vai ler no manual
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {CONTEUDO.map((c) => (
              <li key={c} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-[13.5px] leading-snug text-white/65">
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-12">
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
            Mais de 6 anos ajudando famílias e empresários a organizar o patrimônio. Meu lema: o melhor operador de mercado é o
            tempo. Por isso este manual não vende produto: explica o que aconteceu e como pensar a sua carteira.
          </p>
        </section>

        <section className="container mx-auto px-6 lg:px-10 max-w-3xl pb-14">
          <h2 className="font-serif text-2xl text-foreground mb-5">Assessoria fee-based: como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Percent, t: "O que você paga", d: "Um percentual fixo ao ano sobre o patrimônio, a partir de 1% a.a. O valor exato é informado antes da contratação." },
              { icon: ShieldCheck, t: "O que você não paga", d: "Comissão por produto. A recomendação não muda a minha remuneração." },
              { icon: Users, t: "Para quem é", d: "Quem tem a partir de R$ 100 mil investidos. Atendo 5 carteiras por semana para dar atenção de verdade." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <Icon className="h-5 w-5 text-[hsl(42_85%_55%)] mb-3" aria-hidden />
                <p className="font-medium text-foreground text-[14px] mb-1.5">{t}</p>
                <p className="text-[12.5px] leading-relaxed text-white/55">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <ComplianceNotice />
      <Footer />
    </div>
  );
}
