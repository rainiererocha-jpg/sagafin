import { useState, useMemo } from "react";
import { Download, Search, BookOpen, Zap, Star, X, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MesalvaBanner } from "@/components/MesalvaBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { FadeInUp } from "@/components/ui/motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  bibliotecaItems,
  CATEGORIA_CORES,
  type BibliotecaItem,
  type ItemCategoria,
} from "@/data/biblioteca";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeadFormData {
  nome: string;
  email: string;
}

// ─── Ebook Cover Configs ─────────────────────────────────────────────────────

interface CoverConfig {
  bg: string;
  accent: string;
  patternEl: (accent: string) => React.ReactNode;
}

const COVER_CONFIGS: CoverConfig[] = [
  // 01: Primeiros Passos — compass star
  {
    bg: "#0d0a05",
    accent: "#C8A84B",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg0" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor={c} stopOpacity="0.14" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg0)" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={400 + Math.cos(rad) * 52} y1={225 + Math.sin(rad) * 52}
              x2={400 + Math.cos(rad) * 162} y2={225 + Math.sin(rad) * 162}
              stroke={c} strokeWidth="1" strokeOpacity="0.38"
            />
          );
        })}
        <circle cx="400" cy="225" r="48" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx="400" cy="225" r="8" fill={c} fillOpacity="0.9" />
        <circle cx="400" cy="225" r="172" fill="none" stroke={c} strokeWidth="0.5" strokeOpacity="0.1" />
      </svg>
    ),
  },
  // 02: Renda Fixa — horizontal bond bars
  {
    bg: "#05080f",
    accent: "#6BB5D4",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg1" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor={c} stopOpacity="0.1" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg1)" />
        {[
          { x: 180, w: 440, y: 172, o: 0.5 },
          { x: 215, w: 370, y: 194, o: 0.28 },
          { x: 160, w: 480, y: 215, o: 0.6 },
          { x: 200, w: 400, y: 236, o: 0.45 },
          { x: 245, w: 310, y: 257, o: 0.32 },
          { x: 188, w: 424, y: 278, o: 0.48 },
          { x: 220, w: 360, y: 299, o: 0.22 },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={1.5} fill={c} fillOpacity={b.o} />
        ))}
        <circle cx="400" cy="236" r="22" fill="none" stroke={c} strokeOpacity="0.38" strokeWidth="1" />
      </svg>
    ),
  },
  // 03: Tesouro Direto — shield crest
  {
    bg: "#0a0900",
    accent: "#C8A84B",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg2" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={c} stopOpacity="0.12" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg2)" />
        <path d="M400,100 L525,150 L525,258 Q525,330 400,368 Q275,330 275,258 L275,150 Z"
          fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.55" />
        <path d="M400,133 L492,172 L492,257 Q492,313 400,344 Q308,313 308,257 L308,172 Z"
          fill="none" stroke={c} strokeWidth="0.8" strokeOpacity="0.22" />
        <circle cx="400" cy="232" r="22" fill={c} fillOpacity="0.15" />
        <circle cx="400" cy="232" r="6" fill={c} fillOpacity="0.85" />
      </svg>
    ),
  },
  // 04: Tesouro Americano — star constellation
  {
    bg: "#05060e",
    accent: "#8090C8",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg3" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={c} stopOpacity="0.1" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg3)" />
        <line x1="348" y1="182" x2="420" y2="222" stroke={c} strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="420" y1="222" x2="482" y2="190" stroke={c} strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="420" y1="222" x2="400" y2="285" stroke={c} strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="400" y1="285" x2="328" y2="262" stroke={c} strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="328" y1="262" x2="348" y2="182" stroke={c} strokeWidth="0.8" strokeOpacity="0.25" />
        <line x1="482" y1="190" x2="460" y2="315" stroke={c} strokeWidth="0.5" strokeOpacity="0.15" />
        <line x1="310" y1="198" x2="348" y2="182" stroke={c} strokeWidth="0.5" strokeOpacity="0.15" />
        {[
          { x: 348, y: 182, r: 4 }, { x: 420, y: 222, r: 6 }, { x: 482, y: 190, r: 3.5 },
          { x: 400, y: 285, r: 4.5 }, { x: 328, y: 262, r: 3 }, { x: 460, y: 315, r: 2.5 },
          { x: 310, y: 198, r: 2 }, { x: 355, y: 330, r: 2 },
        ].map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={c} fillOpacity="0.7" />
        ))}
      </svg>
    ),
  },
  // 05: Debêntures — ascending corporate columns
  {
    bg: "#080808",
    accent: "#C0C0C0",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg4" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={c} stopOpacity="0.07" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg4)" />
        {[
          { x: 285, h: 80, o: 0.18 }, { x: 322, h: 120, o: 0.2 }, { x: 359, h: 158, o: 0.22 },
          { x: 396, h: 200, o: 0.32 }, { x: 433, h: 158, o: 0.22 }, { x: 470, h: 120, o: 0.2 },
          { x: 507, h: 80, o: 0.18 },
        ].map((col, i) => (
          <rect key={i} x={col.x} y={390 - col.h} width="24" height={col.h}
            fill={c} fillOpacity={col.o} stroke={c} strokeWidth="0.5" strokeOpacity="0.3" />
        ))}
        <line x1="250" y1="390" x2="550" y2="390" stroke={c} strokeWidth="0.8" strokeOpacity="0.2" />
      </svg>
    ),
  },
  // 06: FIIs — city skyline
  {
    bg: "#050a07",
    accent: "#6DC8A0",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg5" cx="50%" cy="72%" r="62%">
            <stop offset="0%" stopColor={c} stopOpacity="0.1" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg5)" />
        <rect x="195" y="288" width="52" height="102" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <rect x="258" y="250" width="42" height="140" fill={c} fillOpacity="0.17" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <rect x="310" y="205" width="62" height="185" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <rect x="382" y="152" width="42" height="238" fill={c} fillOpacity="0.26" stroke={c} strokeWidth="0.5" strokeOpacity="0.35" />
        <rect x="434" y="192" width="52" height="198" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <rect x="496" y="228" width="42" height="162" fill={c} fillOpacity="0.17" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <rect x="548" y="268" width="56" height="122" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="0.5" strokeOpacity="0.28" />
        <line x1="150" y1="390" x2="650" y2="390" stroke={c} strokeWidth="0.8" strokeOpacity="0.18" />
      </svg>
    ),
  },
  // 07: Dividendos — overlapping circles (coin cascade)
  {
    bg: "#0a0800",
    accent: "#D4A832",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg6" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={c} stopOpacity="0.12" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg6)" />
        <circle cx="358" cy="210" r="82" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="422" cy="242" r="82" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.38" />
        <circle cx="385" cy="272" r="82" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.3" />
        <circle cx="392" cy="232" r="20" fill={c} fillOpacity="0.14" />
        <circle cx="392" cy="232" r="6" fill={c} fillOpacity="0.85" />
        <circle cx="355" cy="212" r="4" fill={c} fillOpacity="0.5" />
        <circle cx="422" cy="242" r="4" fill={c} fillOpacity="0.5" />
      </svg>
    ),
  },
  // 08: Derivativos — dot grid with connections (options matrix)
  {
    bg: "#08050f",
    accent: "#9B7EDC",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg7" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={c} stopOpacity="0.12" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg7)" />
        {[0, 1, 2, 3].flatMap(row =>
          [0, 1, 2, 3].map(col => (
            <circle key={`${row}-${col}`}
              cx={290 + col * 80} cy={148 + row * 58}
              r={row === 1 && col === 2 ? 7 : 3.5}
              fill={c}
              fillOpacity={row === 1 && col === 2 ? 0.85 : 0.45}
            />
          ))
        )}
        <line x1="290" y1="148" x2="530" y2="322" stroke={c} strokeWidth="0.8" strokeOpacity="0.28" />
        <line x1="370" y1="148" x2="530" y2="264" stroke={c} strokeWidth="0.8" strokeOpacity="0.2" />
        <line x1="290" y1="206" x2="530" y2="206" stroke={c} strokeWidth="0.8" strokeOpacity="0.18" />
        <line x1="450" y1="148" x2="290" y2="322" stroke={c} strokeWidth="0.5" strokeOpacity="0.14" />
      </svg>
    ),
  },
  // 09: FIRE no Brasil — triangle flame
  {
    bg: "#0f0500",
    accent: "#E87040",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg8" cx="50%" cy="62%" r="65%">
            <stop offset="0%" stopColor={c} stopOpacity="0.15" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg8)" />
        <polygon points="400,100 562,342 238,342" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.55" />
        <polygon points="400,155 512,318 288,318" fill="none" stroke={c} strokeWidth="1" strokeOpacity="0.3" />
        <polygon points="400,210 462,294 338,294" fill="none" stroke={c} strokeWidth="0.8" strokeOpacity="0.2" />
        <polygon points="400,255 430,270 370,270" fill={c} fillOpacity="0.15" />
        <circle cx="400" cy="262" r="16" fill={c} fillOpacity="0.22" />
        <circle cx="400" cy="262" r="6" fill={c} fillOpacity="0.85" />
      </svg>
    ),
  },
  // 10: Melhores Práticas — achievement seal
  {
    bg: "#050a05",
    accent: "#6DBF91",
    patternEl: (c) => (
      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg9" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={c} stopOpacity="0.11" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cg9)" />
        <circle cx="400" cy="225" r="132" fill="none" stroke={c} strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="400" cy="225" r="102" fill="none" stroke={c} strokeWidth="0.8" strokeOpacity="0.22" />
        {Array.from({ length: 12 }, (_, i) => {
          const rad = (i * 30 * Math.PI) / 180;
          const isMain = i % 3 === 0;
          return (
            <line key={i}
              x1={400 + Math.cos(rad) * 116} y1={225 + Math.sin(rad) * 116}
              x2={400 + Math.cos(rad) * 130} y2={225 + Math.sin(rad) * 130}
              stroke={c} strokeWidth={isMain ? 2 : 1} strokeOpacity={isMain ? 0.6 : 0.4}
            />
          );
        })}
        <circle cx="400" cy="225" r="28" fill={c} fillOpacity="0.12" />
        <circle cx="400" cy="225" r="8" fill={c} fillOpacity="0.85" />
      </svg>
    ),
  },
];

