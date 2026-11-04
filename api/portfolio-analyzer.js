async function marketContext(req) {
  const data = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await fetch(`https://${host}/api/quotes`);
    const { quotes } = await r.json();
    const f = (k, d = 2) =>
      quotes[k] ? quotes[k].value.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "n/d";
    const linhas = [
      `- Meta Selic: ${f("SELIC")}% ao ano`,
      `- CDI: ${f("CDI")}% ao ano`,
      `- IPCA último mês: ${f("IPCA")}%`,
      `- Ibovespa: ${f("IBOV", 0)} pontos`,
      `- Dólar: R$ ${f("USD/BRL")}`,
    ].join("\n");
    return { data, linhas };
  } catch {
    return { data, linhas: "- Dados de mercado em tempo real indisponíveis; não cite números de mercado específicos." };
  }
}

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

  const contexto = await marketContext(req);

  const prompt = `Você é o sistema de análise de carteira do assessor Rainiere Rocha, assessor de investimentos vinculado à InvestSmart, escritório credenciado à XP Investimentos.

Analise a carteira abaixo e gere um diagnóstico profissional, personalizado e acionável.

PERFIL DO INVESTIDOR:
- Patrimônio estimado: ${patrimonioLabel}
- Objetivo principal: ${objetivoLabel}
- Horizonte de investimento: ${horizonte}
- Perfil de risco: ${perfil}

CARTEIRA ATUAL INFORMADA PELO INVESTIDOR:
${carteira}

CONTEXTO DE MERCADO ATUAL (${contexto.data}):
${contexto.linhas}

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
[Parágrafo final humanizado, assinado como "Rainiere Rocha · InvestSmart | XP", destacando que este é um diagnóstico automatizado e que uma conversa personalizada permitirá aprofundar as recomendações]

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
        model: "claude-sonnet-5-5",
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

    // Também registra o lead no Supabase (tabela public.leads).
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const r = await fetch(`${supabaseUrl}/rest/v1/leads`, {
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
        });
        if (!r.ok) console.error("Supabase leads insert failed:", r.status, await r.text());
      } catch (e) {
        console.error("Supabase leads insert error:", e);
      }
    } else {
      console.warn("Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY); lead não salvo.");
    }

    return res.status(200).json({ analysis });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
