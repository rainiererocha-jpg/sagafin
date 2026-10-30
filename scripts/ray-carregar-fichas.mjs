// Carrega as fichas de conhecimento do RAY (01..24-*.md) na tabela ray_conhecimento,
// passando pela edge function admin-conhecimento (que calcula o embedding).
//
// Uso:
//   node scripts/ray-carregar-fichas.mjs [--dir CAMINHO] [--dry-run]
//
// --dry-run: só lê e mostra o que seria enviado (não precisa de .env nem de rede).
// Configuração (modo real), lida do .env do projeto por scripts/env.cjs:
//   SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.
// Pula 00-* (lista de fontes) e 99-* (guarda-corpo, que é instrução fixa do sistema).
// Formato de cada arquivo: primeira linha "# Título", segunda "categoria: xxx", depois o texto.

import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PASTA_PADRAO = "C:\\Users\\ranib\\.alianca\\sagafin-ray-2026-10-23\\ray-conhecimento";
const CATEGORIAS = new Set(["renda_fixa", "fii", "renda_variavel", "previdencia", "perfil", "macro", "regulatorio", "sagafin"]);
const LOTE = 2;

/** Lê o texto de uma ficha. Devolve { titulo, categoria, conteudo } ou lança erro com o motivo. */
export function parseFicha(texto, nomeArquivo = "") {
  const linhas = String(texto).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  const iTitulo = linhas.findIndex((l) => /^#\s+\S/.test(l));
  if (iTitulo === -1) throw new Error(`${nomeArquivo}: sem título (# ...)`);
  const titulo = linhas[iTitulo].replace(/^#\s+/, "").trim();
  const iCat = linhas.findIndex((l, i) => i > iTitulo && /^categoria:\s*\S/i.test(l));
  if (iCat === -1) throw new Error(`${nomeArquivo}: sem linha "categoria:"`);
  const categoria = linhas[iCat].replace(/^categoria:\s*/i, "").trim().toLowerCase();
  if (!CATEGORIAS.has(categoria)) throw new Error(`${nomeArquivo}: categoria desconhecida "${categoria}"`);
  const conteudo = linhas.slice(iCat + 1).join("\n").trim();
  if (conteudo.length < 40) throw new Error(`${nomeArquivo}: conteúdo muito curto`);
  return { titulo, categoria, conteudo };
}

/** Arquivos 01..24 (pula 00 e 99), em ordem. */
export function arquivosDeFichas(nomes) {
  return nomes
    .filter((n) => /^\d{2}-.+\.md$/i.test(n))
    .filter((n) => {
      const num = Number(n.slice(0, 2));
      return num >= 1 && num <= 98;
    })
    .sort();
}

async function principal() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const iDir = args.indexOf("--dir");
  const dir = iDir >= 0 ? args[iDir + 1] : PASTA_PADRAO;

  const arquivos = arquivosDeFichas(readdirSync(dir));
  if (!arquivos.length) throw new Error(`Nenhuma ficha encontrada em ${dir}`);

  const fichas = [];
  const erros = [];
  for (const a of arquivos) {
    try {
      fichas.push({ arquivo: a, ...parseFicha(readFileSync(path.join(dir, a), "utf8"), a) });
    } catch (e) {
      erros.push(String(e.message ?? e));
    }
  }

  console.log(`${fichas.length} ficha(s) lida(s)${erros.length ? `, ${erros.length} com erro` : ""}.`);
  for (const f of fichas) console.log(`  ${f.arquivo}  [${f.categoria}]  ${f.titulo}  (${f.conteudo.length} caracteres)`);
  for (const e of erros) console.error(`  ERRO ${e}`);
  if (erros.length) process.exit(1);

  if (dryRun) {
    console.log("Modo --dry-run: nada foi enviado.");
    return;
  }

  const require = createRequire(import.meta.url);
  const { require_env } = require("./env.cjs");
  let base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!base) base = require_env("SUPABASE_URL");
  const chave = require_env("SUPABASE_SERVICE_ROLE_KEY");
  const url = `${base.replace(/\/$/, "")}/functions/v1/admin-conhecimento`;

  let falhas = 0;
  for (let i = 0; i < fichas.length; i += LOTE) {
    const lote = fichas.slice(i, i + LOTE).map(({ categoria, titulo, conteudo }) => ({ categoria, titulo, conteudo }));
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fichas: lote }),
    });
    const dados = await res.json().catch(() => ({}));
    for (const r of dados.resultados ?? []) {
      if (!r.ok) falhas++;
      console.log(`  ${r.ok ? "ok  " : "FALHA"} ${r.titulo}${r.erro ? ` - ${r.erro}` : ""}`);
    }
    if (!res.ok && !dados.resultados) {
      falhas += lote.length;
      console.error(`  Lote ${i / LOTE + 1}: HTTP ${res.status} ${JSON.stringify(dados).slice(0, 200)}`);
    }
  }
  console.log(falhas ? `Concluído com ${falhas} falha(s).` : "Concluído sem falhas.");
  if (falhas) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => {
    console.error(`Erro: ${e.message ?? e}`);
    process.exit(1);
  });
}
