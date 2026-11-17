// Relatório semanal do funil social (segundas, .github/workflows/social-relatorio.yml):
// peças publicadas nos últimos 7 dias ranqueadas por leads (view v_conversao_posts), DMs do "EU QUERO"
// e leads do manual por origem. Vai por e-mail para APROVADOR_EMAIL.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, APROVADOR_EMAIL. DRY_RUN=true só imprime.
import { env, escapeHtml, hojeISO } from "./lib/util.mjs";
import { sbSelect } from "./lib/supabase.mjs";
import { enviarResend } from "./lib/email.mjs";
import { somarDias } from "./lib/calendario.mjs";

const DRY_RUN = process.env.DRY_RUN === "true";

export function resumir({ pecas, dms, leads }) {
  const ranking = [...pecas].sort((a, b) => b.leads - a.leads || b.dms - a.dms).slice(0, 10);
  const porPilar = {};
  for (const p of pecas) {
    const k = p.pilar || "outro";
    porPilar[k] ??= { pecas: 0, leads: 0 };
    porPilar[k].pecas++;
    porPilar[k].leads += Number(p.leads) || 0;
  }
  const porOrigem = {};
  for (const l of leads) {
    const k = l.utm_source || "direto";
    porOrigem[k] = (porOrigem[k] || 0) + 1;
  }
  const qualificados = leads.filter((l) => ["100-300k", "300k-1m", "acima-1m"].includes(l.investment_range)).length;
  return {
    ranking,
    porPilar,
    porOrigem,
    totais: { pecas: pecas.length, dms: dms.length, dmsEnviadas: dms.filter((d) => d.dm_status === "sent").length, leads: leads.length, qualificados },
  };
}

function html(r, desde) {
  const linha = (c) => `<td style="padding:6px 8px;border-bottom:1px solid #2a2824">${c}</td>`;
  const tab = (cab, linhas) =>
    `<table style="border-collapse:collapse;width:100%;font-size:13px;margin:8px 0 18px"><tr>${cab.map((c) => `<th style="text-align:left;padding:6px 8px;color:#d4a53c;font-weight:600">${c}</th>`).join("")}</tr>${linhas.join("")}</table>`;
  return `<div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#e8e4dc;padding:24px">
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a53c">Funil social · desde ${desde}</div>
<h1 style="font-family:Georgia,serif;font-weight:400;color:#fff;font-size:24px">${r.totais.leads} leads do manual · ${r.totais.qualificados} com R$ 100 mil+</h1>
<p style="color:#b5b0a6">${r.totais.pecas} peças na fila/publicadas · ${r.totais.dms} comentários "EU QUERO" (${r.totais.dmsEnviadas} DMs enviadas)</p>
<h2 style="font-size:14px;color:#fff">Top peças por leads</h2>
${tab(["Peça", "Pilar", "DMs", "Leads", "Qualif."], r.ranking.map((p) => `<tr>${linha(escapeHtml(p.hook || p.title))}${linha(p.pilar || "")}${linha(p.dms)}${linha(p.leads)}${linha(p.leads_qualificados)}</tr>`))}
<h2 style="font-size:14px;color:#fff">Por pilar</h2>
${tab(["Pilar", "Peças", "Leads"], Object.entries(r.porPilar).map(([k, v]) => `<tr>${linha(k)}${linha(v.pecas)}${linha(v.leads)}</tr>`))}
<h2 style="font-size:14px;color:#fff">Leads por origem</h2>
${tab(["utm_source", "Leads"], Object.entries(r.porOrigem).map(([k, v]) => `<tr>${linha(escapeHtml(k))}${linha(v)}</tr>`))}
<p style="font-size:12px;color:#8b8476">Use os temas do topo como prioridade na próxima semana (PILAR=evergreen no workflow, ou ajuste scripts/social/pilares.mjs).</p></div>`;
}

async function main() {
  const desde = somarDias(hojeISO(), -7);
  const [pecas, dms, leads] = await Promise.all([
    sbSelect("v_conversao_posts", `dia=gte.${desde}&select=*`),
    sbSelect("social_dm_events", `created_at=gte.${desde}&select=dm_status,platform`),
    sbSelect("leads", `source=eq.manual-investidor&created_at=gte.${desde}&select=utm_source,utm_content,investment_range`),
  ]);
  const r = resumir({ pecas, dms, leads });
  if (DRY_RUN) return console.log(JSON.stringify(r, null, 2));
  await enviarResend([{ to: env("APROVADOR_EMAIL"), subject: `Funil social: ${r.totais.leads} leads na semana`, html: html(r, desde) }], { canal: "relatorio-social" });
}

if (process.argv[1]?.endsWith("social-relatorio.mjs")) main().catch((e) => { console.error(e); process.exit(1); });
