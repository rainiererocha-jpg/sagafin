// Prompt e validação do conteúdo social gerado pelo Claude (carrossel + stories + legendas).
import { checarCompliance } from "../lib/compliance.mjs";
import { CTA_KEYWORD, linkManual } from "./pilares.mjs";

export const N_SLIDES = 6; // capa + 5 de conteúdo; o slide de CTA é fixo (render.mjs) → 7 no total

const GANCHOS = `Padrões de gancho que já funcionaram no perfil (adapte, não copie):
- Número concreto + consequência ("O dólar foi a R$ 5,78. O que isso faz com a sua viagem e com a sua carteira")
- Mito x verdade ("A maioria acha que... Isso é mito.")
- Pergunta de dor ("Ganha bem e não sobra nada no fim do mês?")
- Erro comum ("O erro que trava sua aposentadoria")
- Comparação ("FII ou imóvel na planta?")
Estrutura do miolo (SPIN): situação → problema → implicação → ganho.`;

export function montarPrompt({ pilar, fonteTitulo, fonteTexto, tema, dataExtenso }) {
  const contexto =
    pilar === "evergreen"
      ? `Tema evergreen do dia: ${tema}\n\nMaterial de base (capítulo do Manual Completo do Investidor):\n${fonteTexto}`
      : pilar === "trading"
        ? `Fonte: o resumo semanal dos Destaques de Trading (estudos EDUCACIONAIS, nunca recomendação).\nTítulo: ${fonteTitulo}\n\n${fonteTexto}`
        : `Fonte: o Diário Saga de hoje (${dataExtenso}).\nTítulo: ${fonteTitulo}\n\n${fonteTexto}`;

  return `Você é o redator de redes sociais de Rainiere Rocha, assessor de investimentos (XP via InvestSmart, Goiânia), marca "Saga Financeira".
Público: pessoas físicas brasileiras de renda média-alta (servidores, profissionais liberais, empresários) que querem investir melhor.
Tom: claro, direto, didático, confiante sem arrogância; frases curtas; português do Brasil; zero jargão sem explicação.

${contexto}

${GANCHOS}

REGRAS DE COMPLIANCE (CVM 178/20) — obrigatórias:
- Conteúdo educacional. Nunca recomende comprar, vender ou montar operação com ativo específico; nada de "compre", "venda", "preço-alvo", "garantido", "imperdível", "não perca", "oportunidade".
- Use SOMENTE números que aparecem no material acima. Não invente cotações, datas ou percentuais.
- Sem promessa de rentabilidade.

Gere um JSON (somente o JSON, sem crases) neste formato:
{
  "titulo": "título interno curto",
  "gancho": "a frase do slide de capa (até 90 caracteres)",
  "slides": [
    {"titulo": "capa: o gancho", "subtitulo": "1 frase que promete o que a pessoa vai entender"},
    {"kicker": "rótulo curto", "titulo": "até 70 caracteres", "destaque": "opcional: número/curto do material", "texto": "até 230 caracteres"},
    ... exatamente ${N_SLIDES} itens no total (capa + ${N_SLIDES - 1} de conteúdo; o último de conteúdo fecha com "o que isso muda para você")
  ],
  "stories": [
    {"tipo": "dado", "rotulo": "ex.: Dólar", "valor": "ex.: R$ 5,78", "variacao": "ex.: +2,53%", "comentario": "1 frase de contexto"},
    {"tipo": "dado", ...},
    {"tipo": "insight", "kicker": "O que isso muda para você", "texto": "até 180 caracteres"}
  ],
  "caption_instagram": "legenda de 600 a 1.100 caracteres: gancho na 1ª linha, miolo em parágrafos curtos, emojis com moderação, SEM CTA e SEM hashtags (eu acrescento)",
  "caption_linkedin": "versão analítica de 900 a 1.500 caracteres, tom profissional, sem emojis, SEM CTA (eu acrescento)",
  "hashtags": ["5 hashtags sem #"]
}
${pilar === "evergreen" ? 'Para tema evergreen, os stories "dado" usam números do material (ex.: "Dedução máxima", "12%"); se não houver dados, use 2 stories "insight".' : ""}`;
}

/** Rodapés fixos de CTA por rede (palavra-chave + link rastreável + aviso). */
export function legendasFinais(c, { utm, site }) {
  const tags = (c.hashtags || []).slice(0, 5).map((h) => `#${String(h).replace(/^#/, "").replace(/\s+/g, "")}`).join(" ");
  const aviso = "Conteúdo educacional. Não é recomendação de investimento.";
  const ctaIg =
    `\n\n💬 Comente ${CTA_KEYWORD} que eu te mando no direct o Manual Completo do Investidor, grátis: da organização financeira ao mercado futuro.` +
    `\n📚 Ou acesse sagafin.com.br/manual\n\n${aviso}\n\n${tags}`;
  const ctaFb =
    `\n\n💬 Comente ${CTA_KEYWORD} e receba o Manual Completo do Investidor, grátis.` +
    `\n📚 Link direto: ${linkManual("facebook", utm, site)}\n\n${aviso}`;
  const ctaLi =
    `\n\nPreparei um Manual Completo do Investidor, da organização financeira ao mercado futuro, gratuito: ${linkManual("linkedin", utm, site)}` +
    `\n\n${aviso}`;
  // Corta o corpo (nunca o rodapé com CTA/aviso) para caber no limite de cada rede.
  const caber = (corpo, rodape, max) => {
    const b = corpo.trim();
    return b.length + rodape.length <= max ? b + rodape : `${b.slice(0, max - rodape.length - 1).trimEnd()}…${rodape}`;
  };
  return {
    caption_instagram: caber(c.caption_instagram, ctaIg, 2200),
    caption_facebook: caber(c.caption_instagram, ctaFb, 5000),
    caption_linkedin: caber(c.caption_linkedin, ctaLi, 3000),
  };
}

/** Valida estrutura e compliance. Devolve lista de problemas (vazia = ok). */
export function validar(c) {
  const erros = [];
  if (!c || typeof c !== "object") return ["resposta não é JSON"];
  if (!Array.isArray(c.slides) || c.slides.length !== N_SLIDES) erros.push(`slides deve ter ${N_SLIDES} itens`);
  if (!Array.isArray(c.stories) || c.stories.length < 2 || c.stories.length > 4) erros.push("stories deve ter de 2 a 4 itens");
  if (!c.caption_instagram || c.caption_instagram.length < 250) erros.push("caption_instagram curta");
  if (!c.caption_linkedin || c.caption_linkedin.length < 400) erros.push("caption_linkedin curta");
  (c.slides || []).forEach((s, i) => {
    if (!s?.titulo) erros.push(`slide ${i + 1} sem título`);
    if (i > 0 && !s?.texto) erros.push(`slide ${i + 1} sem texto`);
    if (String(s?.titulo || "").length > 120) erros.push(`slide ${i + 1}: título longo`);
    if (String(s?.texto || "").length > 320) erros.push(`slide ${i + 1}: texto longo`);
  });
  (c.stories || []).forEach((s, i) => {
    if (s?.tipo === "dado" && (!s.rotulo || !s.valor)) erros.push(`story ${i + 1}: dado incompleto`);
    if (s?.tipo !== "dado" && !s?.texto) erros.push(`story ${i + 1}: insight sem texto`);
  });
  const tudo = JSON.stringify(c);
  const proibida = checarCompliance(tudo);
  if (proibida) erros.push(`expressão vedada pelo compliance: "${proibida}"`);
  return erros;
}
