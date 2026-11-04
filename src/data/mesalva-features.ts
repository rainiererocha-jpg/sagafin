// Fonte única: scripts/mesalva-features.json (o mesmo usado pelo Diário Saga).
import features from "../../scripts/mesalva-features.json";
import brand from "../../scripts/mesalva-brand.json";

export interface MesalvaFeature {
  id: string;
  kicker: string;
  titulo: string;
  texto: string;
  cta: string;
  anchor: string;
}

export const MESALVA_URL: string = brand.url;
export const MESALVA_SIGNUP_URL: string = brand.signupUrl;
export const MESALVA_FEATURES: MesalvaFeature[] = features;

// 2026-10-08: primeiro dia do rodízio (mesmo EPOCH de scripts/mesalva-ad.mjs)
const EPOCH = Date.UTC(2026, 9, 8);

/** Peça do dia — mesma regra determinística do pipeline do Diário Saga. */
export function featureDoDia(date = new Date()): MesalvaFeature {
  const hoje = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dias = Math.floor((hoje - EPOCH) / 86_400_000);
  const n = MESALVA_FEATURES.length;
  return MESALVA_FEATURES[((dias % n) + n) % n];
}

export type Medium = "site" | "post";
export type Campaign = "home" | "post" | "blog" | "inline" | "biblioteca" | "servicos" | "footer";

function utm(medium: Medium, campaign: Campaign, content: string) {
  return `utm_source=sagafin&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${content}`;
}

export function linkMesalva(medium: Medium, campaign: Campaign, content: string, anchor = "") {
  return `${MESALVA_URL}?${utm(medium, campaign, content)}${anchor}`;
}

export function linkCadastro(medium: Medium, campaign: Campaign, content: string) {
  return `${MESALVA_SIGNUP_URL}&${utm(medium, campaign, content)}`;
}
