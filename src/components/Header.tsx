import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const WA_URL = "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20agendar%20uma%20consultoria%20gratuita.";

const navLinks = [
  { label: "Início", href: "/", isRoute: true },
  { label: "A Saga", href: "#saga", isRoute: false },
  { label: "Simulador", href: "#simulador", isRoute: false },
  { label: "Serviços", href: "/servicos", isRoute: true },
  { label: "Blog", href: "/blog", isRoute: true },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg py-3 border-b border-border/50"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-gold">
              <img
                src="/rr-monogram-logo.png"
                alt="Rainiere Rocha - Saga Financeira"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-foreground font-bold text-lg leading-tight font-serif">
                Saga Financeira
              </p>
              <p className="text-gold text-xs font-medium">
                Rainiere Rocha • XP
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 text-foreground/70 hover:text-gold transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleHashClick(e, link.href)}
                  className="px-4 py-2 text-foreground/70 hover:text-gold transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gold" size="default">
                Agendar Consultoria
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border/30 pt-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 text-foreground/70 hover:text-gold transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleHashClick(e, link.href)}
                    className="px-4 py-2 text-foreground/70 hover:text-gold transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </a>
                )
              )}
              <a href={WA_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="lg" className="mt-2 w-full">
                  Agendar Consultoria
                </Button>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
