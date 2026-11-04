import { describe, expect, it } from "vitest";
import {
  DISCLAIMER_CURTO, detectaOptIn, detectaOptOut, pedeHumano, posFiltro, preFiltro,
} from "../supabase/functions/_shared/guarda.ts";

describe("preFiltro: redireciona pedidos de recomendação pessoal", () => {
  const deve: [string, string][] = [
    ["compro PETR4?", "ativo"],
    ["Vale a pena comprar HGLG11 agora?", "ativo"],
    ["devo vender VALE3?", "ativo"],
    ["Devo comprar Tesouro Selic?", "recomendacao"],
    ["vale a pena investir em bitcoin?", "recomendacao"],
    ["qual ação eu compro?", "recomendacao"],
    ["Qual a melhor ação para comprar hoje", "recomendacao"],
    ["qual o melhor FII pra investir", "recomendacao"],
    ["me recomenda um fundo", "recomendacao"],
    ["o que você recomenda?", "recomendacao"],
    ["posso colocar 50% em FII?", "alocacao"],
    ["quero colocar 30% do meu dinheiro em ações", "alocacao"],
    ["quanto devo investir em renda fixa?", "alocacao"],
    ["como distribuir meu patrimônio?", "alocacao"],
    ["analisa minha carteira", "carteira"],
    ["minha carteira está boa?", "carteira"],
    ["o que você acha dos meus investimentos?", "carteira"],
  ];
  it.each(deve)("redireciona: %s", (texto, categoria) => {
    const d = preFiltro(texto);
    expect(d.redirecionar).toBe(true);
    expect(d.categoria).toBe(categoria);
    expect(d.resposta).toContain("Rainiere");
    expect(d.resposta).toContain(DISCLAIMER_CURTO);
  });

  const naoDeve = [
    "o que é PETR4?",
    "O que é um FII?",
    "como funciona o CDB?",
    "qual a diferença entre ação e FII?",
    "como é tributado o Tesouro Selic?",
    "o que é alocação de ativos?",
    "o que é o FGC?",
    "oi",
    "",
  ];
  it.each(naoDeve)("deixa passar: %s", (texto) => {
    expect(preFiltro(texto).redirecionar).toBe(false);
  });
});

describe("pedeHumano", () => {
  it.each(["quero falar com o Rainiere", "quero falar com um humano", "pode me passar para um atendente?", "humano"])(
    "detecta: %s",
    (t) => expect(pedeHumano(t)).toBe(true),
  );
  it.each(["o que é CDB?", "o Rainiere é assessor da XP?"])("ignora: %s", (t) => expect(pedeHumano(t)).toBe(false));
});

describe("posFiltro", () => {
  it("bloqueia a palavra golpe", () => {
    const r = posFiltro("Cuidado com golpe de investimento.");
    expect(r.bloqueado).toBe(true);
    expect(r.motivos).toContain("palavra_proibida");
    expect(r.texto).not.toMatch(/golpe/i);
  });
  it("bloqueia fraude e derivados, mesmo negados", () => {
    expect(posFiltro("Isso não é fraude.").bloqueado).toBe(true);
    expect(posFiltro("Há risco de fraudes.").bloqueado).toBe(true);
    expect(posFiltro("Cuidado com golpistas.").bloqueado).toBe(true);
  });
  it("bloqueia compre / venda agora", () => {
    expect(posFiltro("Compre esse fundo hoje.").motivos).toContain("ordem_compra_venda");
    expect(posFiltro("Venda agora antes que caia.").motivos).toContain("ordem_compra_venda");
  });
  it("não bloqueia a negação educativa de compre", () => {
    expect(posFiltro("Eu não digo compre ou venda, só explico conceitos.").bloqueado).toBe(false);
  });
  it("bloqueia promessa de retorno", () => {
    expect(posFiltro("Esse CDB tem retorno garantido de 15%.").motivos).toContain("promessa_retorno");
    expect(posFiltro("É um investimento sem risco.").motivos).toContain("promessa_retorno");
    expect(posFiltro("Garanto que você vai ganhar dinheiro.").bloqueado).toBe(true);
  });
  it("aceita 'não existe rentabilidade garantida'", () => {
    expect(posFiltro("Não existe rentabilidade garantida em renda variável.").bloqueado).toBe(false);
  });
  it("bloqueia ticker recomendado", () => {
    expect(posFiltro("Eu recomendo PETR4 para o seu perfil.").motivos).toContain("ticker_recomendado");
    expect(posFiltro("HGLG11 é uma boa opção agora.").motivos).toContain("ticker_recomendado");
  });
  it("permite ticker como exemplo educativo", () => {
    const r = posFiltro("O código de negociação de uma ação tem quatro letras e um número, como PETR4 aparece na B3.");
    expect(r.bloqueado).toBe(false);
  });
  it("anexa o aviso quando o tema é produto/imposto", () => {
    const r = posFiltro("O CDB paga juros e tem IR regressivo.");
    expect(r.bloqueado).toBe(false);
    expect(r.avisoAnexado).toBe(true);
    expect(r.texto.endsWith(DISCLAIMER_CURTO)).toBe(true);
  });
  it("não duplica o aviso", () => {
    const uma = posFiltro("O CDB paga juros.").texto;
    expect(posFiltro(uma).avisoAnexado).toBe(false);
  });
  it("não anexa aviso em conversa sem assunto financeiro", () => {
    const r = posFiltro("Combinado, te espero amanhã!");
    expect(r.avisoAnexado).toBe(false);
    expect(r.texto).toBe("Combinado, te espero amanhã!");
  });
  it("forcarAviso anexa mesmo sem tema", () => {
    expect(posFiltro("Olá, tudo bem?", { forcarAviso: true }).avisoAnexado).toBe(true);
  });
  it("resposta vazia vira fallback", () => {
    expect(posFiltro("   ").bloqueado).toBe(true);
  });
});

describe("opt-out e opt-in", () => {
  it.each(["PARAR", "parar", "Sair", "CANCELAR", "NAO QUERO", "não quero", "Parar!", "pare", "parar de receber"])(
    "opt-out: %s",
    (t) => expect(detectaOptOut(t)).toBe(true),
  );
  it.each(["quero sair da renda fixa", "não quero investir em ações", "como cancelar um CDB?", "oi"])(
    "não é opt-out: %s",
    (t) => expect(detectaOptOut(t)).toBe(false),
  );
  it.each(["SIM", "sim", "Sim!", "sim, quero", "Quero"])("opt-in: %s", (t) => expect(detectaOptIn(t)).toBe(true));
  it.each(["não", "sim mas quero entender melhor", "simples", ""])("não é opt-in: %s", (t) =>
    expect(detectaOptIn(t)).toBe(false));
});
