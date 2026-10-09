import brand from "../../scripts/mesalva-brand.json";

export const BRAND = brand;
export const CHAM: string = brand.gradient.cham;
export const DARK = brand.dark;

/** rgba() a partir de um hex #RRGGBB, para glows. */
export function glow(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-jakarta font-extrabold tracking-tight ${className}`}>
      Me<span className="cham-text">$</span>alva
    </span>
  );
}
