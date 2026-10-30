// Importa a carteira de clientes (CSV exportado do Hub XP) para a tabela public.clientes.
//
// Uso:
//   node scripts/importar-clientes.mjs --arquivo caminho.csv [--dry-run]
//
// Configuração: lida do .env do projeto pelo helper scripts/env.cjs (nada fixo no código):
//   SUPABASE_URL (ou VITE_SUPABASE_URL, ou SUPABASE_PROJECT_REF) e SUPABASE_SERVICE_ROLE_KEY.
//
// Privacidade: só entram nome, telefone, e-mail, segmento, suitability (texto) e aniversário.
// Qualquer outra coluna (CPF, saldo, patrimônio...) é ignorada e nunca é gravada.
// Os campos de opt-in NUNCA são alterados por este script.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { require_env } = require("./env.cjs");

// ---------------------------------------------------------------- utilitários

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { arquivo: null, dryRun: false, saidaSql: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--arquivo") out.arquivo = argv[++i];
    else if (argv[i] === "--dry-run") out.dryRun = true;
    else if (argv[i] === "--saida-sql") out.saidaSql = argv[++i];
  }
  return out;
}

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const chaveCabecalho = (s) => semAcento(s).toLowerCase().replace(/\s+/g, " ").trim();

/** Detecta o separador (vírgula ou ponto e vírgula) pela primeira linha. */
function detectarSeparador(texto) {
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  const pv = (primeira.match(/;/g) ?? []).length;
  const vg = (primeira.match(/,/g) ?? []).length;
  return pv > vg ? ";" : ",";
}

/** Parser de CSV com suporte a aspas, aspas duplas escapadas e quebras de linha em campo. */
function parseCSV(texto, sep) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim() !== "")) linhas.push(linha);
  return linhas;
}

// ---------------------------------------------------------------- normalização

const MINUSCULAS = new Set(["de", "da", "do", "dos", "das", "e"]);

