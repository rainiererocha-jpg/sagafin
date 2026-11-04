import { useMemo, useState } from "react";
import { Calculator, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Panel } from "@/lib/tradingClient";

// Referências estáticas (fonte e data citadas na tela). Revisar a cada semestre.
const PISO_FGV = 0.16; // FGVcef, set/2026: piso estimado de patrimônio no exterior para proteger o consumo
const PESO_BRASIL = 0.0025; // MSCI ACWI IMI, jun/2026

const WA_BASE = "https://wa.me/5562994160930?text=";

const brl = (v: number, dec = 0) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: dec, maximumFractionDigits: dec });
const usd = (v: number) => `US$ ${Math.round(v).toLocaleString("pt-BR")}`;
const pct = (v: number, dec = 1) => `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`;
const pctSinal = (v: number) => `${v > 0 ? "+" : ""}${pct(v)}`;

/** Converte "1.250.000" / "1250000,50" / "R$ 200 mil" em número. */
function parseValor(s: string): number {
  const t = s.toLowerCase().replace(/r\$|\s/g, "");
  const mult = t.endsWith("mi") ? 1e6 : t.endsWith("mil") ? 1e3 : 1;
  const num = t.replace(/(mil|mi)$/, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(num);
  return Number.isFinite(n) && n > 0 ? n * mult : 0;
}

function formatarDigitado(s: string): string {
  const digitos = s.replace(/\D/g, "");
  if (!digitos) return "";
  return Number(digitos).toLocaleString("pt-BR");
}

function Campo({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-lg bg-background/60 border border-white/10 focus-within:border-gold/60">
        <span className="pl-3 text-sm text-muted-foreground">R$</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(formatarDigitado(e.target.value))}
          placeholder="0"
          className="h-11 w-full bg-transparent px-2 text-base text-foreground tabular-nums placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>
      <span className="text-[11px] text-muted-foreground/70">{hint}</span>
    </label>
  );
}

function Barra({ atual }: { atual: number }) {
  const max = Math.max(0.4, atual * 1.15);
  const pos = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="relative pt-6 pb-7">
      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold" style={{ width: pos(atual) }} />
      </div>
      <div className="absolute top-0 -translate-x-1/2 text-[10px] text-gold font-semibold whitespace-nowrap" style={{ left: pos(atual) }}>você: {pct(atual)}</div>
      <div className="absolute top-4 h-7 w-px bg-white/60" style={{ left: pos(PISO_FGV) }} />
      <div className="absolute bottom-0 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap" style={{ left: pos(PISO_FGV) }}>piso FGV 16%</div>
    </div>
  );
}

