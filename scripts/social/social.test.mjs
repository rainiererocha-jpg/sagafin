// node --test scripts/social/social.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { detectarPalavraChave, linkManual, pilarDoDia, EVERGREEN } from "./pilares.mjs";
import { validar, legendasFinais, N_SLIDES } from "./conteudo.mjs";
import { montarHtml } from "./render.mjs";
import { resumir } from "../social-relatorio.mjs";

const base = () => ({
  titulo: "t",
  gancho: "g",
  slides: Array.from({ length: N_SLIDES }, (_, i) => ({ titulo: `Título ${i}`, subtitulo: "s", texto: "texto do slide" })),
  stories: [{ tipo: "dado", rotulo: "Dólar", valor: "R$ 5,78", variacao: "+1%" }, { tipo: "insight", texto: "algo útil" }],
  caption_instagram: "x".repeat(300),
  caption_linkedin: "y".repeat(500),
  hashtags: ["Investimentos", "#Dolar"],
});

test("detecta palavra-chave com variações", () => {
  assert.equal(detectarPalavraChave("SAGA!!"), "saga");
  assert.equal(detectarPalavraChave("quero o saga"), "saga");
  assert.equal(detectarPalavraChave("EU QUERO!!"), "eu quero");
  assert.equal(detectarPalavraChave("euquero"), "eu quero");
  assert.equal(detectarPalavraChave("Quero sim"), "quero");
  assert.equal(detectarPalavraChave("manda o MANUAL"), "manual");
  assert.equal(detectarPalavraChave("Guía por favor"), "guia");
  assert.equal(detectarPalavraChave("muito bom o post"), null);
  assert.equal(detectarPalavraChave("requerimento"), null);
});

test("palavra-chave do webhook (Deno) espelha a do Node", async () => {
  const ts = await readFile(new URL("../../supabase/functions/_shared/palavra_chave.ts", import.meta.url), "utf8");
  assert.match(ts, /\\beu\\s\*quero\\b/);
  assert.match(ts, /\["manual", "guia", "quero"\]/);
});

test("link do manual leva UTM", () => {
  const u = new URL(linkManual("instagram", "abc12345"));
  assert.equal(u.pathname, "/manual");
  assert.equal(u.searchParams.get("utm_source"), "instagram");
  assert.equal(u.searchParams.get("utm_campaign"), "saga");
  assert.equal(u.searchParams.get("utm_content"), "abc12345");
});

test("calendário: ter/qui evergreen, sex trading, demais mercado; rodízio cobre todos os temas", () => {
  assert.equal(pilarDoDia(1).pilar, "mercado");
  assert.equal(pilarDoDia(2).pilar, "evergreen");
  assert.equal(pilarDoDia(4).pilar, "evergreen");
  assert.equal(pilarDoDia(5).pilar, "trading");
  const vistos = new Set();
  for (let s = 0; s < EVERGREEN.length; s++) for (const d of [2, 4]) vistos.add(pilarDoDia(d, s).evergreen.id);
  assert.equal(vistos.size, EVERGREEN.length);
});

test("validar aceita conteúdo bem formado", () => {
  assert.deepEqual(validar(base()), []);
});

test("validar barra expressões vedadas e estrutura errada", () => {
  const c = base();
  c.slides[2].texto = "Compre agora, é imperdível";
  assert.ok(validar(c).some((e) => e.includes("compliance")));
  const d = base();
  d.slides.pop();
  assert.ok(validar(d).some((e) => e.includes("slides")));
  assert.deepEqual(validar(null), ["resposta não é JSON"]);
});

test("legendas recebem CTA, link rastreável e aviso", () => {
  const l = legendasFinais(base(), { utm: "abc12345", site: "https://sagafin.com.br" });
  assert.match(l.caption_instagram, /Comente SAGA/);
  assert.match(l.caption_instagram, /#Investimentos #Dolar/);
  assert.match(l.caption_instagram, /Não é recomendação/);
  assert.match(l.caption_facebook, /utm_source=facebook/);
  assert.match(l.caption_linkedin, /utm_source=linkedin&utm_medium=social&utm_campaign=saga&utm_content=abc12345/);
  assert.ok(l.caption_instagram.length <= 2200);
  const longa = legendasFinais({ ...base(), caption_instagram: "z".repeat(5000) }, { utm: "u", site: "https://sagafin.com.br" });
  assert.ok(longa.caption_instagram.length <= 2200);
  assert.match(longa.caption_instagram, /Comente SAGA[\s\S]*Não é recomendação/);
});

test("render monta capa + conteúdo + CTA e stories + CTA, escapando HTML", () => {
  const c = base();
  c.slides[1].titulo = "<script>x</script>";
  const h = montarHtml(c, { eyebrow: "Diário Saga · 17/11", eyebrowCurto: "Diário", ddmm: "17/11", cta: "SAGA" });
  assert.equal(h.carrossel.length, N_SLIDES + 1);
  assert.equal(h.stories.length, c.stories.length + 1);
  assert.ok(!h.carrossel.join("").includes("<script>x"));
  assert.match(h.carrossel.at(-1), /SAGA/);
});

test("relatório ranqueia por leads e conta qualificados", () => {
  const r = resumir({
    pecas: [
      { hook: "a", pilar: "mercado", leads: 1, dms: 3 },
      { hook: "b", pilar: "evergreen", leads: 4, dms: 2 },
    ],
    dms: [{ dm_status: "sent" }, { dm_status: "failed" }],
    leads: [{ utm_source: "instagram-dm", investment_range: "100-300k" }, { utm_source: "linkedin", investment_range: "ate-100k" }],
  });
  assert.equal(r.ranking[0].hook, "b");
  assert.equal(r.totais.qualificados, 1);
  assert.equal(r.totais.dmsEnviadas, 1);
  assert.equal(r.porOrigem["instagram-dm"], 1);
  assert.equal(r.porPilar.evergreen.leads, 4);
});
