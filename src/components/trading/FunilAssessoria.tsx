import { Link } from "react-router-dom";
import { ExternalLink, BookOpen, MessageCircle, ArrowRight } from "lucide-react";
import { TASTY_REFERRAL_URL, TASTY_REFERRAL_DISCLOSURE, WA_ASSESSORIA_URL } from "@/data/tastytrade-referral";

export const MANUAL_PATH = "/trading/manual-tastytrade";

/** Três cartões do funil: abrir conta (indicação), manual gratuito (cadastro) e falar com o assessor. */
export function FunilAssessoria({ compacto = false }: { compacto?: boolean }) {
  const cards = [
    {
      icon: ExternalLink,
      label: "Passo 1",
      titulo: "Abrir conta na tastytrade",
      texto: "Corretora dos EUA, em dólar, sem custódia. Cadastro online com o link de indicação da Sagafin.",
      cta: "Abrir conta",
      href: TASTY_REFERRAL_URL,
      externo: true,
    },
    {
      icon: BookOpen,
      label: "Passo 2",
      titulo: "Manual do iniciante",
      texto: "Abertura de conta, remessa, IOF, primeiros ativos, opções e impostos. Grátis, com dados ao vivo da tastytrade.",
      cta: "Ler o manual",
      href: MANUAL_PATH,
      externo: false,
    },
    {
      icon: MessageCircle,
      label: "Passo 3",
      titulo: "Falar com o assessor",
      texto: "Rainiere Rocha, assessor registrado na CVM (InvestSmart/XP). Primeira conversa sem custo, pelo WhatsApp.",
      cta: "Chamar no WhatsApp",
      href: WA_ASSESSORIA_URL,
      externo: true,
    },
  ];

  return (
    <div>
      <div className={`grid gap-4 ${compacto ? "md:grid-cols-3" : "md:grid-cols-3"}`}>
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold/70 font-semibold">{c.label}</span>
                <Icon className="w-4 h-4 text-gold/70" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">{c.titulo}</h3>
              {!compacto && <p className="text-sm text-muted-foreground leading-relaxed mb-5">{c.texto}</p>}
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold group-hover:gap-3 transition-all">
                {c.cta} <ArrowRight className="w-4 h-4" />
              </span>
            </>
          );
          const cls = "group block rounded-2xl border border-gold/20 bg-card/50 backdrop-blur-sm p-6 hover:border-gold/50 hover:bg-card/70 transition-colors";
          return c.externo ? (
            <a key={c.titulo} href={c.href} target="_blank" rel={c.href === TASTY_REFERRAL_URL ? "noopener sponsored" : "noopener noreferrer"} className={cls}>
              {inner}
            </a>
          ) : (
            <Link key={c.titulo} to={c.href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground/60 mt-4">{TASTY_REFERRAL_DISCLOSURE}</p>
    </div>
  );
}

/** Barra fixa no rodapé, só no celular, com os dois CTAs que mais convertem. */
export function BarraMobileAssessoria() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gold/20 bg-background/95 backdrop-blur-md px-4 py-3 flex gap-3">
      <Link to={MANUAL_PATH} className="flex-1 h-11 rounded-lg border border-gold/50 text-gold text-sm font-semibold flex items-center justify-center gap-2">
        <BookOpen className="w-4 h-4" /> Manual
      </Link>
      <a href={WA_ASSESSORIA_URL} target="_blank" rel="noopener noreferrer" className="flex-1 h-11 rounded-lg bg-gold text-accent-foreground text-sm font-bold flex items-center justify-center gap-2">
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </a>
    </div>
  );
}
