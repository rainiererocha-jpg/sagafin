// Cotações ao vivo para o ticker do topo e para o contexto do analisador.
// Fontes: BCB SGS (juros/câmbio oficial), AwesomeAPI (USD/EUR/ouro), Yahoo Finance (B3).
// Cache de borda de 5 min; cada fonte falha de forma isolada.

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SagaFin/1.0)" };

async function getJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function sgs(serie) {
  const d = await getJson(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/2?formato=json`
  );
  const last = parseFloat(d[d.length - 1].valor);
  const prev = d.length > 1 ? parseFloat(d[0].valor) : last;
  return { last, prev };
}

async function yahoo(symbol) {
  const d = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  );
  const m = d.chart.result[0].meta;
  const price = m.regularMarketPrice;
  const prev = m.chartPreviousClose ?? m.previousClose;
  return { price, change: prev ? ((price - prev) / prev) * 100 : 0 };
}

const settled = (p) => p.then((v) => v, () => null);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  const [selic, cdi, ipca, fx, ibov, petr, vale, itub, bbdc] = await Promise.all([
    settled(sgs(432)),
    settled(sgs(4389)),
    settled(sgs(433)),
    settled(getJson("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,XAU-USD")),
    settled(yahoo("^BVSP")),
    settled(yahoo("PETR4.SA")),
    settled(yahoo("VALE3.SA")),
    settled(yahoo("ITUB4.SA")),
    settled(yahoo("BBDC4.SA")),
  ]);

  const q = {};
  const put = (key, value, change = 0) => {
    if (value != null && Number.isFinite(value)) q[key] = { value, change };
  };

  if (ibov) put("IBOV", ibov.price, ibov.change);
  if (fx?.USDBRL) put("USD/BRL", parseFloat(fx.USDBRL.bid), parseFloat(fx.USDBRL.pctChange));
  if (fx?.EURBRL) put("EUR/BRL", parseFloat(fx.EURBRL.bid), parseFloat(fx.EURBRL.pctChange));
  if (fx?.XAUUSD) put("XAU", parseFloat(fx.XAUUSD.bid), parseFloat(fx.XAUUSD.pctChange));
  if (petr) put("PETR4", petr.price, petr.change);
  if (vale) put("VALE3", vale.price, vale.change);
  if (itub) put("ITUB4", itub.price, itub.change);
  if (bbdc) put("BBDC4", bbdc.price, bbdc.change);
  if (selic) put("SELIC", selic.last, 0);
  if (cdi) put("CDI", cdi.last, 0);
  if (ipca) put("IPCA", ipca.last, 0);

  res.status(200).json({ updatedAt: new Date().toISOString(), quotes: q });
}
