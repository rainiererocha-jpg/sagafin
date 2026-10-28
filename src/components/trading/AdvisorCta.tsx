import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const MSG = "Olá Rainiere, vim pela página de Destaques de Trading do site e gostaria de falar com você. [Origem: site /trading]";

export function AdvisorCta() {
  return (
    <a href={buildWhatsAppUrl(MSG)} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="lg" className="gap-2">
        <MessageCircle className="w-4 h-4" /> Falar com o assessor
      </Button>
    </a>
  );
}
