// Composição aproximada do iShares MSCI Brazil ETF (EWZ).
// Atualizar todo mês a partir do CSV de holdings da iShares e ajustar `as_of`.
// Pesos arredondados: servem de referência educacional, não substituem o documento oficial do fundo.
export const EWZ_AS_OF = "2026-09-30";
export const EWZ_SOURCE = "iShares (holdings), pesos aproximados";

// `yahoo` é o símbolo consultado; ações da B3 usam sufixo .SA.
export const EWZ_HOLDINGS = [
  { ticker: "VALE3", yahoo: "VALE3.SA", name: "Vale", weight: 10.0, sector: "Materiais" },
  { ticker: "NU", yahoo: "NU", name: "Nu Holdings", weight: 9.0, sector: "Financeiro" },
  { ticker: "ITUB4", yahoo: "ITUB4.SA", name: "Itaú Unibanco", weight: 8.5, sector: "Financeiro" },
  { ticker: "PETR4", yahoo: "PETR4.SA", name: "Petrobras PN", weight: 7.5, sector: "Energia" },
  { ticker: "PETR3", yahoo: "PETR3.SA", name: "Petrobras ON", weight: 5.0, sector: "Energia" },
  { ticker: "BBAS3", yahoo: "BBAS3.SA", name: "Banco do Brasil", weight: 4.0, sector: "Financeiro" },
  { ticker: "B3SA3", yahoo: "B3SA3.SA", name: "B3", weight: 3.8, sector: "Financeiro" },
  { ticker: "ABEV3", yahoo: "ABEV3.SA", name: "Ambev", weight: 3.5, sector: "Consumo" },
  { ticker: "WEGE3", yahoo: "WEGE3.SA", name: "WEG", weight: 3.2, sector: "Industrial" },
  { ticker: "BPAC11", yahoo: "BPAC11.SA", name: "BTG Pactual", weight: 3.0, sector: "Financeiro" },
];
