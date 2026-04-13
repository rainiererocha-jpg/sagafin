import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const WA_URL =
  "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20consultoria%20gratuita.";

const navLinks = [
  { label: "Início", href: "/", isRoute: true },
  { label: "A Saga", href: "#saga", isRoute: false },
  { label: "Simulador", href: "#simulador", isRoute: false },
  { label: "Serviços", href: "/servicos", isRoute: true },
  { label: "Blog", href: "/blog", isRoute: true },
  { label: "Biblioteca", href: "/biblioteca", isRoute: true },
  { label: "Contato", href: "#contato", isRoute: false },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHashClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const id = href.replace("#", "");
    if (location.pathname !== "/") {
      window.location.href = "/" + href;
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 z-40 transition-all duration-500 ${
        isScrolled
          ? "top-[38px] bg-background/94 backdrop-blur-xl border-b border-white/[0.06] py-3"
          : "top-[38px] bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-md overflow-hidden opacity-90 group-hover:opacity-100 transition-opacity">
              <img
                src="/rr-monogram-logo.png"
                alt="Rainiere Rocha"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="font-serif text-foreground font-semibold text-[15px] leading-tight tracking-wide">
                Saga Financeira
              </p>
              <p className="text-[9.5px] tracking-[0.22em] uppercase text-gold/52 font-medium mt-0.5">
                Rainiere Rocha · XP
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive =
                link.isRoute &&
                (link.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.href));

              const cls = [
                "relative px-4 py-2.5 text-[11px] tracking-[0.16em] uppercase font-medium transition-colors duration-200",
                "after:absolute after:bottom-1 after:left-4 after:right-4 after:h-px after:bg-gold/50 after:origin-left after:transition-transform after:duration-300 after:ease-out",
                isActive
                  ? "text-gold after:scale-x-100"
                  : "text-foreground/42 hover:text-foreground/80 after:scale-x-0 hover:after:scale-x-100",
              ].join(" ");

              return link.isRoute ? (
                <Link key={link.href} to={link.href} className={cls}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} onClick={(e) => handleHashClick(e, link.href)} className={cls}>
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <button className="px-5 py-2 text-[10.5px] tracking-[0.2em] uppercase font-medium text-gold border border-gold/32 hover:border-gold/60 hover:bg-gold/5 rounded-sm transition-all duration-200">
                Agendar Consultoria
              </button>
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-foreground/50 hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-5 pb-5 border-t border-white/8 pt-5 space-y-0.5">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-2 py-2.5 text-[11px] tracking-[0.14em] uppercase font-medium text-foreground/50 hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleHashClick(e, link.href)}
                  className="block px-2 py-2.5 text-[11px] tracking-[0.14em] uppercase font-medium text-foreground/50 hover:text-gold transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="pt-4">
              <a href={WA_URL} target="_blank" rel="noopener noreferrer">
                <button className="w-full py-3 text-[10.5px] tracking-[0.2em] uppercase font-medium text-gold border border-gold/32 hover:bg-gold/5 transition-all duration-200">
                  Agendar Consultoria
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