// ─── Ebook Card ───────────────────────────────────────────────────────────────

function EbookCard({
  item,
  coverIdx,
  onRead,
}: {
  item: BibliotecaItem;
  coverIdx: number;
  onRead: (item: BibliotecaItem) => void;
}) {
  const config = COVER_CONFIGS[coverIdx % COVER_CONFIGS.length];
  const num = String(coverIdx + 1).padStart(2, "0");

  return (
    <div
      className="group flex flex-col rounded-sm border border-white/[0.07] overflow-hidden hover:border-white/[0.16] transition-all duration-300"
      style={{ boxShadow: "0 4px 28px -8px hsl(0 0% 0% / 0.5)" }}
    >
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ paddingBottom: "56.25%", background: config.bg }}>
        <div className="absolute inset-0">
          {config.patternEl(config.accent)}
        </div>
        {/* Number badge */}
        <div className="absolute top-4 left-5 z-10">
          <span className="font-mono text-[10px] tracking-[0.3em] font-medium"
            style={{ color: config.accent, opacity: 0.65 }}>
            {num}
          </span>
        </div>
        {/* Watermark */}
        <div className="absolute top-4 right-5 z-10">
          <span className="text-[8px] tracking-[0.4em] uppercase font-medium"
            style={{ color: config.accent, opacity: 0.28 }}>
            Saga
          </span>
        </div>
        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 z-10"
          style={{ height: "1px", background: `${config.accent}28` }} />
        {/* Hover overlay */}
        <div
          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `${config.accent}06` }}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1 bg-card/60 backdrop-blur-sm">
        <span className="text-[9px] tracking-[0.22em] uppercase font-medium"
          style={{ color: config.accent }}>
          Ebook Financeiro
        </span>

        <h3 className="font-serif font-semibold text-foreground text-[17px] leading-tight group-hover:text-gold transition-colors duration-200">
          {item.titulo}
        </h3>

        <p className="text-muted-foreground text-[12px] leading-relaxed flex-1">
          {item.descricao}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag}
              className="text-[9px] tracking-[0.12em] uppercase font-medium px-2 py-0.5 rounded-sm text-muted-foreground/60"
              style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)" }}>
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={() => onRead(item)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[10.5px] tracking-[0.18em] uppercase font-medium border rounded-sm transition-all duration-200 mt-1"
          style={{ color: config.accent, borderColor: `${config.accent}38`, background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${config.accent}12`;
            e.currentTarget.style.borderColor = `${config.accent}65`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = `${config.accent}38`;
          }}
        >
          <BookOpen size={11} />
          Ler Ebook
        </button>
      </div>
    </div>
  );
}

// ─── Skill Card ───────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onDownload,
}: {
  item: BibliotecaItem;
  onDownload: (item: BibliotecaItem) => void;
}) {
  const cor = CATEGORIA_CORES[item.categoria];

  return (
    <div
      className="group relative flex flex-col rounded-sm border border-white/[0.07] bg-card/60 backdrop-blur-sm hover:border-white/[0.16] transition-all duration-300"
      style={{ boxShadow: "0 4px 24px -8px hsl(0 0% 0% / 0.4)" }}
    >
      {item.destaque && (
        <div className="absolute -top-px right-5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] tracking-[0.2em] uppercase font-semibold rounded-b-sm"
            style={{ background: cor, color: "hsl(0 0% 5%)" }}
          >
            <Star size={7} />
            Destaque
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: `${cor}18`, border: `1px solid ${cor}30` }}
          >
            <Zap size={12} style={{ color: cor }} />
          </span>
          <span className="text-[9.5px] tracking-[0.18em] uppercase font-medium" style={{ color: cor }}>
            {item.categoria}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-serif font-semibold text-foreground text-[17px] leading-tight mb-2 group-hover:text-gold transition-colors duration-200">
            {item.titulo}
          </h3>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed">
            {item.descricao}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] tracking-[0.12em] uppercase font-medium px-2 py-0.5 rounded-sm text-muted-foreground/70"
              style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={() => onDownload(item)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[10.5px] tracking-[0.18em] uppercase font-medium border rounded-sm transition-all duration-200"
          style={{ color: cor, borderColor: `${cor}35`, background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${cor}10`;
            e.currentTarget.style.borderColor = `${cor}65`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = `${cor}35`;
          }}
        >
          <Download size={11} />
          Baixar Skill
        </button>
      </div>
    </div>
  );
}

