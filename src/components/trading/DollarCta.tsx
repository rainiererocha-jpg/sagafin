import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function DollarCta({ message }: { message: string }) {
  return (
    <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer">
      <Button variant="gold" size="lg" className="gap-2">
        <DollarSign className="w-4 h-4" /> Comprar dólar pelo WhatsApp
      </Button>
    </a>
  );
}