export function CalculadoraDolar({ panel }: { panel: Panel | null }) {
  const [patrimonioTxt, setPatrimonioTxt] = useState("");
  const [dolarTxt, setDolarTxt] = useState("");

  const cambio = panel?.usdbrl?.last ?? null;
  const ret12 = useMemo(() => {
    const b = panel?.base100;
    if (!b?.length) return null;
    const ult = b[b.length - 1];
    return { spxBrl: ult.spx_brl / 100 - 1, ibov: ult.ibov / 100 - 1, periodo: panel?.decomp12m?.periodo ?? null };
  }, [panel]);

  const r = useMemo(() => {
    const total = parseValor(patrimonioTxt);
    const emDolar = parseValor(dolarTxt);
    if (!total) return null;
    if (emDolar > total) return { erro: "O valor em dólar não pode ser maior que o patrimônio total." } as const;
    const w = emDolar / total;
    const alvo = total * PISO_FGV;
    const falta = Math.max(0, alvo - emDolar);
    const choque = emDolar * 0.1;
    const hist = ret12
      ? {
          atual: (1 - w) * ret12.ibov + w * ret12.spxBrl,
          piso: (1 - Math.max(w, PISO_FGV)) * ret12.ibov + Math.max(w, PISO_FGV) * ret12.spxBrl,
        }
      : null;
    return { total, emDolar, w, alvo, falta, choque, hist } as const;
  }, [patrimonioTxt, dolarTxt, ret12]);

  const waMsg = r && !("erro" in r)
    ? `Olá Rainiere, usei a calculadora do sagafin.com.br/trading: hoje tenho cerca de ${pct(r.w, 0)} do patrimônio em dólar. Quero entender como investir no exterior pela XP.`
    : "Olá Rainiere, vi a calculadora de exposição ao dólar no sagafin.com.br/trading e quero entender como investir no exterior pela XP.";

  return (
    <div id="calculadora" className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-5 md:p-8 scroll-mt-28">
      <div className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-semibold mb-2">
        <Calculator className="w-3.5 h-3.5" /> Calculadora
      </div>
      <h3 className="text-2xl font-serif text-foreground">Quanto do seu patrimônio está em dólar?</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        Informe valores aproximados. Nada é enviado ou gravado: a conta é feita no seu navegador.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Campo label="Patrimônio investido total" hint="Somando Brasil e exterior: renda fixa, ações, fundos, previdência." value={patrimonioTxt} onChange={setPatrimonioTxt} />
        <Campo label="Quanto já está em dólar" hint="Conta no exterior, ETFs, BDRs, fundos cambiais ou globais. Se não tiver, deixe em branco." value={dolarTxt} onChange={setDolarTxt} />
      </div>

      {r && "erro" in r && <p className="text-sm text-red-400 mt-4">{r.erro}</p>}

      {r && !("erro" in r) && (
        <div className="mt-8 grid gap-6">
          <div>
            <div className="text-sm text-foreground">
              Hoje, <span className="text-gold font-semibold tabular-nums">{pct(r.w)}</span> do seu patrimônio está em dólar.
              {" "}O Brasil representa {pct(PESO_BRASIL, 2)} do mercado global de ações.
            </div>
            <Barra atual={r.w} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Distância do piso de 16%</div>
              {r.falta > 0 ? (
                <>
                  <div className="text-xl font-serif text-foreground mt-1 tabular-nums">{brl(r.falta)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{cambio ? `≈ ${usd(r.falta / cambio)} ao câmbio de ${cambio.toFixed(2).replace(".", ",")}` : "valor em reais"}</div>
                </>
              ) : (
                <>
                  <div className="text-xl font-serif text-foreground mt-1">Acima do piso</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{brl(r.emDolar - r.alvo)} além dos 16% de referência</div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Se o dólar variar 10%</div>
              <div className="text-xl font-serif text-foreground mt-1 tabular-nums">± {brl(r.choque)}</div>
              <div className="text-[11px] text-muted-foreground mt-1">é quanto a parte em dólar muda, em reais ({pct(r.choque / r.total)} do total)</div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Retrovisor de 12 meses</div>
              {r.hist ? (
                <>
                  <div className="text-sm text-foreground mt-1 tabular-nums">Sua divisão: <span className="font-semibold">{pctSinal(r.hist.atual)}</span></div>
                  <div className="text-sm text-foreground tabular-nums">Com {pct(Math.max(r.w, PISO_FGV), 0)} em dólar: <span className="font-semibold">{pctSinal(r.hist.piso)}</span></div>
                  <div className="text-[11px] text-muted-foreground mt-1">Ibovespa e S&P 500 em reais{ret12?.periodo ? `, ${ret12.periodo.split(" a ").map((d) => d.split("-").reverse().join("/")).join(" a ")}` : ""}.</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">Série indisponível no momento.</div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="text-sm text-foreground/90 flex-1">
              A proporção adequada depende do seu perfil, prazo e objetivos. Uma conversa ajuda a escolher entre conta internacional, ETFs, BDRs e fundos globais, com custos e impostos de cada caminho.
            </p>
            <a href={WA_BASE + encodeURIComponent(waMsg)} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button variant="gold"><MessageCircle className="w-4 h-4 mr-2" /> Conversar com o assessor</Button>
            </a>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-6">
        Simulação educacional, não constitui recomendação nem análise do seu perfil (suitability). O piso de 16% é a estimativa do estudo FGVcef (set/2026) para proteção do consumo, não uma alocação indicada para você. O "retrovisor" aplica a sua divisão ao Ibovespa e ao S&P 500 convertido em reais nos últimos 12 meses, sem custos, impostos ou rebalanceamento; rentabilidade passada não garante resultados futuros.
      </p>
    </div>
  );
}
