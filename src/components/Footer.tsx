import { Shield, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-deep py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">
                  SF
                </span>
              </div>
              <div>
                <p className="text-primary-foreground font-bold text-lg">
                  Saga Financeira
                </p>
                <p className="text-gold text-xs font-medium">
                  Rainiere Rocha • XP Investimentos
                </p>
              </div>
            </div>
            <p className="text-primary-foreground/60 text-sm max-w-sm leading-relaxed">
              Assessoria de investimentos credenciada à XP Investimentos,
              oferecendo soluções personalizadas para construção e proteção do
              seu patrimônio.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">
              Links Rápidos
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Simulador", href: "#simulador" },
                { label: "Perfil de Investidor", href: "#perfil" },
                { label: "Renda Fixa", href: "#renda-fixa" },
                { label: "Sobre", href: "#sobre" },
                { label: "Contato", href: "#contato" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                >
                  Termos de Uso
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                >
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a
                  href="https://www.xpi.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/60 hover:text-gold transition-colors text-sm inline-flex items-center gap-1"
                >
                  XP Investimentos
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-navy-medium/30 pt-6">
          <div className="flex items-start gap-3 bg-navy-medium/30 rounded-lg p-4 mb-6">
            <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-xs text-primary-foreground/50 leading-relaxed">
              A XP Investimentos CCTVM S/A, inscrita sob o CNPJ:
              02.332.886/0001-04, é uma instituição financeira autorizada a
              funcionar pelo Banco Central do Brasil. Este site não constitui
              oferta de produto ou serviço financeiro. Rentabilidade passada não
              garante rentabilidade futura. Investimentos envolvem riscos e
              podem resultar em perdas.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/40">
              © {new Date().getFullYear()} Saga Financeira. Todos os direitos
              reservados.
            </p>
            <p className="text-xs text-primary-foreground/40">
              Desenvolvido com 💛 para sua jornada financeira
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
