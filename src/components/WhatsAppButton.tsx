import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20gostaria%20de%20saber%20mais%20sobre%20assessoria%20de%20investimentos.";

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-pulse"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
