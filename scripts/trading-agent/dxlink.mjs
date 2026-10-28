// Cotações e greeks via DXLink (WebSocket do dxFeed usado pela tastytrade).
// Protocolo: SETUP → AUTH → CHANNEL_REQUEST(FEED) → FEED_SETUP(COMPACT) → FEED_SUBSCRIPTION → FEED_DATA.
// Docs: https://developer.tastytrade.com/docs/guides/stream-market-data/
// Uma sessão curta por slot: assina tudo, espera até ter dados (ou timeout) e fecha.

const CAMPOS = {
  Quote: ["eventSymbol", "bidPrice", "askPrice", "bidSize", "askSize"],
  Trade: ["eventSymbol", "price", "dayVolume"],
  Greeks: ["eventSymbol", "delta", "gamma", "theta", "vega", "volatility"],
  Summary: ["eventSymbol", "prevDayClosePrice", "dayHighPrice", "dayLowPrice", "openInterest"],
};

function parseCompact(tipo, flat) {
  const campos = CAMPOS[tipo];
  if (!campos) return [];
  const out = [];
  for (let i = 0; i + campos.length <= flat.length; i += campos.length) {
    const rec = {};
    campos.forEach((c, j) => { rec[c] = flat[i + j]; });
    out.push(rec);
  }
  return out;
}

const numOuNull = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Busca Quote/Trade/Summary para `symbols` e Greeks para os que forem opções (começam com ".").
 * Devolve { [symbol]: { bid, ask, mid, last, volume, prev_close, oi, delta, gamma, theta, vega, iv } }.
 */
export async function snapshotCotacoes({ token, url }, symbols, { timeoutMs = 60000, quietMs = 6000 } = {}) {
  if (typeof globalThis.WebSocket !== "function") {
    throw new Error("WebSocket nativo indisponível: use Node 22+ para o agente.");
  }
  const alvo = [...new Set(symbols)].filter(Boolean);
  const dados = {};
  const get = (s) => (dados[s] ||= {});
  const opcoes = alvo.filter((s) => s.startsWith("."));

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let keep = null;
    let fim = null;
    let quieto = null;
    let encerrado = false;

    const encerrar = (err) => {
      if (encerrado) return;
      encerrado = true;
      clearInterval(keep); clearTimeout(fim); clearTimeout(quieto);
      try { ws.close(); } catch { /* ignore */ }
      if (err) reject(err); else resolve(dados);
    };
    const send = (o) => ws.send(JSON.stringify(o));

    const completo = () => {
      const faltaQuote = alvo.some((s) => get(s).bid == null && get(s).ask == null && get(s).last == null);
      const faltaGreeks = opcoes.some((s) => get(s).delta == null);
      return !faltaQuote && !faltaGreeks;
    };
    const agendarQuieto = () => {
      clearTimeout(quieto);
      quieto = setTimeout(() => encerrar(), quietMs);
    };

    fim = setTimeout(() => encerrar(), timeoutMs);

    ws.onopen = () => {
      send({ type: "SETUP", channel: 0, version: "0.1-js/1.0.0", keepaliveTimeout: 60, acceptKeepaliveTimeout: 60 });
      keep = setInterval(() => { try { send({ type: "KEEPALIVE", channel: 0 }); } catch { /* ignore */ } }, 25000);
    };
    ws.onerror = () => encerrar(new Error("DXLink: erro de WebSocket"));
    ws.onclose = () => encerrar();
    ws.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      switch (m.type) {
        case "AUTH_STATE":
          if (m.state === "UNAUTHORIZED") send({ type: "AUTH", channel: 0, token });
          else if (m.state === "AUTHORIZED") send({ type: "CHANNEL_REQUEST", channel: 1, service: "FEED", parameters: { contract: "AUTO" } });
          break;
        case "CHANNEL_OPENED":
          send({ type: "FEED_SETUP", channel: 1, acceptAggregationPeriod: 1, acceptDataFormat: "COMPACT", acceptEventFields: CAMPOS });
          break;
        case "FEED_CONFIG": {
          const add = [];
          for (const s of alvo) {
            add.push({ type: "Quote", symbol: s }, { type: "Trade", symbol: s }, { type: "Summary", symbol: s });
            if (s.startsWith(".")) add.push({ type: "Greeks", symbol: s });
          }
          // A tastytrade limita a taxa de assinatura (BAD_ACTION "subscription rate is too high"): lotes pequenos e espaçados.
          for (let i = 0, n = 0; i < add.length; i += 100, n++) {
            setTimeout(() => {
              try { send({ type: "FEED_SUBSCRIPTION", channel: 1, reset: i === 0, add: add.slice(i, i + 100) }); } catch { /* ignore */ }
            }, n * 300);
          }
          break;
        }
        case "FEED_DATA": {
          const [tipo, flat] = m.data || [];
          for (const r of parseCompact(tipo, flat || [])) {
            const d = get(r.eventSymbol);
            if (tipo === "Quote") {
              d.bid = numOuNull(r.bidPrice); d.ask = numOuNull(r.askPrice);
              d.bid_size = numOuNull(r.bidSize); d.ask_size = numOuNull(r.askSize);
              if (d.bid != null && d.ask != null && d.ask > 0) d.mid = (d.bid + d.ask) / 2;
            } else if (tipo === "Trade") {
              d.last = numOuNull(r.price); d.volume = numOuNull(r.dayVolume);
            } else if (tipo === "Greeks") {
              d.delta = numOuNull(r.delta); d.gamma = numOuNull(r.gamma); d.theta = numOuNull(r.theta);
              d.vega = numOuNull(r.vega); d.iv = numOuNull(r.volatility);
            } else if (tipo === "Summary") {
              d.prev_close = numOuNull(r.prevDayClosePrice); d.high = numOuNull(r.dayHighPrice);
              d.low = numOuNull(r.dayLowPrice); d.oi = numOuNull(r.openInterest);
            }
          }
          if (completo()) agendarQuieto();
          break;
        }
        case "ERROR":
          encerrar(new Error(`DXLink: ${m.error || ""} ${m.message || ""}`.trim()));
          break;
        default:
          break;
      }
    };
  });
}

/** Preço de referência de um ativo: mid → last → prev_close. */
export function refPrice(q) {
  if (!q) return null;
  if (q.mid != null && q.mid > 0) return q.mid;
  if (q.last != null && q.last > 0) return q.last;
  if (q.prev_close != null && q.prev_close > 0) return q.prev_close;
  return null;
}
