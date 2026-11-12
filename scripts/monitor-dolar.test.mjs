// node --test scripts/monitor-dolar.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { analisar, assunto } from "./monitor-dolar.mjs";

function serie(n, { passo = 0.001, ultimo = null } = {}) {
  // Retornos alternando +passo/-passo, para desvio conhecido; o último retorno pode ser forçado.
  const out = [{ data: "2026-01-01", close: 5 }];
  for (let i = 1; i < n; i++) {
    const r = i === n - 1 && ultimo != null ? ultimo : (i % 2 ? passo : -passo);
    out.push({ data: `2026-01-${String(i + 1).padStart(2, "0")}`, close: out[i - 1].close * Math.exp(r) });
  }
  return out;
}

test("série curta falha", () => {
  assert.throws(() => analisar(serie(30), { janela: 60 }), /Histórico curto/);
});

test("dia normal: z pequeno, sem alerta", () => {
  const a = analisar(serie(70), { janela: 60, zLimiar: 2 });
  assert.ok(Math.abs(a.z) < 1.2, `z=${a.z}`);
  assert.equal(a.alerta, false);
  assert.match(assunto(a), /^Dólar hoje:/);
});

test("salto de 3% com desvio de 0,1%: alerta e assunto de alerta", () => {
  const a = analisar(serie(70, { ultimo: 0.03 }), { janela: 60, zLimiar: 2 });
  assert.ok(a.z > 2, `z=${a.z}`);
  assert.equal(a.alerta, true);
  assert.match(assunto(a), /^⚠ Dólar oscilou acima do normal/);
  assert.ok(a.varPct > 2.9 && a.varPct < 3.1);
});

test("dia sem variação não dispara", () => {
  const a = analisar(serie(70, { ultimo: 0 }), { janela: 60, zLimiar: 2 });
  assert.equal(a.alerta, false);
  assert.equal(a.ultimos5.length, 5);
});
