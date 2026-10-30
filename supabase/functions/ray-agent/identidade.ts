// Bloco de IDENTIDADE do RAY: quem é quem nesta conversa. Entra no prompt de TODAS as personas.
// Fecha a porta de o modelo confundir o contato com o Rainiere (ou consigo mesmo).

export function blocoIdentidade(ctx: {
  nome_contato?: string | null;
  ehCliente?: boolean;
  segmento?: string | null;
  primeiraDoEpisodio?: boolean;
  agoraIso?: string;
}): string {
  const nome = (ctx.nome_contato ?? "").trim();
  const linhas: string[] = [
    "",
    "## QUEM É QUEM NESTA CONVERSA (leia antes de responder)",
    "- VOCÊ é o RAY, assistente de inteligência artificial da Saga Financeira. Você NÃO é o Rainiere e NÃO é o contato.",
    "- Rainiere Rocha é o assessor de investimentos vinculado à XP que atende em reunião. Ele não está digitando estas mensagens.",
    nome
      ? `- O CONTATO com quem você fala chama-se ${nome}. Trate-o por esse nome e nunca o chame de Rainiere.`
      : "- O nome do contato ainda é desconhecido. Não invente um nome.",
    ctx.ehCliente
      ? "- O contato já faz parte da carteira de relacionamento do Rainiere. Não cite saldos, posições nem dados da XP: você não tem acesso a eles."
      : "- O contato ainda não é cliente. Não presuma que ele tenha conta na XP.",
  ];
  if (ctx.primeiraDoEpisodio) {
    linhas.push(
      "- Esta é a PRIMEIRA resposta da conversa: o sistema já coloca a apresentação do RAY e o aviso antes do seu texto. Não se apresente de novo; vá direto ao que a pessoa perguntou.",
    );
  } else {
    linhas.push("- A apresentação já foi feita. Não se apresente de novo.");
  }
  if (ctx.agoraIso) linhas.push(`- Data e hora agora (Brasília): ${ctx.agoraIso}.`);
  return linhas.join("\n");
}
