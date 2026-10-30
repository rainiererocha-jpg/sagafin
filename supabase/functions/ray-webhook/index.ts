/* eslint-disable @typescript-eslint/no-explicit-any */
// ray-webhook: entrada da WhatsApp Cloud API (Meta) do número da Saga Financeira.
//   GET  -> verificação (hub.challenge) com WHATSAPP_VERIFY_TOKEN.
//   POST -> confere x-hub-signature-256 (WHATSAPP_APP_SECRET) e trata mensagens:
//           1. PARAR/SAIR/... -> RPC registrar_opt_out + confirmação
//           2. SIM de quem ainda não deu opt-in -> RPC registrar_opt_in (+ Diário) + confirmação
//           3. upsert em ray_conversas, liga ao cliente pelo telefone
//           4. modo_humano -> só registra
//           5. senão chama ray-agent e responde via ray-send
// Publicar com verify_jwt = false (a Meta chama sem JWT).
import { chamarFuncao, clienteServico, iguaisSeguro, json, soDigitos } from "../_shared/comum.ts";
import { alertarRainiere } from "../_shared/alerta.ts";
import { detectaOptIn, detectaOptOut, MSG_OPT_IN, MSG_OPT_OUT } from "../_shared/guarda.ts";
import { HORAS_EPISODIO, type MensagemConversa } from "../_shared/episodio.ts";
import { validarTelefone } from "../_shared/telefone.ts";

const MAX_HISTORICO = 200;
const MSG_SO_TEXTO = "Por enquanto só consigo ler mensagens de texto. Pode escrever sua dúvida?";
const MSG_ERRO_TECNICO =
  "Tive um problema técnico para responder agora. Já avisei o Rainiere Rocha, que vai retornar assim que possível.";

async function assinaturaValida(req: Request, bruto: string): Promise<boolean> {
  const segredo = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!segredo) {
    console.error("ray-webhook: WHATSAPP_APP_SECRET ausente - requisição recusada");
    return false;
  }
  const recebida = req.headers.get("x-hub-signature-256") ?? "";
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(bruto));
  const esperada = "sha256=" + Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return iguaisSeguro(recebida, esperada);
}

// deno-lint-ignore no-explicit-any
function textoDaMensagem(m: any): string | null {
  if (m?.type === "text") return String(m.text?.body ?? "");
  if (m?.type === "button") return String(m.button?.text ?? m.button?.payload ?? "");
  if (m?.type === "interactive") {
    return String(m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "");
  }
  return null;
}

async function enviar(to: string, text: string): Promise<boolean> {
  const r = await chamarFuncao("ray-send", { to, type: "text", text });
  if (r._status >= 300) console.error("ray-webhook: ray-send falhou", r._status, JSON.stringify(r).slice(0, 200));
  return r._status < 300;
}

