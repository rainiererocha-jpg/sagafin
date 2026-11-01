// GET /api/trading-panel — dados derivados para o painel "Exterior em foco" (EWZ + dólar) em /trading.
// Fontes: Yahoo Finance (séries diárias de 1 ano), BCB Expectativas de Mercado / Focus via Olinda
// (medianas para fim de 2026 e 2027), BCB SGS (Selic e CDI). Cache de borda 15 min; cada fonte falha isolada.
// Nenhuma projeção própria: toda "projeção" exibida é a mediana do Focus com a data da pesquisa.

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SagaFin/1.0; +https://sagafin.com.br)" };

async function getJson(url, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const settled = (name, p) =>
  p.then(
    (v) => v,
    (e) => {
      console.error(`trading-panel: fonte ${name} falhou: ${e?.message ?? e}`);
      return null;
    }
  );

const r2 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
const r4 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10000) / 10000);

// ---------------------------------------------------------------- Yahoo

async function yahooSerie(symbol, range = "1y") {
  const d = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`
  );
  const r0 = d.chart.result[0];
  const ts = r0.timestamp || [];
  const cl = r0.indicators?.quote?.[0]?.close || [];
  const pts = [];
  for (let i = 0; i < ts.length; i++) {
    if (Number.isFinite(cl[i])) pts.push({ d: new Date(ts[i] * 1000).toISOString().slice(0, 10), v: cl[i] });
  }
  const meta = r0.meta || {};
  const last = meta.regularMarketPrice ?? pts[pts.length - 1]?.v ?? null;
  if (last != null && pts.length && pts[pts.length - 1].d !== new Date().toISOString().slice(0, 10)) {
    // garante que o último ponto reflete o preço corrente (Yahoo às vezes atrasa a vela do dia)
    pts[pts.length - 1] = { ...pts[pts.length - 1], v: last };
  }
  return { symbol, pts, last, prev_close: meta.regularMarketPreviousClose ?? meta.previousClose ?? null };
}

function stats(s) {
  if (!s || !s.pts?.length) return null;
  const v = s.pts.map((p) => p.v);
  const n = v.length;
  const last = s.last ?? v[n - 1];
  const prev = s.prev_close ?? (n >= 2 ? v[n - 2] : null);
  const ret = (k) => (n > k ? ((last / v[n - 1 - k]) - 1) * 100 : null);
  const mm200 = n >= 200 ? v.slice(n - 200).reduce((a, b) => a + b, 0) / 200 : null;
  const logs = [];
  for (let i = Math.max(1, n - 30); i < n; i++) logs.push(Math.log(v[i] / v[i - 1]));
  const mean = logs.reduce((a, b) => a + b, 0) / (logs.length || 1);
  const sd = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, logs.length - 1));
  return {
    last: r4(last),
    change_1d_pct: prev ? r2(((last / prev) - 1) * 100) : null,
    change_1m_pct: r2(ret(21)),
    change_3m_pct: r2(ret(63)),
    change_12m_pct: r2(((last / v[0]) - 1) * 100),
    mm200: r4(mm200),
    dist_mm200_pct: mm200 ? r2(((last / mm200) - 1) * 100) : null,
    high_52w: r4(Math.max(...v)),
    low_52w: r4(Math.min(...v)),
    vol30_pct: r2(sd * Math.sqrt(252) * 100),
    series: s.pts.map((p) => ({ d: p.d, v: r4(p.v) })),
  };
}

function alinhar(series) {
  // interseção de datas entre todas as séries
  const mapas = series.map((s) => new Map(s.pts.map((p) => [p.d, p.v])));
  const datas = series[0].pts.map((p) => p.d).filter((d) => mapas.every((m) => m.has(d)));
  return { datas, mapas };
}

function retornos(mapa, datas) {
  const out = [];
  for (let i = 1; i < datas.length; i++) out.push(mapa.get(datas[i]) / mapa.get(datas[i - 1]) - 1);
  return out;
}

function correl(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 20) return null;
  const x = a.slice(-n), y = b.slice(-n);
  const mx = x.reduce((p, q) => p + q, 0) / n, my = y.reduce((p, q) => p + q, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx && syy ? r2(sxy / Math.sqrt(sxx * syy)) : null;
}

function retornosMensais(mapa, datas) {
  // último preço de cada mês → retorno mês a mês
  const porMes = new Map();
  for (const d of datas) porMes.set(d.slice(0, 7), mapa.get(d));
  const meses = [...porMes.keys()].sort();
  const out = [];
  for (let i = 1; i < meses.length; i++) out.push({ mes: meses[i], ret: porMes.get(meses[i]) / porMes.get(meses[i - 1]) - 1 });
  return out;
}

// ---------------------------------------------------------------- BCB

async function sgs(serie) {
  const d = await getJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/1?formato=json`);
  return parseFloat(d[d.length - 1].valor);
}

