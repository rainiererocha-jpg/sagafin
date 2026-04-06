import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border text-foreground flex items-center justify-center shadow-lg hover:border-gold/50 hover:text-gold transition-all duration-300"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
