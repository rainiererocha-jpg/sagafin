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
                  Rainiere Rocha · XP Investimentos
                </p>
              </div>
            </div>
            <p className="text-muted-foreground/55 text-[12.5px] leading-relaxed max-w-xs">
              Assessoria de investimentos credenciada à XP Investimentos, oferecendo soluções
              personalizadas para construção e proteção do seu patrimônio em todo o Brasil.
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
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/[0.05] pt-8 mb-8">
          <p className="text-[11px] text-muted-foreground/28 leading-relaxed max-w-3xl">
            A XP Investimentos CCTVM S/A, inscrita sob o CNPJ: 02.332.886/0001-04, é uma instituição
            financeira autorizada a funcionar pelo Banco Central do Brasil. Este site não constitui
            oferta de produto ou serviço financeiro. Rentabilidade passada não garante rentabilidade
            futura. Investimentos envolvem riscos e podem resultar em perdas.
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
