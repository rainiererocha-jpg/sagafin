import { XP_OUVIDORIA } from "@/lib/campaign";

/** Aviso exigido pela Resolução CVM 178/2023, art. 24: intermediária nomeada, assessor contratado, ouvidoria. */
export function ComplianceNotice() {
  return (
    <section className="border-t border-white/[0.06] bg-black/30" aria-label="Informações regulatórias">
      <div className="container mx-auto px-6 lg:px-10 max-w-3xl py-8 space-y-3 text-[11.5px] leading-relaxed text-muted-foreground/60">
        <p className="text-foreground/80 font-medium text-[12.5px]">
          XP Investimentos CCTVM S.A. · CNPJ 02.332.886/0001-04
        </p>
        <p>
          Rainiere Rocha é <strong>Assessor de Investimentos</strong> vinculado à Invest Smart Assessor de Investimento Ltda. (CNPJ 19.438.577/0001-08), registrada na CVM na forma da Resolução CVM 178/23, que mantém contrato de distribuição com a XP Investimentos CCTVM S.A. Na forma da legislação da CVM, o assessor de investimento não pode administrar ou gerir o patrimônio de investidores. A XP Investimentos é a instituição responsável pela intermediação e pela custódia dos seus investimentos.
        </p>
        <p>
          Ouvidoria XP Investimentos: {XP_OUVIDORIA} (dias úteis, das 9h às 18h).
        </p>
        <p>
          Conteúdo educacional, de autoria da Saga Financeira. Não constitui recomendação de investimento, oferta
          ou promessa de rentabilidade, e não é material da XP. Rentabilidade passada não garante rentabilidade
          futura; investimentos envolvem riscos, inclusive de perda do capital. A assessoria fee-based tem custo
          percentual fixo ao ano sobre o patrimônio, informado antes da contratação.
        </p>
        <p>
          Seus dados (nome, e-mail, WhatsApp e faixa de patrimônio) são usados apenas para enviar o manual, inscrever você no Diário Saga (e-mail diário de mercado) e, se você pedir, agendar o
          diagnóstico, com base no seu consentimento. Para revogar, escreva para
          rainiere.assessoria@sagafin.com.br.
        </p>
      </div>
    </section>
  );
}
