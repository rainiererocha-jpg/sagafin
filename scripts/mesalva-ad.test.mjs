// node --test scripts/mesalva-ad.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { blocoOfertaFeeFixo, OFERTA_FEE_FIXO } from "./mesalva-ad.mjs";
import { checarCompliance } from "./lib/compliance.mjs";

test("oferta Fee Fixo: chamada, condição, botão de WhatsApp e selo de publicidade", () => {
  const html = blocoOfertaFeeFixo("teste");
  assert.ok(html.includes(OFERTA_FEE_FIXO.titulo));
  assert.ok(html.includes(OFERTA_FEE_FIXO.condicao));
  assert.match(html, /wa\.me\/5562994160930/);
  assert.match(html, /utm_campaign=teste/);
  assert.match(html, /Publicidade/);
});

test("oferta Fee Fixo: passa no compliance e não usa superlativo", () => {
  assert.equal(checarCompliance(blocoOfertaFeeFixo()), null);
  assert.doesNotMatch(JSON.stringify(OFERTA_FEE_FIXO), /melhor|garant/i);
});
