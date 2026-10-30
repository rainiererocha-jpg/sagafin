// ray-send: envio pela WhatsApp Cloud API (Meta). Interno: exige a chave de serviço.
//   type "text"     -> mensagem livre, só dentro da janela de 24 h (cliente falou nas últimas 24 h).
//   type "template" -> mensagem proativa; só para cliente com opt_in_whatsapp (ou dentro da janela),
//                      telefone no padrão de 13 dígitos e no máximo 20 templates por dia.
// Cada envio vira uma linha em interacoes (quando o telefone pertence a um cliente).
// Segredos: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, (opcional) WHATSAPP_API_VERSION.
import { chamadaDeServico, clienteServico, CORS, json, soDigitos } from "../_shared/comum.ts";
import { motivoBloqueio, MOTIVO_TEXTO, validarTelefone } from "../_shared/telefone.ts";

export const LIMITE_TEMPLATES_DIA = 20;
const JANELA_MS = 24 * 3_600_000;

interface Corpo {
  to: string;
  type: "text" | "template";
  text?: string;
  template_name?: string;
  template_lang?: string;
  body_params?: string[];
  botoes_quick?: { index: number; payload: string }[];
}

/** Início do dia em São Paulo (UTC-3) como ISO UTC. */
function inicioDoDiaLocal(agora = new Date()): string {
  const l = new Date(agora.getTime() - 3 * 3_600_000);
  return new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate(), 3, 0, 0)).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "método não permitido" }, 405);
  if (!chamadaDeServico(req)) return json({ ok: false, error: "não autorizado" }, 401);

  try {
    const token = Deno.env.get("WHATSAPP_TOKEN");
    const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const versao = Deno.env.get("WHATSAPP_API_VERSION") ?? "v21.0";
    if (!token || !phoneId) throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID não configurados");

    const corpo = (await req.json()) as Corpo;
    const destino = soDigitos(corpo.to);
    if (!destino) return json({ ok: false, error: "destinatário inválido" }, 422);
    if (corpo.type !== "text" && corpo.type !== "template") return json({ ok: false, error: "tipo inválido" }, 422);

    const db = clienteServico();
    // A chave da conversa/cliente é sempre o padrão de 13 dígitos quando possível.
    const canon = validarTelefone(destino).numero_final ?? destino;

    const { data: conversa } = await db.from("ray_conversas")
      .select("id, cliente_id, ultimo_inbound_em").eq("telefone", canon).maybeSingle();
    const { data: cliente } = await db.from("clientes")
      .select("id, opt_in_whatsapp, opt_out_at").eq("telefone", canon).maybeSingle();

    const dentroDaJanela = !!conversa?.ultimo_inbound_em &&
      Date.now() - Date.parse(conversa.ultimo_inbound_em) < JANELA_MS;

    if (corpo.type === "text") {
      if (!dentroDaJanela) {
        return json({ ok: false, skipped: true, error: "fora da janela de 24 h: use um template" }, 422);
      }
      if (!corpo.text?.trim()) return json({ ok: false, error: "text é obrigatório" }, 422);
    } else {
      if (!corpo.template_name) return json({ ok: false, error: "template_name é obrigatório" }, 422);
      const motivo = motivoBloqueio(canon);
      if (motivo) {
        return json({ ok: false, skipped: true, bloqueio_motivo: motivo, error: `Telefone fora do padrão (${MOTIVO_TEXTO[motivo]})` }, 422);
      }
      if (!dentroDaJanela) {
        if (!cliente?.opt_in_whatsapp || cliente.opt_out_at) {
          return json({ ok: false, skipped: true, error: "sem opt-in de WhatsApp" }, 403);
        }
      }
      const { count } = await db.from("interacoes")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "template_ray").gte("em", inicioDoDiaLocal());
      if ((count ?? 0) >= LIMITE_TEMPLATES_DIA) {
        return json({ ok: false, skipped: true, error: `limite diário de ${LIMITE_TEMPLATES_DIA} templates atingido` }, 429);
      }
    }

    let payload: Record<string, unknown>;
    if (corpo.type === "text") {
      payload = {
        messaging_product: "whatsapp", to: destino, type: "text",
        text: { body: corpo.text!.slice(0, 4000), preview_url: false },
      };
    } else {
      const components: unknown[] = [];
      if (corpo.body_params?.length) {
        components.push({ type: "body", parameters: corpo.body_params.map((t) => ({ type: "text", text: String(t) })) });
      }
      for (const b of corpo.botoes_quick ?? []) {
        components.push({ type: "button", sub_type: "quick_reply", index: String(b.index), parameters: [{ type: "payload", payload: b.payload }] });
      }
      payload = {
        messaging_product: "whatsapp", to: destino, type: "template",
        template: { name: corpo.template_name, language: { code: corpo.template_lang ?? "pt_BR" }, components },
      };
    }

    const res = await fetch(`https://graph.facebook.com/${versao}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = dados?.error?.message ?? `HTTP ${res.status}`;
      console.error("ray-send: Meta recusou:", msg);
      return json({ ok: false, error: msg }, 502);
    }
    const wamid = dados?.messages?.[0]?.id ?? null;

    const clienteId = cliente?.id ?? conversa?.cliente_id ?? null;
    if (clienteId) {
      await db.from("interacoes").insert({
        cliente_id: clienteId,
        canal: "whatsapp",
        tipo: corpo.type === "template" ? "template_ray" : "ray_texto",
        resumo: corpo.type === "template" ? `template ${corpo.template_name}` : String(corpo.text).slice(0, 200),
      });
      await db.from("clientes").update({ ultimo_contato_em: new Date().toISOString() }).eq("id", clienteId);
    }
    return json({ ok: true, wamid });
  } catch (e) {
    console.error("ray-send:", String(e));
    return json({ ok: false, error: String(e) }, 500);
  }
});