// deno-lint-ignore no-explicit-any
async function tratarMensagem(db: ReturnType<typeof clienteServico>, m: any, nomePerfil: string | null) {
  const de = soDigitos(m.from);
  if (!de) return;
  const telefone = validarTelefone(de).numero_final ?? de;
  const wamid = String(m.id ?? "");
  const agora = new Date();
  const texto = textoDaMensagem(m);

  // Conversa (uma linha por telefone) + vínculo com o cliente.
  let { data: conv } = await db.from("ray_conversas").select("*").eq("telefone", telefone).maybeSingle();
  const { data: cliente } = await db.from("clientes")
    .select("id, nome, email, opt_in_whatsapp, opt_in_email").eq("telefone", telefone).maybeSingle();

  if (!conv) {
    const { data: nova, error } = await db.from("ray_conversas").insert({
      telefone,
      cliente_id: cliente?.id ?? null,
      nome: cliente?.nome ?? nomePerfil,
    }).select("*").single();
    if (error) throw error;
    conv = nova;
  }
  // deno-lint-ignore no-explicit-any
  const estado = { ...(conv.estado ?? {}) } as Record<string, any>;
  const vistos: string[] = Array.isArray(estado.wamids) ? estado.wamids : [];
  if (wamid && vistos.includes(wamid)) return; // reentrega da Meta
  estado.wamids = [...vistos, wamid].filter(Boolean).slice(-30);

  const historico: MensagemConversa[] = Array.isArray(conv.historico) ? [...conv.historico] : [];
  const ultimoTs = Date.parse(historico[historico.length - 1]?.ts ?? "");
  const novoEpisodio = !Number.isFinite(ultimoTs) || agora.getTime() - ultimoTs >= HORAS_EPISODIO * 3_600_000;

  const salvar = async (extra: Record<string, unknown> = {}, novas: MensagemConversa[] = []) => {
    const h = [...historico, ...novas].slice(-MAX_HISTORICO);
    const { error } = await db.from("ray_conversas").update({
      historico: h,
      estado,
      cliente_id: cliente?.id ?? conv.cliente_id ?? null,
      nome: conv.nome ?? cliente?.nome ?? nomePerfil,
      ultimo_inbound_em: agora.toISOString(),
      ...(novoEpisodio ? { ultimo_episodio_em: agora.toISOString() } : {}),
      ...extra,
    }).eq("id", conv.id);
    if (error) throw error;
    historico.splice(0, historico.length, ...h);
  };
  const msgUsuario: MensagemConversa = { role: "user", content: texto ?? "[mensagem sem texto]", ts: agora.toISOString() };
  const resposta = (t: string, tipo?: string): MensagemConversa =>
    ({ role: "assistant", content: t, ts: new Date().toISOString(), autor: "ray", ...(tipo ? { tipo } : {}) });

  // Mensagem que não é texto.
  if (texto === null) {
    await salvar({}, [msgUsuario]);
    if (conv.modo_humano) return;
    if (await enviar(de, MSG_SO_TEXTO)) await salvar({}, [resposta(MSG_SO_TEXTO)]);
    return;
  }

  // 1) Opt-out: primeiro de tudo, mesmo em modo humano.
  if (detectaOptOut(texto)) {
    await db.rpc("registrar_opt_out", { p_telefone: telefone });
    estado.opt_out_em = agora.toISOString();
    await salvar({}, [msgUsuario]);
    if (cliente?.id) {
      await db.from("interacoes").insert({
        cliente_id: cliente.id,
        canal: "whatsapp",
        tipo: "opt_out",
        resumo: "Pediu para parar de receber mensagens",
      });
    }
    if (await enviar(de, MSG_OPT_OUT)) await salvar({}, [resposta(MSG_OPT_OUT, "sistema")]);
    return;
  }

  // 2) Opt-in: SIM de cliente conhecido que ainda não deu opt-in.
  if (detectaOptIn(texto) && cliente && !cliente.opt_in_whatsapp) {
    await db.rpc("registrar_opt_in", { p_telefone: telefone, p_canal: cliente.email ? "email" : "whatsapp" });
    if (cliente.email) {
      const { error } = await db.rpc("subscribe_daily", { p_email: cliente.email, p_name: cliente.nome });
      if (error) console.error("ray-webhook: subscribe_daily:", error.message);
    }
    delete estado.opt_out_em;
    await db.from("interacoes").insert({
      cliente_id: cliente.id,
      canal: "whatsapp",
      tipo: "opt_in",
      resumo: "Respondeu SIM ao convite",
    });
    await salvar({}, [msgUsuario]);
    if (await enviar(de, MSG_OPT_IN)) await salvar({}, [resposta(MSG_OPT_IN, "sistema")]);
    return;
  }

  // 3) Registra a fala. Modo humano: só registra (e mantém a conversa sinalizada).
  await salvar({}, [msgUsuario]);
  if (conv.modo_humano) {
    if (!conv.aguardando_humano) await db.from("ray_conversas").update({ aguardando_humano: true }).eq("id", conv.id);
    return;
  }

  // 4) RAY responde.
  const r = await chamarFuncao<{ ok?: boolean; resposta?: string; aguardando_humano?: boolean; erro?: string }>(
    "ray-agent",
    { conversa_id: conv.id },
  );
  if (r._status >= 300 || !r.resposta) {
    console.error("ray-webhook: ray-agent falhou", r._status, r.erro ?? "");
    await db.from("ray_conversas").update({ aguardando_humano: true }).eq("id", conv.id);
    await alertarRainiere("falha técnica ao responder " + (conv.nome ?? telefone) + ". Veja a conversa no admin.");
    if (await enviar(de, MSG_ERRO_TECNICO)) await salvar({}, [resposta(MSG_ERRO_TECNICO, "sistema")]);
    return;
  }
  // O ray-agent atualizou estado e histórico: recarrega antes de gravar a resposta.
  const { data: fresca } = await db.from("ray_conversas").select("estado, historico").eq("id", conv.id).single();
  if (fresca) {
    for (const k of Object.keys(estado)) delete estado[k];
    Object.assign(estado, fresca.estado ?? {});
    historico.splice(0, historico.length, ...(Array.isArray(fresca.historico) ? fresca.historico : []));
  }
  if (await enviar(de, r.resposta)) {
    await salvar({}, [resposta(r.resposta)]);
    if (cliente?.id) await db.from("clientes").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", cliente.id);
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const esperado = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    const token = url.searchParams.get("hub.verify_token") ?? "";
    if (url.searchParams.get("hub.mode") === "subscribe" && esperado && iguaisSeguro(token, esperado)) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const bruto = await req.text();
  if (!(await assinaturaValida(req, bruto))) return new Response("unauthorized", { status: 401 });

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = JSON.parse(bruto);
  } catch {
    return json({ ok: false }, 400);
  }

  const db = clienteServico();
  // deno-lint-ignore no-explicit-any
  const mudancas = (payload?.entry ?? []).flatMap((e: any) => e.changes ?? []);
  for (const ch of mudancas) {
    const v = ch.value ?? {};
    const nomes: Record<string, string> = {};
    for (const c of v.contacts ?? []) nomes[c.wa_id] = c.profile?.name ?? "";
    for (const m of v.messages ?? []) {
      try {
        await tratarMensagem(db, m, nomes[m.from] || null);
      } catch (e) {
        // Responde 200 mesmo assim: a Meta reenviaria em loop. O erro fica no log da função.
        console.error("ray-webhook: erro ao tratar mensagem:", String(e));
      }
    }
  }
  return json({ ok: true });
});