/** Nome em title case pt-BR; nunca fica em caixa alta. */
export function normalizarNome(bruto) {
  const limpo = String(bruto ?? "").replace(/\s+/g, " ").trim();
  if (!limpo) return "";
  return limpo
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((p, i) => {
      if (i > 0 && MINUSCULAS.has(p)) return p;
      // preserva apóstrofo/hífen: d'Ávila, Maria-Clara
      return p.replace(/(^|[-'’])(\p{L})/gu, (_, pre, l) => pre + l.toLocaleUpperCase("pt-BR"));
    })
    .join(" ");
}

const REGEX_TELEFONE = /^55[1-9][0-9]9[0-9]{8}$/;

/** Telefone para 13 dígitos (55 + DDD + 9 + 8). Devolve null quando inválido. */
export function normalizarTelefone(bruto) {
  let d = String(bruto ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length === 12 && d.startsWith("55")) d = d.slice(0, 4) + "9" + d.slice(4);
  return REGEX_TELEFONE.test(d) ? d : null;
}

export function normalizarEmail(bruto) {
  const e = String(bruto ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** dd/mm/aaaa, dd-mm-aaaa ou aaaa-mm-dd -> aaaa-mm-dd; senão null. */
export function normalizarData(bruto) {
  const s = String(bruto ?? "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let a, mes, dia;
  if (m) [, a, mes, dia] = m;
  else {
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (!m) return null;
    [, dia, mes, a] = m;
  }
  const dt = new Date(Date.UTC(+a, +mes - 1, +dia));
  if (dt.getUTCFullYear() !== +a || dt.getUTCMonth() !== +mes - 1 || dt.getUTCDate() !== +dia) return null;
  return `${a}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Cabeçalho (sem acento, minúsculo) -> campo da tabela. Tudo que não está aqui é ignorado. */
function campoDoCabecalho(cab) {
  const k = chaveCabecalho(cab);
  if (k === "cliente" || k === "nome") return "nome";
  if (k === "celular" || k === "telefone") return "telefone";
  if (k === "e-mail" || k === "email") return "email";
  if (k === "suitability" || k.startsWith("suitability")) return "suitability_texto";
  if (k === "segmento") return "segmento";
  if (k === "aniversario" || k === "data de nascimento" || k === "nascimento") return "aniversario";
  return null;
}

// ---------------------------------------------------------------- Supabase REST

function configuracao() {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) {
    const ref = require_env("SUPABASE_PROJECT_REF");
    url = `https://${ref}.supabase.co`;
  }
  return { url: url.replace(/\/$/, ""), key: require_env("SUPABASE_SERVICE_ROLE_KEY") };
}

async function rest(cfg, caminho, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${cfg.url}/rest/v1/${caminho}`, {
    method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} em ${method} ${caminho.split("?")[0]}: ${txt.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

// ---------------------------------------------------------------- principal

async function main() {
  const { arquivo, dryRun, saidaSql } = parseArgs(process.argv.slice(2));
  if (!arquivo) fail("Informe o arquivo: node scripts/importar-clientes.mjs --arquivo caminho.csv [--dry-run]");
  if (/\.xlsx?$/i.test(arquivo)) {
    fail(
      "Este script lê apenas CSV. Abra a planilha no Excel, use Arquivo > Salvar como > CSV UTF-8 (separado por vírgulas) e rode de novo com o arquivo .csv.",
    );
  }

  let texto;
  try {
    texto = readFileSync(path.resolve(arquivo), "utf8");
  } catch (e) {
    fail(`Não consegui abrir o arquivo: ${e.message}`);
  }
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);

  const linhas = parseCSV(texto, detectarSeparador(texto));
  if (linhas.length < 2) fail("O arquivo está vazio ou só tem o cabeçalho.");

  const cabecalho = linhas[0];
  const mapa = cabecalho.map(campoDoCabecalho);
  const ignoradas = cabecalho.filter((_, i) => !mapa[i]).map((c) => c.trim()).filter(Boolean);
  if (!mapa.includes("nome")) fail('Não encontrei a coluna do nome (esperado "Cliente" ou "Nome").');

  if (ignoradas.length) {
    console.warn(
      `⚠ Colunas IGNORADAS (não serão lidas nem gravadas): ${ignoradas.join(", ")}. ` +
        "Isso inclui CPF, saldos e patrimônio, se existirem no arquivo.",
    );
  }

  // Monta as linhas normalizadas; junta repetidas dentro do próprio arquivo.
  const registros = [];
  const vistos = new Map();
  let semTelefoneValido = 0;
  const telefonesInvalidos = [];
  let lidos = 0;

  for (const l of linhas.slice(1)) {
    const r = {};
    l.forEach((v, i) => {
      if (mapa[i]) r[mapa[i]] = v;
    });
    const nome = normalizarNome(r.nome);
    if (!nome) continue;
    lidos++;
    const telefone = normalizarTelefone(r.telefone);
    if (!telefone) {
      semTelefoneValido++;
      if (String(r.telefone ?? "").trim()) telefonesInvalidos.push(`${nome}: "${String(r.telefone).trim()}"`);
    }
    const reg = {
      nome,
      telefone,
      email: normalizarEmail(r.email),
      segmento: String(r.segmento ?? "").trim() || null,
      suitability_texto: String(r.suitability_texto ?? "").trim() || null,
      aniversario: normalizarData(r.aniversario),
    };
    const chave = reg.telefone ? `t:${reg.telefone}` : reg.email ? `e:${reg.email}` : null;
    if (chave && vistos.has(chave)) {
      const antigo = registros[vistos.get(chave)];
      for (const [k, v] of Object.entries(reg)) if (antigo[k] == null && v != null) antigo[k] = v;
      continue;
    }
    if (chave) vistos.set(chave, registros.length);
    registros.push(reg);
  }

  if (telefonesInvalidos.length) {
    console.warn(`⚠ Telefones inválidos (ficam em branco):\n  - ${telefonesInvalidos.join("\n  - ")}`);
  }

  if (saidaSql) {
    // Alternativa sem chave de serviço: gera um SQL idempotente para rodar no SQL Editor.
    // Nunca marca opt-in. Registros que já existem (mesmo telefone ou e-mail) são ignorados.
    const lit = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
    const linhas = registros.map(
      (r) => `(${lit(r.nome)}, ${lit(r.telefone)}, ${lit(r.email)}, ${lit(r.segmento)}, ${lit(r.suitability_texto)}, ${lit(r.aniversario)}::date, 'xp_hub')`,
    );
    const sql =
      "insert into public.clientes (nome, telefone, email, segmento, suitability_texto, aniversario, origem)"+"\n"+"values"+"\n" +
      linhas.join(",\n") +
      "\non conflict do nothing;\n";
    const { writeFileSync } = await import("node:fs");
    writeFileSync(saidaSql, sql, "utf8");
    console.log(`SQL gravado em ${saidaSql}: ${registros.length} registros. Nenhum opt-in marcado.`);
    return;
  }

  if (dryRun) {
    console.log("\n--- DRY RUN: nada foi gravado. Primeiras 5 linhas normalizadas ---");
    console.log(JSON.stringify(registros.slice(0, 5), null, 2));
    console.log(
      `\nLidos: ${lidos} | Prontos para importar: ${registros.length} | Sem telefone válido: ${semTelefoneValido} | ` +
        `Colunas ignoradas: ${ignoradas.length ? ignoradas.join(", ") : "nenhuma"}`,
    );
    return;
  }

  const cfg = configuracao();
  const existentes = await rest(cfg, "clientes?select=id,telefone,email&limit=100000");
  const porTel = new Map(existentes.filter((c) => c.telefone).map((c) => [c.telefone, c.id]));
  const porEmail = new Map(existentes.filter((c) => c.email).map((c) => [c.email, c.id]));

  const novos = [];
  const atualizacoes = [];
  for (const reg of registros) {
    const id = (reg.telefone && porTel.get(reg.telefone)) || (reg.email && porEmail.get(reg.email)) || null;
    if (id) {
      // Atualiza só o que veio preenchido; nunca apaga dado existente e nunca toca em opt-in.
      const patch = Object.fromEntries(Object.entries(reg).filter(([, v]) => v != null));
      atualizacoes.push({ id, patch });
    } else novos.push({ ...reg, origem: "xp_hub" });
  }

  let importados = 0;
  let atualizados = 0;
  for (let i = 0; i < novos.length; i += 100) {
    const lote = novos.slice(i, i + 100);
    // Mesmas chaves em todas as linhas (exigência do PostgREST em insert em lote).
    await rest(cfg, "clientes", { method: "POST", body: lote, prefer: "return=minimal" });
    importados += lote.length;
  }
  for (const { id, patch } of atualizacoes) {
    await rest(cfg, `clientes?id=eq.${id}`, { method: "PATCH", body: patch, prefer: "return=minimal" });
    atualizados++;
  }

  console.log("\n=== Resumo da importação ===");
  console.log(`Lidos:               ${lidos}`);
  console.log(`Importados (novos):  ${importados}`);
  console.log(`Atualizados:         ${atualizados}`);
  console.log(`Sem telefone válido: ${semTelefoneValido}`);
  console.log(`Colunas ignoradas:   ${ignoradas.length ? ignoradas.join(", ") : "nenhuma"}`);
  console.log("Opt-in: nenhum cliente foi marcado como autorizado por esta importação.");
}

main().catch((e) => fail(e.message));