// ─── Lead Modal ───────────────────────────────────────────────────────────────

function LeadModal({
  item,
  open,
  onClose,
}: {
  item: BibliotecaItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>();

  const isEbook = item?.tipo === "ebook";
  const cor = item ? (isEbook
    ? (COVER_CONFIGS[ebookItems.findIndex(e => e.id === item.id) % COVER_CONFIGS.length]?.accent ?? "hsl(42 85% 55%)")
    : CATEGORIA_CORES[item.categoria])
    : "hsl(42 85% 55%)";

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("form");
      setErrorMsg("");
      reset();
    }, 300);
  };

  const onSubmit = async (data: LeadFormData) => {
    if (!item) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("leads_biblioteca").insert({
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        item_id: item.id,
        item_titulo: item.titulo,
        item_tipo: item.tipo,
        item_categoria: item.categoria,
      });

      if (error && !error.message.includes("placeholder")) {
        console.warn("Supabase:", error.message);
      }

      await triggerAccess(item);
      setStep("success");
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const triggerAccess = async (item: BibliotecaItem) => {
    if (item.arquivo.startsWith("http")) {
      window.open(item.arquivo, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const { data } = supabase.storage.from("biblioteca").getPublicUrl(item.arquivo);
      if (data?.publicUrl && !data.publicUrl.includes("placeholder")) {
        if (item.tipo === "ebook") {
          window.open(data.publicUrl, "_blank", "noopener,noreferrer");
        } else {
          const link = document.createElement("a");
          link.href = data.publicUrl;
          link.download = item.arquivo.split("/").pop() ?? item.id + ".zip";
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch {
      // Storage not configured
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-md border-white/[0.08] bg-card p-0 overflow-hidden"
        style={{ boxShadow: "0 24px 80px -20px hsl(0 0% 0% / 0.7)" }}
      >
        <DialogTitle className="sr-only">
          {item ? `Acessar ${item.titulo}` : "Acesso"}
        </DialogTitle>

        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${cor}, transparent)` }} />

        <div className="p-8">
          {step === "form" ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={11} className="text-muted-foreground/50" />
                  <span className="text-[9.5px] tracking-[0.2em] uppercase text-muted-foreground/50 font-medium">
                    Acesso gratuito
                  </span>
                </div>
                <h2 className="font-serif font-semibold text-foreground text-[22px] leading-tight mb-2">
                  Informe seus dados
                </h2>
                <p className="text-muted-foreground text-[12.5px] leading-relaxed">
                  Para {isEbook ? "acessar" : "baixar"}{" "}
                  <span className="text-foreground/80 font-medium">{item?.titulo}</span>,
                  precisamos de um email válido. Você também receberá atualizações exclusivas.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground/70">
                    Nome
                  </label>
                  <Input
                    {...register("nome", { required: "Informe seu nome" })}
                    placeholder="Seu nome"
                    className="bg-background/60 border-white/[0.08] focus:border-gold/40 text-sm placeholder:text-muted-foreground/30"
                  />
                  {errors.nome && <p className="text-[11px] text-destructive">{errors.nome.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-[0.16em] uppercase font-medium text-muted-foreground/70">
                    Email
                  </label>
                  <Input
                    {...register("email", {
                      required: "Informe seu email",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                    })}
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-background/60 border-white/[0.08] focus:border-gold/40 text-sm placeholder:text-muted-foreground/30"
                  />
                  {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
                </div>

                {errorMsg && (
                  <p className="text-[12px] text-destructive bg-destructive/10 px-3 py-2 rounded-sm">
                    {errorMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 text-[10.5px] tracking-[0.2em] uppercase font-medium py-5"
                  style={{ background: cor, color: "hsl(0 0% 5%)" }}
                >
                  {loading ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : (
                    <>
                      {isEbook ? <BookOpen size={12} /> : <Download size={12} />}
                      {isEbook ? "Acessar Ebook" : "Baixar Agora"}
                      <ArrowRight size={11} />
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground/40 leading-relaxed">
                  Sem spam. Cancele quando quiser.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: `${cor}18`, border: `1px solid ${cor}40` }}
              >
                <CheckCircle2 size={26} style={{ color: cor }} />
              </div>
              <h2 className="font-serif font-semibold text-foreground text-[22px] mb-2">
                {isEbook ? "Ebook aberto!" : "Download iniciado!"}
              </h2>
              <p className="text-muted-foreground text-[13px] leading-relaxed mb-6">
                {isEbook
                  ? <>Seu ebook <span className="text-foreground/80 font-medium">{item?.titulo}</span> foi aberto em uma nova aba. Boa leitura!</>
                  : <>Seu arquivo <span className="text-foreground/80 font-medium">{item?.titulo}</span> está sendo baixado.</>
                }
              </p>
              <button
                onClick={handleClose}
                className="text-[10.5px] tracking-[0.18em] uppercase font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Derived data (module-level, stable) ─────────────────────────────────────

const ebookItems = bibliotecaItems.filter((i) => i.tipo === "ebook");
const skillItems = bibliotecaItems.filter((i) => i.tipo === "skill");
const SKILL_CATEGORIAS: ItemCategoria[] = ["Todas", "Exclusivas", "IA & Criação", "Marketing", "Documentos", "Tech & Dev", "Produtividade"];

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function Biblioteca() {
  const [activeTab, setActiveTab] = useState<"ebooks" | "skills">("ebooks");
  const [categoriaAtiva, setCategoriaAtiva] = useState<ItemCategoria>("Todas");
  const [busca, setBusca] = useState("");
  const [itemSelecionado, setItemSelecionado] = useState<BibliotecaItem | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const skillsFiltradas = useMemo(() => {
    return skillItems.filter((item) => {
      const matchCategoria = categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;
      const q = busca.toLowerCase();
      const matchBusca =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategoria && matchBusca;
    });
  }, [categoriaAtiva, busca]);

  const handleAction = (item: BibliotecaItem) => {
    setItemSelecionado(item);
    setModalAberto(true);
  };

  const totalSkillsPorCategoria = (cat: ItemCategoria) => {
    if (cat === "Todas") return skillItems.length;
    return skillItems.filter((i) => i.categoria === cat).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-[100px]">
        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, hsl(42 85% 55% / 0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <span
            aria-hidden
            className="absolute -top-4 right-6 lg:right-16 font-serif font-bold text-white/[0.018] leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(8rem, 18vw, 18rem)" }}
          >
            B
          </span>

          <div className="container mx-auto px-6 lg:px-10 relative z-10">
            <FadeInUp>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-px w-10"
                  style={{ background: "linear-gradient(to right, hsl(42 85% 55% / 0.6), transparent)" }}
                />
                <span className="text-[9.5px] tracking-[0.22em] uppercase font-medium text-gold/60">
                  Biblioteca Sagafin
                </span>
              </div>

              <h1
                className="font-serif font-light text-foreground mb-5"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.4rem)" }}
              >
                Conhecimento que{" "}
                <em
                  className="not-italic font-semibold"
                  style={{
                    background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  transforma patrimônio
                </em>
              </h1>

              <p className="text-muted-foreground text-[14px] leading-relaxed max-w-xl mb-10">
                10 ebooks completos de mercado financeiro + {skillItems.length} skills de IA para
                assessores financeiros, criadores de conteúdo e empreendedores. Tudo gratuito —
                basta informar seu email.
              </p>

              <div className="flex flex-wrap gap-8">
                {[
                  { valor: "10", label: "Ebooks Financeiros" },
                  { valor: skillItems.length.toString(), label: "Skills de IA" },
                  { valor: "100%", label: "Gratuito" },
                ].map((s) => (
                  <div key={s.label}>
                    <p
                      className="font-serif font-semibold text-[28px] leading-none"
                      style={{
                        background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.valor}
                    </p>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground/60 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeInUp>
          </div>
        </section>

        {/* ─── Tab Selector + Content ────────────────────────────────────── */}
        <section className="py-16 border-t border-white/[0.05]">
          <div className="container mx-auto px-6 lg:px-10">

            {/* Tab Pills */}
            <FadeInUp>
              <div className="flex gap-1 p-1 rounded-sm border border-white/[0.08] bg-card/30 w-fit mb-12 backdrop-blur-sm">
                {([
                  { key: "ebooks", icon: BookOpen, label: "Ebooks Financeiros", count: ebookItems.length },
                  { key: "skills", icon: Zap, label: "Skills IA", count: skillItems.length },
                ] as const).map(({ key, icon: Icon, label, count }) => {
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className="flex items-center gap-2.5 px-5 py-2.5 rounded-sm text-[10.5px] tracking-[0.14em] uppercase font-medium transition-all duration-200"
                      style={
                        active
                          ? {
                              background: "hsl(42 85% 55% / 0.15)",
                              color: "hsl(42 85% 55%)",
                              border: "1px solid hsl(42 85% 55% / 0.28)",
                            }
                          : {
                              color: "hsl(0 0% 48%)",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      <Icon size={12} />
                      {label}
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-sm font-semibold"
                        style={
                          active
                            ? { background: "hsl(42 85% 55% / 0.22)", color: "hsl(42 85% 55%)" }
                            : { background: "hsl(0 0% 12%)", color: "hsl(0 0% 38%)" }
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FadeInUp>

            {/* ── Ebooks Tab ── */}
            {activeTab === "ebooks" && (
              <>
                <FadeInUp delay={0.05}>
                  <p className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground/40 mb-8">
                    {ebookItems.length} ebooks disponíveis — acesso imediato e gratuito
                  </p>
                </FadeInUp>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {ebookItems.map((item, i) => (
                    <FadeInUp key={item.id} delay={Math.min(i * 0.06, 0.4)}>
                      <EbookCard item={item} coverIdx={i} onRead={handleAction} />
                    </FadeInUp>
                  ))}
                </div>
              </>
            )}

            {/* ── Skills Tab ── */}
            {activeTab === "skills" && (
              <>
                {/* Busca */}
                <FadeInUp>
                  <div className="relative max-w-lg mb-10">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <Input
                      placeholder="Buscar skills..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10 bg-card/40 border-white/[0.07] focus:border-gold/30 text-sm placeholder:text-muted-foreground/30"
                    />
                    {busca && (
                      <button
                        onClick={() => setBusca("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </FadeInUp>

                {/* Filtros */}
                <FadeInUp delay={0.05}>
                  <div className="flex flex-wrap gap-2 mb-10">
                    {SKILL_CATEGORIAS.map((cat) => {
                      const ativo = cat === categoriaAtiva;
                      const cor = CATEGORIA_CORES[cat];
                      const count = totalSkillsPorCategoria(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoriaAtiva(cat)}
                          className="flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] tracking-[0.14em] uppercase font-medium transition-all duration-200 border"
                          style={
                            ativo
                              ? { background: `${cor}18`, borderColor: `${cor}50`, color: cor }
                              : { background: "transparent", borderColor: "hsl(0 0% 14%)", color: "hsl(0 0% 50%)" }
                          }
                        >
                          {cat}
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-sm font-semibold"
                            style={
                              ativo
                                ? { background: `${cor}30`, color: cor }
                                : { background: "hsl(0 0% 12%)", color: "hsl(0 0% 40%)" }
                            }
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </FadeInUp>

                {skillsFiltradas.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground/50 text-sm">
                      Nenhuma skill encontrada para{" "}
                      <span className="text-foreground/60">"{busca}"</span>
                    </p>
                    <button
                      onClick={() => { setBusca(""); setCategoriaAtiva("Todas"); }}
                      className="mt-4 text-[10.5px] tracking-[0.16em] uppercase text-gold/60 hover:text-gold transition-colors"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground/40 mb-6">
                      {skillsFiltradas.length} {skillsFiltradas.length === 1 ? "skill encontrada" : "skills encontradas"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {skillsFiltradas.map((item, i) => (
                        <FadeInUp key={item.id} delay={Math.min(i * 0.04, 0.3)}>
                          <ItemCard item={item} onDownload={handleAction} />
                        </FadeInUp>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        <div className="container mx-auto px-6 lg:px-10 pb-12">
          <MesalvaBanner variant="strip" campaign="biblioteca" />
        </div>

        {/* ─── CTA Final ────────────────────────────────────────────────── */}
        <section className="py-24 border-t border-white/[0.05]">
          <div className="container mx-auto px-6 lg:px-10 text-center">
            <FadeInUp>
              <h2
                className="font-serif font-light text-foreground mb-4"
                style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
              >
                Quer ir além do conteúdo?
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto mb-8">
                Agende uma consultoria gratuita e descubra como aplicar essas
                estratégias no seu patrimônio e negócio com orientação personalizada.
              </p>
              <a
                href="https://wa.me/5562994160930?text=Ol%C3%A1%20Rainiere%2C%20vi%20a%20biblioteca%20e%20gostaria%20de%20uma%20consultoria."
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  className="px-8 py-3.5 text-[10.5px] tracking-[0.22em] uppercase font-semibold text-background rounded-sm transition-all duration-200 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, hsl(42 85% 55%), hsl(38 78% 42%))" }}
                >
                  Agendar Consultoria Gratuita
                </button>
              </a>
            </FadeInUp>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
      <BackToTop />

      <LeadModal
        item={itemSelecionado}
        open={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
