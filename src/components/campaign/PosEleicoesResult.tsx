import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy, Download, MessageCircle } from "lucide-react";
import { MarketDigestModal } from "@/components/MarketDigestModal";
import { MANUAL_PDF, XP_CODE, isQualified, waDiagnosticoUrl, xpOpenAccountUrl } from "@/lib/campaign";

const GOLD = "hsl(42 85% 55%)";
const botaoOuro = { background: `linear-gradient(135deg, ${GOLD}, hsl(38 78% 42%))` } as const;
const botaoBase =
  "inline-flex items-center justify-center gap-2 px-6 py-4 text-[11px] tracking-[0.18em] uppercase font-semibold rounded-sm transition-opacity hover:opacity-90";

export function PosEleicoesResult({ faixa, nome }: { faixa: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);
  const qualificado = isQualified(faixa);
  const primeiro = nome.trim().split(/\s+/)[0];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(XP_CODE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem clipboard */
    }
  };

  return (
    <div role="status" className="space-y-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-7 w-7 shrink-0 text-[hsl(42_85%_55%)]" aria-hidden />
        <div>
          <h2 className="font-serif text-2xl text-foreground leading-tight">Pronto, {primeiro}. O manual é seu.</h2>
          <p className="text-[13.5px] text-white/55 mt-1">Leitura de 12 minutos, sem jargão e sem produto empurrado.</p>
        </div>
      </div>

      <a
        href={MANUAL_PDF}
        target="_blank"
        rel="noopener noreferrer"
        download
        className={`${botaoBase} w-full ${qualificado ? "border border-white/15 text-foreground" : "text-background"}`}
        style={qualificado ? undefined : botaoOuro}
      >
        <Download className="h-4 w-4" aria-hidden /> Baixar o manual (PDF)
      </a>

      {qualificado ? (
        <div className="rounded-2xl border border-[hsl(42_85%_55%/0.25)] bg-[hsl(42_85%_55%/0.06)] p-6 space-y-4">
          <p className="font-serif text-xl text-foreground leading-snug">
            Agora o passo que vale dinheiro: o diagnóstico da sua carteira.
          </p>
          <p className="text-[13.5px] text-white/60 leading-relaxed">
            Você tem a partir de R$ 100 mil investidos. Eu olho a sua carteira com o cenário de juros atual, separo o que está
            vermelho só por marcação a mercado do que merece atenção de verdade. São 20 minutos pelo WhatsApp, resposta em até
            48 horas, sem compromisso. Atendo 5 carteiras por semana.
          </p>
          <a
            href={waDiagnosticoUrl(nome, faixa)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${botaoBase} w-full text-background`}
            style={botaoOuro}
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Agendar meu diagnóstico no WhatsApp
          </a>
          <p className="text-[11.5px] text-white/40 leading-relaxed">
            A assessoria fee-based tem custo percentual fixo ao ano sobre o patrimônio, a partir de 1% a.a., sem comissão por
            produto. O valor exato é apresentado antes de qualquer contratação.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3">
          <p className="font-serif text-xl text-foreground">Enquanto isso, três ferramentas gratuitas:</p>
          <ul className="space-y-2 text-[13.5px]">
            <li>
              <Link className="text-[hsl(42_85%_62%)] underline underline-offset-4" to="/diagnostico">
                Diagnóstico de carteira com IA
              </Link>
            </li>
            <li>
              <Link className="text-[hsl(42_85%_62%)] underline underline-offset-4" to="/biblioteca">
                Biblioteca com 11 e-books
              </Link>
            </li>
            <li>
              <MarketDigestModal>
                <button type="button" className="text-[hsl(42_85%_62%)] underline underline-offset-4">
                  Newsletter Diário Saga
                </button>
              </MarketDigestModal>
            </li>
          </ul>
        </div>
      )}

      {XP_CODE && (
        <div className="rounded-2xl border border-white/[0.08] p-5 space-y-3 text-[13px] text-white/60">
          <p>
            <a
              className="text-[hsl(42_85%_62%)] underline underline-offset-4"
              href={xpOpenAccountUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir conta na XP com o código do meu assessor
            </a>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            Já é cliente XP? Troque de assessor em Atendimento, com o código
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-0.5 text-foreground"
            >
              {XP_CODE} <Copy className="h-3 w-3" aria-hidden />
              {copiado && <span className="text-[11px] text-[hsl(42_85%_62%)]">copiado</span>}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
