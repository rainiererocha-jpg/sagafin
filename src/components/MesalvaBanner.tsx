import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, Target } from "lucide-react";
import {
  featureDoDia,
  linkCadastro,
  linkMesalva,
  type Campaign,
  type Medium,
  type MesalvaFeature,
} from "@/data/mesalva-features";
import { BRAND, CHAM, DARK, Wordmark, glow } from "@/data/mesalva-brand";

type Variant = "section" | "card" | "strip" | "inline";

interface Props {
  variant?: Variant;
  feature?: MesalvaFeature;
  campaign?: Campaign;
  medium?: Medium;
  className?: string;
}

const DEFAULTS: Record<Variant, { campaign: Campaign; medium: Medium }> = {
  section: { campaign: "home", medium: "site" },
  card: { campaign: "post", medium: "post" },
  strip: { campaign: "blog", medium: "site" },
  inline: { campaign: "inline", medium: "post" },
};

const pills = [
  { icon: Sparkles, label: "Para onde vai cada real" },
  { icon: Bot, label: "Consultora sem comissão" },
  { icon: Target, label: "Sua data de liberdade" },
];

function ChamBar({ className = "h-1 w-full" }: { className?: string }) {
  return <div aria-hidden className={className} style={{ background: CHAM }} />;
}

function CtaPrimario({ href, compact = false, children }: { href: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] font-jakarta font-bold text-white transition-transform hover:-translate-y-px ${
        compact ? "px-5 py-2.5 text-sm" : "px-7 py-3.5 text-[15px]"
      }`}
      style={{ background: BRAND.gradient.purple, boxShadow: BRAND.shadowCta }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function CtaSecundario({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      className="font-jakarta text-sm font-bold underline-offset-4 hover:underline"
      style={{ color: DARK.primary }}
    >
      {children}
    </a>
  );
}

function Compliance({ className = "" }: { className?: string }) {
  return (
    <p className={`font-jakarta text-[11px] leading-snug ${className}`} style={{ color: DARK.muted }}>
      {BRAND.compliance}
    </p>
  );
}

export function MesalvaBanner({ variant = "card", feature, campaign, medium, className = "" }: Props) {
  const f = feature ?? featureDoDia();
  const d = DEFAULTS[variant];
  const camp = campaign ?? d.campaign;
  const med = medium ?? d.medium;
  const cadastro = linkCadastro(med, camp, f.id);
  const saiba = linkMesalva(med, camp, f.id, f.anchor);

  if (variant === "section") {
    return (
      <section
        aria-label="Publicidade: MeSalva"
        className={`relative overflow-hidden py-20 lg:py-24 ${className}`}
        style={{ background: DARK.bg, borderBlock: `1px solid ${DARK.border}` }}
      >
        <ChamBar className="absolute inset-x-0 top-0 h-1" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(600px circle at 0% 0%, ${glow(BRAND.color.teal, 0.22)}, transparent 60%), radial-gradient(600px circle at 100% 100%, ${glow(BRAND.color.magenta, 0.18)}, transparent 60%)`,
          }}
        />
        <div className="container relative mx-auto px-6 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="mb-5 flex items-center gap-3">
                <Wordmark className="text-xl" />
                <span className="font-jakarta text-[10px] uppercase tracking-[0.18em]" style={{ color: DARK.muted }}>
                  Publicidade
                </span>
              </div>
              <h2
                className="font-jakarta font-extrabold leading-[1.1]"
                style={{ color: DARK.ink, fontSize: "clamp(2rem,4vw,3rem)" }}
              >
                Você trabalha todo mês e <span className="cham-text">o dinheiro some.</span>
              </h2>
              <p className="mt-4 max-w-xl font-jakarta text-base leading-relaxed" style={{ color: DARK.ink, opacity: 0.85 }}>
                {BRAND.assinatura} Importe o extrato e veja, em menos de 60 segundos, para onde foi cada real.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {pills.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-jakarta text-[13px] font-medium"
                    style={{ background: DARK.card, border: `1px solid ${DARK.border}`, color: DARK.ink }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: DARK.primary }} />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <CtaPrimario href={linkCadastro("site", "home", "hero")}>Começar grátis</CtaPrimario>
                <CtaSecundario href={linkMesalva("site", "home", "hero", "#funcionalidades")}>Ver como funciona</CtaSecundario>
              </div>
              <p className="mt-5 font-jakarta text-xs" style={{ color: DARK.muted }}>{BRAND.promessa}</p>
              <Compliance className="mt-2" />
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "strip") {
    return (
      <aside
        aria-label="Publicidade: MeSalva"
        className={`relative overflow-hidden rounded-[14px] ${className}`}
        style={{ background: DARK.card, border: `1px solid ${DARK.border}` }}
      >
        <div aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: CHAM }} />
        <div className="flex flex-col items-start gap-4 px-5 py-4 pl-6 sm:flex-row sm:items-center">
          <Wordmark className="text-lg" />
          <p className="flex-1 font-jakarta text-[15px] font-bold leading-snug" style={{ color: DARK.ink }}>
            {f.titulo}
          </p>
          <CtaPrimario href={cadastro} compact>Começar grátis</CtaPrimario>
        </div>
        <Compliance className="px-6 pb-3 text-[10px]" />
      </aside>
    );
  }

  // card (fim do artigo) e inline (meio do artigo)
  const inline = variant === "inline";
  return (
    <motion.aside
      aria-label="Publicidade: MeSalva"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-[14px] ${inline ? "my-10" : "mt-16"} ${className}`}
      style={{ background: DARK.card, border: `1px solid ${DARK.border}` }}
    >
      <ChamBar />
      <div className="p-6 text-left sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Wordmark className="text-lg" />
          <span className="font-jakarta text-[10px] uppercase tracking-[0.18em]" style={{ color: DARK.muted }}>
            Publicidade
          </span>
        </div>
        <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: DARK.primary }}>
          {f.kicker}
        </p>
        <h3
          className={`mt-2 font-jakarta font-extrabold leading-tight ${inline ? "text-lg" : "text-xl sm:text-2xl"}`}
          style={{ color: DARK.ink }}
        >
          {f.titulo}
        </h3>
        <p className="mt-3 font-jakarta text-[15px] leading-relaxed" style={{ color: DARK.ink, opacity: 0.88 }}>
          {f.texto}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <CtaPrimario href={cadastro}>Começar grátis</CtaPrimario>
          <CtaSecundario href={saiba}>{f.cta}</CtaSecundario>
        </div>
        <p className="mt-5 font-jakarta text-xs" style={{ color: DARK.muted }}>{BRAND.promessa}</p>
        <Compliance className="mt-1.5" />
      </div>
    </motion.aside>
  );
}

export default MesalvaBanner;
