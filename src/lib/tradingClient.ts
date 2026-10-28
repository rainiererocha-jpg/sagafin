// Acesso público (anon) aos Destaques de Trading: view de resumo + RPCs com security definer.
import { supabase } from "@/lib/supabaseClient";

export type Horizon = "daily" | "weekly" | "monthly" | "semiannual" | "long_term";
export type StudyStatus = "open" | "closed" | "invalidated";

export interface StudyResumo {
  iv_rank: number | null;
  ivx: number | null;
  iv_pct: number | null;
  liquidity: number | null;
  dte: number | null;
  expected_move_pct: number | null;
  ref_price: number | null;
  ref_time: string | null;
  pop_estimate: number | null;
  max_loss: number | null;
  max_profit: number | null;
  credit_or_debit: string | null;
}

export interface StudyPublic {
  slug: string;
  status: StudyStatus;
  horizon: Horizon;
  symbol: string;
  asset_class: "etf_us" | "stock_us" | "adr_br" | "etf_br";
  strategy_type: string;
  direction: "neutral" | "bullish" | "bearish";
  title: string;
  thesis_public: string;
  confidence: "baixa" | "media" | "alta" | null;
  resumo: StudyResumo;
  published_at: string;
  expires_at: string | null;
  closed_at: string | null;
  close_reason: string | null;
  result_pct: number | null;
  chart_url: string | null;
  updated_at: string;
}

export interface Leg {
  side: "buy" | "sell";
  right: "call" | "put" | "shares";
  strike: number | null;
  expiration: string | null;
  delta: number | null;
  mid: number | null;
  qty?: number;
}

export interface StudyDetail extends Omit<StudyPublic, "resumo"> {
  metrics: Record<string, unknown> & Partial<StudyResumo> & { expected_move?: number | null; expiration?: string | null; trend?: Record<string, number | boolean | null> | null; adr_premio_pct?: number | null };
  unlocked: boolean;
  result_note?: string | null;
  thesis_full?: string;
  legs?: Leg[];
  risk?: {
    credit_or_debit?: string; credit?: number | null; debit?: number | null;
    max_loss?: number | null; max_profit?: number | null; undefined_risk?: boolean;
    breakevens?: number[]; pop_estimate?: number | null; bp_effect?: number | null; theta_day?: number | null;
    dte?: number | null; expiration?: string | null; invalidation?: { below?: number | null; above?: number | null };
  };
  invalidation?: string;
  management?: string;
  scenario_bull?: string;
  scenario_base?: string;
  scenario_bear?: string;
  entry_ref_price?: number | null;
  close_ref_price?: number | null;
  marks?: { marked_at: string; ref_price: number | null; pnl_pct: number | null }[];
}

export interface TrackRecord {
  total: { n: number; wins: number; media: number | null; mediana: number | null };
  por_horizonte: Record<string, { n: number; wins: number; media: number | null; mediana: number | null; melhor: number | null; pior: number | null }>;
  abertos: number;
  metodo: string;
}

export interface Contexto {
  captured_at: string | null;
  slot: string | null;
  macro: Record<string, unknown> | null;
  brasil: Record<string, { iv_rank: number | null; ivx: number | null; liquidity: number | null; ref_price: number | null; premio_pct: number | null }>;
}

const EMAIL_KEY = "saga_subscriber_email";

export function getSubscriberEmail(): string | null {
  try { return localStorage.getItem(EMAIL_KEY); } catch { return null; }
}
export function setSubscriberEmail(email: string) {
  try { localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase()); } catch { /* privado/sem storage */ }
}

export async function listStudies(): Promise<StudyPublic[]> {
  const { data, error } = await supabase
    .from("trade_studies_public")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data ?? []) as StudyPublic[];
}

export async function getStudy(slug: string, email: string | null): Promise<StudyDetail | null> {
  const { data, error } = await supabase.rpc("get_trade_study", { p_slug: slug, p_email: email });
  if (error) throw error;
  return (data as StudyDetail | null) ?? null;
}

export async function getTrackRecord(): Promise<TrackRecord | null> {
  const { data, error } = await supabase.rpc("trading_track_record");
  if (error) throw error;
  return (data as TrackRecord) ?? null;
}

export async function getContexto(): Promise<Contexto | null> {
  const { data, error } = await supabase.rpc("trading_contexto");
  if (error) throw error;
  return (data as Contexto) ?? null;
}

export const HORIZON_LABEL: Record<Horizon, string> = {
  daily: "Diário", weekly: "Semanal", monthly: "Mensal", semiannual: "Semestral", long_term: "Longo prazo",
};
export const HORIZON_ORDER: Horizon[] = ["daily", "weekly", "monthly", "semiannual", "long_term"];

export const STRATEGY_LABEL: Record<string, string> = {
  short_put_spread: "Venda de put spread", short_call_spread: "Venda de call spread", iron_condor: "Iron condor",
  short_strangle: "Strangle vendido", covered_call: "Covered call", long_call_spread: "Compra de call spread",
  long_put_spread: "Compra de put spread", shares_trend: "Tendência (ações)", shares_relative_value: "Valor relativo ADR × B3",
  shares_mean_reversion: "Reversão à média (ações)", event_study: "Estudo de evento",
};
export const DIRECTION_LABEL = { neutral: "Neutro", bullish: "Altista", bearish: "Baixista" } as const;
export const ASSET_LABEL = { etf_us: "ETF EUA", stock_us: "Ação EUA", adr_br: "ADR Brasil", etf_br: "ETF Brasil" } as const;

export function fmtPct(v: number | null | undefined, dec = 1) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(dec).replace(".", ",")}%`;
}
export function fmtNum(v: number | null | undefined, dec = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function fmtUSD(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `US$ ${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
export function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "há menos de 1 h";
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}
