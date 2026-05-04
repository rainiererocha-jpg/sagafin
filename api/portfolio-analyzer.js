export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { perfil, horizonte, carteira, patrimonio, objetivo } = req.body || {};

  if (!carteira || !perfil) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key não configurada" });
  }

  const patrimonioLabel = {
    "ate-100k": "até R$ 100 mil",
    "100-500k": "entre R$ 100 mil e R$ 500 mil",
    "500k-2m": "entre R$ 500 mil e R$ 2 milhões",
    "acima-2m": "acima de R$ 2 milhões",
  }[patrimonio] || patrimonio;

  const objetivoLabel = {
    "crescimento": "crescimento de patrimônio",
    "renda": "geração de renda passiva",
    "aposentadoria": "aposentadoria",
    "protecao": "proteção do patrimônio",
  }[objetivo] || objetivo;

  const prompt = `Você é o sistema de análise de carteira do assessor Rainiere Rocha, credenciado XP Investimentos.

Analise a carteira abaixo e gere um diagnóstico profissional, personalizado e acionável.

PERFIL DO INVESTIDOR:
- Patrimônio estimado: ${patrimonioLabel}
- Objetivo principal: ${objetivoLabel}
- Horizonte de investimento: ${horizonte}
- Perfil de risco: ${perfil}

CARTEIRA ATUAL INFORMADA PELO INVESTIDOR:
${carteira}

CONTEXTO DE MERCADO ATUAL (Abril 2026):
- Selic: 13,75% ao ano
- IPCA acumulado 12 meses: ~5,5%
- CDI: ~13,65% ao ano
- Ibovespa: próximo de 130.000 pontos
- Dólar: ~R$ 5,08

Gere um diagnóstico estruturado com os seguintes títulos exatos em HTML:

<h2>📊 Diagnóstico da Carteira</h2>
[2-3 parágrafos analisando o que foi informado: concentração, diversificação, adequação ao perfil]

<h2>⚠️ Pontos de Atenção</h2>
[Lista com os principais riscos ou desalinhamentos identificados]

<h2>🎯 Oportunidades para o Seu Perfil</h2>
[2-3 oportunidades concretas baseadas no perfil e no momento de mercado — sem nomear produtos específicos de bancos, apenas classes de ativos e estratégias]

<h2>📋 Próximos Passos Recomendados</h2>
[Lista de ações concretas que o investidor deveria tomar]

<h2>💡 Nota do Assessor</h2>
[Parágrafo final humanizado, assinado como "Rainiere Rocha · Assessor XP", destacando que este é um diagnóstico automatizado e que uma conversa personalizada permitirá aprofundar as recomendações]

Use linguagem clara, profissional mas acessível para o investidor pessoa física brasileiro. Seja específico, use números do contexto de mercado onde relevante. Limite a 600 palavras no total.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic error:", err);
      return res.status(502).json({ error: "Erro ao processar análise" });
    }

    const data = await anthropicRes.json();
    const analysis = data.content?.[0]?.text || "";

    // Also save lead to Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          name: "Diagnóstico IA",
          investment_range: patrimonio,
          message: `Perfil: ${perfil} | Objetivo: ${objetivoLabel} | Horizonte: ${horizonte} | Canal: Diagnóstico IA`,
          source: "diagnostico_ia",
        }),
      }).catch(() => {}); // silent fail
    }

    return res.status(200).json({ analysis });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
