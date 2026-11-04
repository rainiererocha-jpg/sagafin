import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";
import {
  type StudyPublic, HORIZON_LABEL, STRATEGY_LABEL, DIRECTION_LABEL, ASSET_LABEL, fmtPct, fmtNum, fmtUSD, tempoRelativo,
} from "@/lib/tradingClient";

const DirIcon = { bullish: TrendingUp, bearish: TrendingDown, neutral: Minus } as const;

function diasAte(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{label}</div>
      <div className="text-sm font-semibold text-foreground tabular-nums truncate">{value}</div>
    </div>
  );
}

export function TradeStudyCard({ study, index = 0 }: { study: StudyPublic; index?: number }) {
  const r = study.resumo || ({} as StudyPublic["resumo"]);
  const Icon = DirIcon[study.direction] ?? Minus;
  const encerrado = study.status !== "open";
  const isShares = study.strategy_type.startsWith("shares");
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-gold/30 hover:shadow-gold transition-all duration-300 overflow-hidden group flex flex-col"
    >
      <div className={`h-1.5 ${encerrado ? "bg-white/10" : "bg-gradient-gold"}`} />
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold bg-gold/10 px-2 py-1 rounded-full">Estudo</span>
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{HORIZON_LABEL[study.horizon]}</span>
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{ASSET_LABEL[study.asset_class]}</span>
          </div>
          {encerrado && (
            <span className={`text-xs font-semibold tabular-nums ${(study.result_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(study.result_pct)}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-serif text-foreground">{study.symbol}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5" /> {DIRECTION_LABEL[study.direction]}
            </span>
          </div>
          <div className="text-sm text-gold/90 mt-1">{STRATEGY_LABEL[study.strategy_type] ?? study.strategy_type}</div>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-3">
          <Stat label="IV rank" value={r.iv_rank != null ? fmtNum(r.iv_rank, 0) : "—"} />
          <Stat label="IVx" value={r.ivx != null ? `${fmtNum(r.ivx, 0)}%` : "—"} />
          <Stat label={isShares ? "Ref." : "Mov. esp."} value={isShares ? fmtNum(r.ref_price) : r.expected_move_pct != null ? `±${fmtNum(r.expected_move_pct, 1)}%` : "—"} />
          <Stat label="DTE" value={r.dte != null ? String(r.dte) : "—"} />
          <Stat label="Risco máx." value={r.max_loss != null ? fmtUSD(r.max_loss) : "indef."} />
          <Stat label="POP teórica" value={r.pop_estimate != null ? `${fmtNum(r.pop_estimate, 0)}%` : "—"} />
        </div>

        {(study.confidence || r.earnings_date) && (
          <div className="flex flex-wrap gap-2">
            {study.confidence && (
              <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${study.confidence === "alta" ? "text-emerald-300 bg-emerald-400/10" : study.confidence === "media" ? "text-gold bg-gold/10" : "text-muted-foreground bg-white/5"}`}>
                confiança {study.confidence === "media" ? "média" : study.confidence}
              </span>
            )}
            {r.earnings_date && diasAte(r.earnings_date) != null && diasAte(r.earnings_date)! >= 0 && diasAte(r.earnings_date)! <= 45 && (
              <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full text-amber-300 bg-amber-400/10">
                balanço em {diasAte(r.earnings_date)} dia{diasAte(r.earnings_date) === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
        <h3 className="text-base font-serif font-semibold text-foreground leading-snug group-hover:text-gold transition-colors">{study.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{study.thesis_public}</p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-[11px] text-muted-foreground/70">
            {encerrado ? `Encerrado · ${study.close_reason ?? ""}` : `Atualizado ${tempoRelativo(study.updated_at)}`}
          </span>
          <Link to={`/trading/${study.slug}`} className="text-gold text-sm font-medium hover:underline flex items-center gap-1">
            <Lock className="w-3 h-3 opacity-60" /> Estudo completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
