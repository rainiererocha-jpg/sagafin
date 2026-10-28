const WHATSAPP_NUMBER = "5562994160930";

export function buildWhatsAppUrl(msg: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
