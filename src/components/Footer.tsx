import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const navLinks = [
  { label: "A Saga", href: "#saga" },
  { label: "Simulador", href: "#simulador" },
  { label: "Perfil de Investidor", href: "#perfil" },
  { label: "Serviços", href: "/servicos" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "#contato" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/[0.06]">

      {/* Gold top accent rule */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(to right, transparent, hsl(42 85% 55% / 0.35), transparent)" }}
      />

      <div className="container mx-auto px-6 lg:px-10 py-14">
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-12 lg:gap-20 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-md overflow-hidden opacity-85">
                <img src="/rr-monogram-logo.png" alt="Rainiere Rocha" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div>
                <p className="font-serif text-foreground font-semibold text-[15px] leading-tight">
                  Saga Financeira
                </p>
                <p className="text-[9.5px] tracking-[0.22em] uppercase text-gold/45 font-medium mt-0.5">
                  Rainiere Rocha · InvestSmart | XP
                </p>
              </div>
            </div>
            <p className="text-muted-foreground/55 text-[12.5px] leading-relaxed max-w-xs">
              Assessoria de investimentos pela InvestSmart, escritório credenciado à XP Investimentos,
              oferecendo soluções personalizadas para construção e proteção do seu patrimônio em todo o Brasil.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/35 font-medium mb-5">
              Navegação
            </p>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[12.5px] text-muted-foreground/50 hover:text-gold transition-colors duration-200 tracking-wide"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/35 font-medium mb-5">
              Legal
            </p>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-[12.5px] text-muted-foreground/50 hover:text-gold transition-colors duration-200">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-[12.5px] text-muted-foreground/50 hover:text-gold transition-colors duration-200">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a
                  href="https://www.xpi.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-muted-foreground/50 hover:text-gold transition-colors duration-200 inline-flex items-center gap-1.5"
                >
                  XP Investimentos
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://mesalva.app/?utm_source=sagafin&utm_medium=site&utm_campaign=footer&utm_content=link"
                  target="_blank"
                  rel="noopener"
                  aria-label="MeSalva — app de finanças pessoais (abre em nova aba)"
                  className="text-[12.5px] text-muted-foreground/50 hover:text-gold transition-colors duration-200 inline-flex items-center gap-1.5"
                >
                  MeSalva — app de finanças pessoais
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/[0.05] pt-8 mb-8">
          <p className="text-[11px] text-muted-foreground/28 leading-relaxed max-w-4xl">
            Rainiere Rocha é assessor de investimentos vinculado à Invest Smart Assessor de Investimento Ltda.,
            inscrita sob o CNPJ nº 19.438.577/0001-08, empresa de Assessoria de Investimento devidamente
            registrada na Comissão de Valores Mobiliários na forma da Resolução CVM 178/23, que mantém contrato
            de distribuição de produtos financeiros com a XP Investimentos Corretora de Câmbio, Títulos e Valores
            Mobiliários S.A. (&quot;XP&quot;) e pode, por conta e ordem dos seus clientes, operar no mercado de capitais
            segundo a legislação vigente. Na forma da legislação da CVM, o Assessor de Investimento não pode
            administrar ou gerir o patrimônio de investidores. O conteúdo deste site tem caráter meramente
            educacional e informativo e não constitui oferta, solicitação de compra ou venda ou recomendação de
            qualquer ativo financeiro, nem relatório de análise (Resolução CVM 20). O investimento em ações é um
            investimento de risco e rentabilidade passada não é garantia de rentabilidade futura. Na realização de
            operações com derivativos existe a possibilidade de perdas superiores aos valores investidos, podendo
            resultar em significativas perdas patrimoniais. Antes de investir, verifique a adequação dos produtos
            ao seu perfil de investidor. Para informações e dúvidas sobre produtos, contate seu assessor de
            investimentos. Para reclamações, contate a Ouvidoria da XP pelo telefone 0800 722 3730.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/[0.04] pt-6">
          <p className="text-[11px] text-muted-foreground/25 tracking-wide">
            © {new Date().getFullYear()} Saga Financeira. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-muted-foreground/20 tracking-wide">
            Desenvolvido com dedicação para sua jornada financeira
          </p>
        </div>
      </div>
    </footer>
  );
}
