// node --test scripts/carta-apresentacao.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlCarta, selecionarContatos, SERVICOS, ASSUNTO } from "./carta-apresentacao.mjs";
import { checarCompliance } from "./lib/compliance.mjs";

test("seleção: ignora e-mail inválido, vazio, duplicado e quem pediu para sair", () => {
  const contatos = selecionarContatos([
    { nome: "Ana Souza", email: " Ana@Exemplo.com ", opt_out_at: null },
    { nome: "Bruno Souza", email: "ana@exemplo.com", opt_out_at: null },
    { nome: "Carla", email: "sem-arroba", opt_out_at: null },
    { nome: "Davi", email: null, opt_out_at: null },
    { nome: "Eva", email: "eva@exemplo.com", opt_out_at: "2026-11-01T00:00:00Z" },
    { nome: "Fábio Lima", email: "fabio@exemplo.com", opt_out_at: null },
  ]);
  assert.deepEqual(contatos, [
    { email: "ana@exemplo.com", name: "Ana Souza" },
    { email: "fabio@exemplo.com", name: "Fábio Lima" },
  ]);
});

test("carta: saudação pelo primeiro nome, todos os serviços e descadastro", () => {
  const html = htmlCarta({ nome: "Maria Clara Dias", unsubscribeUrl: "https://sagafin.com.br/api/unsubscribe?token=abc" });
  assert.match(html, /Olá, Maria\./);
  for (const s of SERVICOS) assert.ok(html.includes(s.nome), s.nome);
  assert.ok(html.split("unsubscribe?token=abc").length >= 3, "descadastro no corpo e no rodapé");
  assert.match(html, /Indicar uma pessoa/);
  assert.match(html, /Marcar uma conversa/);
  assert.ok(ASSUNTO.length < 80);
});

test("carta: sem nome usa saudação neutra e escapa HTML", () => {
  assert.match(htmlCarta({ nome: null, unsubscribeUrl: "#" }), /Olá\./);
  assert.doesNotMatch(htmlCarta({ nome: "<b>x</b>", unsubscribeUrl: "#" }), /<b>x/);
});

test("carta: passa no compliance e não cita tickers", () => {
  const html = htmlCarta({ nome: "Teste", unsubscribeUrl: "#" });
  assert.equal(checarCompliance(html), null);
  assert.doesNotMatch(JSON.stringify(SERVICOS), /\b[A-Z]{4}\d{1,2}\b/);
});
