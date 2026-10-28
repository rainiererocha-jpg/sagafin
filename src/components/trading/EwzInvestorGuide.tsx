const CARDS: { titulo: string; texto: string }[] = [
  {
    titulo: "Brasil em dólar",
    texto: "O EWZ é um ETF negociado nos EUA que replica o índice MSCI Brazil 25/50. Quem o compra tem exposição a ações brasileiras sem sair do dólar, e o resultado soma o desempenho das ações e o câmbio.",
  },
  {
    titulo: "Relação com dólar e Ibovespa",
    texto: "O EWZ costuma andar com o Ibovespa, mas é cotado em dólar. Quando o real se desvaloriza, o EWZ pode cair mesmo com a bolsa local estável. Compare o gráfico dele com o do USD/BRL acima.",
  },
  {
    titulo: "Concentração",
    texto: "Poucos papéis pesam muito: os dez maiores somam mais da metade do fundo. Petrobras, Vale e grandes bancos movem boa parte do resultado. A tabela acima mostra os pesos atuais.",
  },
  {
    titulo: "Custos e dividendos",
    texto: "O EWZ cobra taxa de administração anual e distribui proventos em dólar, sujeitos à tributação americana na fonte. Confira os números vigentes no site da gestora antes de qualquer decisão.",
  },
  {
    titulo: "Volatilidade implícita",
    texto: "O IV rank mostra se a volatilidade esperada pelo mercado está alta ou baixa frente ao último ano. É um dado usado nos estudos de opções desta página e aparece na barra de contexto, no topo.",
  },
  {
    titulo: "Riscos",
    texto: "Risco-país, ciclo de commodities, política fiscal, câmbio e liquidez em horários distintos entre B3 e Nova York. Produtos em dólar no exterior têm regras próprias de tributação e custódia.",
  },
];

export function EwzInvestorGuide() {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">O que o investidor procura sobre o EWZ</span>
      <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <div key={c.titulo} className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
            <h4 className="text-base font-serif text-foreground mb-2">{c.titulo}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.texto}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground/60">Conteúdo educacional, não é recomendação de investimento.</p>
    </div>
  );
}