/** Mediana do Focus (expectativas anuais) para 2026 e 2027, última pesquisa disponível. */
async function focus(indicador) {
  const filtro = `Indicador eq '${indicador}' and (DataReferencia eq '2026' or DataReferencia eq '2027') and baseCalculo eq 0`;
  const url =
    "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais" +
    `?$filter=${encodeURIComponent(filtro)}&$orderby=Data%20desc&$top=6&$format=json` +
    "&$select=Indicador,Data,DataReferencia,Mediana,Media,numeroRespondentes";
  const d = await getJson(url, 12000);
  const out = {};
  for (const row of d.value || []) {
    const ano = String(row.DataReferencia);
    if (!out[ano]) out[ano] = { mediana: r2(parseFloat(row.Mediana)), media: r2(parseFloat(row.Media)), data: row.Data, n: row.numeroRespondentes ?? null };
  }
  return out; // { "2026": {...}, "2027": {...} }
}

// ---------------------------------------------------------------- handler

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const [ewz, usd, ibov, spx, fCambio, fSelic, fIpca, selic, cdi] = await Promise.all([
    settled("ewz", yahooSerie("EWZ")),
    settled("usdbrl", yahooSerie("BRL=X")),
    settled("ibov", yahooSerie("^BVSP")),
    settled("spx", yahooSerie("^GSPC")),
    settled("focus-cambio", focus("Câmbio")),
    settled("focus-selic", focus("Selic")),
    settled("focus-ipca", focus("IPCA")),
    settled("selic", sgs(432)),
    settled("cdi", sgs(4389)),
  ]);

  const out = {
    updatedAt: new Date().toISOString(),
    ewz: stats(ewz),
    usdbrl: stats(usd),
    ibov: stats(ibov),
    spx: stats(spx),
    base100: [],
    focus: { cambio: fCambio || {}, selic: fSelic || {}, ipca: fIpca || {} },
    juros: { selic: Number.isFinite(selic) ? selic : null, cdi: Number.isFinite(cdi) ? cdi : null },
    correl: { ewz_spx: null, usdbrl_ibov: null },
    hedge: { meses_ibov_queda: null, meses_dolar_subiu: null },
    decomp12m: { ibov_brl_pct: null, usdbrl_pct: null, ewz_pct: null },
    fontes: "Yahoo Finance (séries); BCB – Expectativas de Mercado (Focus) via Olinda; BCB SGS (Selic/CDI). Valores de referência com atraso; não são cotações em tempo real.",
  };

  if (out.ewz && out.usdbrl) out.ewz.ewz_brl = r2(out.ewz.last * out.usdbrl.last);

  if (ewz && usd && ibov && spx) {
    const { datas, mapas } = alinhar([ewz, usd, ibov, spx]);
    const [mE, mU, mI, mS] = mapas;
    if (datas.length > 30) {
      const d0 = datas[0];
      out.base100 = datas.map((d) => ({
        d,
        ewz: r2((mE.get(d) / mE.get(d0)) * 100),
        ibov: r2((mI.get(d) / mI.get(d0)) * 100),
        spx_brl: r2(((mS.get(d) * mU.get(d)) / (mS.get(d0) * mU.get(d0))) * 100),
        usdbrl: r2((mU.get(d) / mU.get(d0)) * 100),
      }));
      out.correl.ewz_spx = correl(retornos(mE, datas), retornos(mS, datas));
      out.correl.usdbrl_ibov = correl(retornos(mU, datas), retornos(mI, datas));
      const mesesI = retornosMensais(mI, datas);
      const mesesU = new Map(retornosMensais(mU, datas).map((m) => [m.mes, m.ret]));
      const queda = mesesI.filter((m) => m.ret < 0);
      out.hedge.meses_ibov_queda = queda.length;
      out.hedge.meses_dolar_subiu = queda.filter((m) => (mesesU.get(m.mes) ?? 0) > 0).length;
      const dN = datas[datas.length - 1];
      out.decomp12m = {
        ibov_brl_pct: r2((mI.get(dN) / mI.get(d0) - 1) * 100),
        usdbrl_pct: r2((mU.get(dN) / mU.get(d0) - 1) * 100),
        ewz_pct: r2((mE.get(dN) / mE.get(d0) - 1) * 100),
        periodo: `${d0} a ${dN}`,
      };
    }
  }

  res.status(200).json(out);
}
