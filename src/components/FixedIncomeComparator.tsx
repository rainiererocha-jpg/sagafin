import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Current rates (simulated)
const CDI_RATE = 11.15; // CDI anual
const POUPANCA_RATE = 6.17; // Poupança anual

// IR rates by period
const getIRRate = (months: number): number => {
  if (months <= 6) return 0.225;
  if (months <= 12) return 0.2;
  if (months <= 24) return 0.175;
  return 0.15;
};
interface InvestmentResult {
  name: string;
  grossReturn: number;
  netReturn: number;
  taxes: number;
  finalValue: number;
  isExempt: boolean;
  rate: string;
}
export function FixedIncomeComparator() {
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(12);
  const [cdbRate, setCdbRate] = useState(110); // % do CDI
  const [lciRate, setLciRate] = useState(95); // % do CDI

  const results = useMemo((): InvestmentResult[] => {
    const irRate = getIRRate(months);
    const years = months / 12;

    // Poupança
    const poupancaGross = amount * Math.pow(1 + POUPANCA_RATE / 100, years) - amount;

    // CDB
    const cdbAnnualRate = CDI_RATE * cdbRate / 100 / 100;
    const cdbGross = amount * Math.pow(1 + cdbAnnualRate, years) - amount;
    const cdbTaxes = cdbGross * irRate;
    const cdbNet = cdbGross - cdbTaxes;

    // LCI
    const lciAnnualRate = CDI_RATE * lciRate / 100 / 100;
    const lciGross = amount * Math.pow(1 + lciAnnualRate, years) - amount;

    // LCA (same as LCI for simulation)
    const lcaAnnualRate = CDI_RATE * (lciRate - 2) / 100 / 100;
    const lcaGross = amount * Math.pow(1 + lcaAnnualRate, years) - amount;
    return [{
      name: "Poupança",
      grossReturn: poupancaGross,
      netReturn: poupancaGross,
      taxes: 0,
      finalValue: amount + poupancaGross,
      isExempt: true,
      rate: `${POUPANCA_RATE.toFixed(2)}% a.a.`
    }, {
      name: "CDB",
      grossReturn: cdbGross,
      netReturn: cdbNet,
      taxes: cdbTaxes,
      finalValue: amount + cdbNet,
      isExempt: false,
      rate: `${cdbRate}% CDI`
    }, {
      name: "LCI",
      grossReturn: lciGross,
      netReturn: lciGross,
      taxes: 0,
      finalValue: amount + lciGross,
      isExempt: true,
      rate: `${lciRate}% CDI`
    }, {
      name: "LCA",
      grossReturn: lcaGross,
      netReturn: lcaGross,
      taxes: 0,
      finalValue: amount + lcaGross,
      isExempt: true,
      rate: `${lciRate - 2}% CDI`
    }];
  }, [amount, months, cdbRate, lciRate]);
  const chartData = results.map(r => ({
    name: r.name,
    rendimento: r.netReturn,
    imposto: r.taxes
  }));
  const bestOption = results.reduce((prev, current) => prev.netReturn > current.netReturn ? prev : current);
  const poupancaLoss = results[0].netReturn - bestOption.netReturn;
  return <div className="space-y-8">
      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <label className="text-sm font-medium text-foreground block mb-2">
            Valor a Investir
          </label>
          <p className="text-2xl font-bold text-gold mb-3">
            {formatCurrency(amount)}
          </p>
          <Slider value={[amount]} onValueChange={value => setAmount(value[0])} min={1000} max={500000} step={1000} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>R$ 1.000</span>
            <span>R$ 500.000</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <label className="text-sm font-medium text-foreground block mb-2">
            Prazo
          </label>
          <p className="text-2xl font-bold text-gold mb-3">{months} meses</p>
          <Slider value={[months]} onValueChange={value => setMonths(value[0])} min={3} max={60} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>3 meses</span>
            <span>60 meses</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <label className="text-sm font-medium text-foreground block mb-2">
            Taxa CDB (% CDI)
          </label>
          <p className="text-2xl font-bold text-gold mb-3">{cdbRate}%</p>
          <Slider value={[cdbRate]} onValueChange={value => setCdbRate(value[0])} min={90} max={130} step={1} />
        </div>
      </div>

      {/* Alert */}
      {poupancaLoss > 0 && <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">
              Você está perdendo dinheiro na Poupança!
            </p>
            <p className="text-sm text-muted-foreground">
              Ao manter {formatCurrency(amount)} na Poupança por {months} meses,
              você deixa de ganhar{" "}
              <span className="font-bold text-destructive">
                {formatCurrency(Math.abs(poupancaLoss))}
              </span>{" "}
              comparado ao {bestOption.name}.
            </p>
          </div>
        </div>}

      {/* Results Table */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 font-semibold text-foreground">
                  Produto
                </th>
                <th className="text-right p-4 font-semibold text-foreground">
                  Taxa
                </th>
                <th className="text-right p-4 font-semibold text-foreground">
                  Rendimento Bruto
                </th>
                <th className="text-right p-4 font-semibold text-foreground">
                  IR
                </th>
                <th className="text-right p-4 font-semibold text-foreground">
                  Rendimento Líquido
                </th>
                <th className="text-right p-4 font-semibold text-foreground">
                  Valor Final
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => <tr key={result.name} className={`border-t border-border/50 ${result.name === bestOption.name ? "bg-gold/5" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {result.name}
                      </span>
                      {result.name === bestOption.name && <span className="text-xs bg-gold text-accent-foreground px-2 py-0.5 rounded-full font-semibold">
                          Melhor
                        </span>}
                      {result.isExempt && <span className="text-xs bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded-full">
                          Isento IR
                        </span>}
                    </div>
                  </td>
                  <td className="p-4 text-right text-muted-foreground">
                    {result.rate}
                  </td>
                  <td className="p-4 text-right text-foreground">
                    {formatCurrency(result.grossReturn)}
                  </td>
                  <td className="p-4 text-right text-destructive">
                    {result.taxes > 0 ? `-${formatCurrency(result.taxes)}` : "-"}
                  </td>
                  <td className="p-4 text-right font-semibold text-emerald-600">
                    {formatCurrency(result.netReturn)}
                  </td>
                  <td className="p-4 text-right font-bold text-gold">
                    {formatCurrency(result.finalValue)}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        
        
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Quer descobrir as melhores taxas disponíveis hoje?
        </p>
        <Button variant="hero">
          <TrendingUp className="w-5 h-5 mr-2" />
          Falar com Especialista em Renda Fixa
        </Button>
      </div>
    </div>;
}