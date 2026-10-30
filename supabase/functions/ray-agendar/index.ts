// ray-agendar: agenda do Rainiere no Google Calendar. Interno: exige a chave de serviço.
//   { acao: "horarios_livres" }                       -> { ok, slots: [{inicio, fim, rotulo}] }
//   { acao: "criar", telefone, nome, inicio }          -> cria o evento + linha em agendamentos
// Horários de 30 min, seg-sex 9h-18h (America/Sao_Paulo), próximos 7 dias. A lógica de horários
// fica em _shared/agenda_puro.ts (testada). Segredos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// GOOGLE_REFRESH_TOKEN, (opcional) GOOGLE_CALENDAR_ID (padrão "primary").
import { chamadaDeServico, clienteServico, json, soDigitos } from "../_shared/comum.ts";
import {
  filtrarLivres, FUSO, gerarSlots, resumirSlots, rotuloSlot, validarSlot, type Intervalo, type Slot,
} from "../_shared/agenda_puro.ts";

async function tokenGoogle(): Promise<string> {
  const id = Deno.env.get("GOOGLE_CLIENT_ID");
  const segredo = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refresh = Deno.env.get("GOOGLE_REFRESH_TOKEN");
  if (!id || !segredo || !refresh) throw new Error("credenciais do Google não configuradas");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id, client_secret: segredo, refresh_token: refresh, grant_type: "refresh_token",
    }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok || !dados.access_token) throw new Error("falha ao renovar o token do Google (" + res.status + ")");
  return dados.access_token as string;
}

const calendarioId = () => Deno.env.get("GOOGLE_CALENDAR_ID") ?? "primary";

async function ocupados(token: string, de: Date, ate: Date): Promise<Intervalo[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin: de.toISOString(), timeMax: ate.toISOString(), timeZone: FUSO, items: [{ id: calendarioId() }],
    }),
  });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("freebusy falhou (" + res.status + ")");
  return (dados?.calendars?.[calendarioId()]?.busy ?? []) as Intervalo[];
}

async function livres(token: string, agora: Date): Promise<Slot[]> {
  const todos = gerarSlots(agora);
  if (!todos.length) return [];
  const de = new Date(todos[0].inicio);
  const ate = new Date(todos[todos.length - 1].fim);
  const busy = await ocupados(token, de, ate);
  return filtrarLivres(todos, busy);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, erro: "método não permitido" }, 405);
  if (!chamadaDeServico(req)) return json({ ok: false, erro: "não autorizado" }, 401);

  try {
    const corpo = await req.json();
    const agora = new Date();
    const token = await tokenGoogle();

    if (corpo?.acao === "horarios_livres") {
      const slots = resumirSlots(await livres(token, agora), 6, 2);
      return json({ ok: true, slots });
    }

    if (corpo?.acao === "criar") {
      const telefone = soDigitos(corpo.telefone);
      const nome = String(corpo.nome ?? "").trim().slice(0, 80);
      const inicio = String(corpo.inicio ?? "");
      if (!telefone || !nome || !inicio) return json({ ok: false, erro: "telefone, nome e inicio são obrigatórios" }, 422);

      const t0 = Date.parse(inicio);
      const busy = Number.isFinite(t0)
        ? await ocupados(token, new Date(t0), new Date(t0 + 30 * 60_000))
        : [];
      const v = validarSlot(inicio, agora, busy);
      if (!v.ok) {
        const slots = resumirSlots(await livres(token, agora), 6, 2);
        return json({ ok: false, erro: v.erro, slots }, 409);
      }

      const db = clienteServico();
      const { data: linha, error } = await db.from("agendamentos")
        .insert({ telefone, nome, inicio: new Date(t0).toISOString(), fim: v.fim, status: "agendado" })
        .select("id").single();
      if (error) {
        // índice único: outro agendamento ativo no mesmo horário
        const slots = resumirSlots(await livres(token, agora), 6, 2);
        return json({ ok: false, erro: "ocupado", slots }, 409);
      }

      const ev = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarioId()) + "/events",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: "Reunião Saga Financeira: " + nome,
            description: "Agendada pelo RAY. Contato: WhatsApp " + telefone + ".",
            start: { dateTime: new Date(t0).toISOString(), timeZone: FUSO },
            end: { dateTime: v.fim, timeZone: FUSO },
          }),
        },
      );
      const evDados = await ev.json().catch(() => ({}));
      if (!ev.ok) {
        await db.from("agendamentos").update({ status: "cancelado" }).eq("id", linha.id);
        return json({ ok: false, erro: "o Google recusou o evento (" + ev.status + ")" }, 502);
      }
      await db.from("agendamentos").update({ google_event_id: evDados.id }).eq("id", linha.id);
      return json({ ok: true, agendamento_id: linha.id, google_event_id: evDados.id, rotulo: rotuloSlot(new Date(t0)) });
    }

    return json({ ok: false, erro: "acao inválida" }, 422);
  } catch (e) {
    console.error("ray-agendar:", String(e));
    return json({ ok: false, erro: String(e) }, 500);
  }
});
