import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calculator, Calendar, Percent } from "lucide-react";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CompoundInterestSimulator() {
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(10);

  const chartData = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12;
    const data = [];

    for (let year = 0; year <= years; year++) {
      const months = year * 12;
      let total = initialAmount * Math.pow(1 + monthlyRate, months);

      if (monthlyRate > 0) {
        total +=
          monthlyContribution *
          ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      } else {
        total += monthlyContribution * months;
      }

      const totalContributed = initialAmount + monthlyContribution * months;
      const earnings = total - totalContributed;

      data.push({
        year: `Ano ${year}`,
        total: Math.round(total),
        invested: totalContributed,
        earnings: Math.round(earnings),
      });
    }
    return data;
  }, [initialAmount, monthlyContribution, annualRate, years]);

  const finalValue = chartData[chartData.length - 1];
  const totalInvested = finalValue.invested;
  const totalEarnings = finalValue.earnings;

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Controls */}
        <div className="space-y-6">
          {/* Initial Amount */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-gold" />
              </div>
              <label className="text-sm font-medium text-foreground">
                Investimento Inicial
              </label>
            </div>
            <p className="text-2xl font-bold text-gold mb-3">
              {formatCurrency(initialAmount)}
            </p>
            <Slider
              value={[initialAmount]}
              onValueChange={(value) => setInitialAmount(value[0])}
              min={1000}
              max={500000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>R$ 1.000</span>
              <span>R$ 500.000</span>
            </div>
          </div>

          {/* Monthly Contribution */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gold" />
              </div>
              <label className="text-sm font-medium text-foreground">
                Aporte Mensal
              </label>
            </div>
            <p className="text-2xl font-bold text-gold mb-3">
              {formatCurrency(monthlyContribution)}
            </p>
            <Slider
              value={[monthlyContribution]}
              onValueChange={(value) => setMonthlyContribution(value[0])}
              min={0}
              max={20000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>R$ 0</span>
              <span>R$ 20.000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Annual Rate */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-gold" />
                </div>
                <label className="text-sm font-medium text-foreground">
                  Taxa Anual
                </label>
              </div>
              <p className="text-2xl font-bold text-gold mb-3">{annualRate}%</p>
              <Slider
                value={[annualRate]}
                onValueChange={(value) => setAnnualRate(value[0])}
                min={1}
                max={25}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Years */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-gold" />
                </div>
                <label className="text-sm font-medium text-foreground">
                  Período
                </label>
              </div>
              <p className="text-2xl font-bold text-gold mb-3">{years} anos</p>
              <Slider
                value={[years]}
                onValueChange={(value) => setYears(value[0])}
                min={1}
                max={40}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-navy rounded-xl p-5 text-center shadow-elevated">
              <p className="text-primary-foreground/70 text-sm mb-1">
                Patrimônio Final
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gold">
                {formatCurrency(finalValue.total)}
              </p>
            </div>
            <div className="bg-card rounded-xl p-5 text-center shadow-card border border-border/50">
              <p className="text-muted-foreground text-sm mb-1">
                Rendimentos
              </p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-500">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
              Evolução do Patrimônio
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a826" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d4a826" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorInvested"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a2744" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2744",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stackId="1"
                    stroke="#1a2744"
                    fill="url(#colorInvested)"
                    strokeWidth={2}
                    name="Investido"
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stackId="1"
                    stroke="#d4a826"
                    fill="url(#colorTotal)"
                    strokeWidth={2}
                    name="Rendimentos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-navy-deep" />
                <span className="text-xs text-muted-foreground">
                  Investido: {formatCurrency(totalInvested)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="text-xs text-muted-foreground">
                  Rendimentos: {formatCurrency(totalEarnings)}
                </span>
              </div>
            </div>
          </div>

          <Button variant="hero" className="w-full">
            Quero uma Estratégia Personalizada
          </Button>
        </div>
      </div>
    </div>
  );
}
