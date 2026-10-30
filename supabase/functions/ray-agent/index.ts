/* eslint-disable @typescript-eslint/no-explicit-any */
// ray-agent: o cérebro do RAY. Interno: exige a chave de serviço.
// Entrada: { conversa_id, mensagem? }. Saída: { ok, resposta, persona, bloqueado, aguardando_humano }.
// Quem grava a resposta no histórico e envia pelo WhatsApp é o ray-webhook.
//
// Ordem: pedido de humano -> preFiltro (recomendação/carteira/alocação) -> persona + RAG + Diário
// -> Claude (claude-sonnet-5-5) -> marcador de agenda (ray-agendar) -> posFiltro -> ray_log.
import { chamarClaude, MODELO_CHAT, normalizarTurnos } from "../_shared/anthropic.ts";
import { alertarRainiere } from "../_shared/alerta.ts";
import { chamarFuncao, chamadaDeServico, clienteServico, json } from "../_shared/comum.ts";
import {
  escolherPersona, extrairMarcadorAgenda, formatarCotacoes, temMarcadorSolto, textoDoPost, type PersonaId,
} from "../_shared/contexto.ts";
import {
  inicioDoEpisodio, mensagensDoEpisodio, primeiraRespostaDoEpisodio, ultimasDoEpisodio, type MensagemConversa,
} from "../_shared/episodio.ts";
import {
  DISCLAIMER_CURTO, IDENTIDADE_RAY, MSG_FALLBACK_BLOQUEIO, MSG_HUMANO, pedeHumano, posFiltro, preFiltro,
} from "../_shared/guarda.ts";
import { blocoIdentidade } from "./identidade.ts";

const SITE = Deno.env.get("SAGAFIN_SITE_URL") ?? "https://sagafin.com.br";
const MSG_AGENDA_INDISPONIVEL =
  "Não consegui consultar a agenda agora. Já avisei o Rainiere Rocha, que vai entrar em contato para combinar o horário.";

interface Slot { inicio: string; fim: string; rotulo: string }

async function embedding(texto: string): Promise<number[] | null> {
  try {
    // @ts-expect-error - Supabase.ai é injetado pelo runtime das edge functions
    const sessao = new Supabase.ai.Session("gte-small");
    return (await sessao.run(texto, { mean_pool: true, normalize: true })) as number[];
  } catch (e) {
    console.error("ray-agent: embedding indisponível:", String(e));
    return null;
  }
}

async function buscarJson(url: string, ms = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function agoraBrasilia(): string {
  return new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");
}

function listaDeHorarios(slots: Slot[]): string {
  if (!slots.length) return "No momento não há horários livres nos próximos dias. O Rainiere entra em contato para combinar.";
  return (
    "Horários livres (30 minutos, horário de Brasília):\n" +
    slots.map((s, i) => `${i + 1}) ${s.rotulo}`).join("\n") +
    "\nQual deles prefere?"
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, erro: "método não permitido" }, 405);
  if (!chamadaDeServico(req)) return json({ ok: false, erro: "não autorizado" }, 401);

  const db = clienteServico();
  try {
    const corpo = await req.json();
    const conversaId = String(corpo?.conversa_id ?? "");
    if (!conversaId) return json({ ok: false, erro: "conversa_id é obrigatório" }, 422);

    const { data: conv, error: errConv } = await db.from("ray_conversas").select("*").eq("id", conversaId).single();
    if (errConv || !conv) return json({ ok: false, erro: "conversa não encontrada" }, 404);

    const historico: MensagemConversa[] = Array.isArray(conv.historico) ? [...conv.historico] : [];
    const extra = typeof corpo?.mensagem === "string" ? corpo.mensagem.trim() : "";
    const ultimaFala = [...historico].reverse().find((m) => m.role === "user");
    if (extra && ultimaFala?.content !== extra) {
      historico.push({ role: "user", content: extra, ts: new Date().toISOString() });
    }
    const entrada = String([...historico].reverse().find((m) => m.role === "user")?.content ?? "").trim();
    if (!entrada) return json({ ok: false, erro: "sem mensagem do cliente" }, 422);

    // deno-lint-ignore no-explicit-any
    const estado: Record<string, any> = { ...(conv.estado ?? {}) };
    const desde = inicioDoEpisodio(historico);
    // "Primeira resposta" = ninguém respondeu ainda neste episódio (a fala do cliente já está no histórico).
    const primeira = primeiraRespostaDoEpisodio(historico);
    const prefixo = primeira ? IDENTIDADE_RAY + "\n\n" : "";

    const { data: cliente } = conv.cliente_id
      ? await db.from("clientes").select("id, nome, segmento").eq("id", conv.cliente_id).maybeSingle()
      : { data: null };

    let aguardando = !!conv.aguardando_humano;
    let personaUsada: string | null = null;
    let resposta = "";
    let bloqueado = false;
    let motivo: string | null = null;

    const registrar = async () => {
      await db.from("ray_log").insert({
        conversa_id: conv.id, entrada, saida: resposta, bloqueado, motivo, persona: personaUsada,
      });
      await db.from("ray_conversas").update({
        estado, aguardando_humano: aguardando, ...(extra ? { historico } : {}),
      }).eq("id", conv.id);
    };
    const nomeParaAviso = conv.nome ?? cliente?.nome ?? conv.telefone;

    // 1) Pediu um humano.
    if (pedeHumano(entrada)) {
      aguardando = true;
      resposta = prefixo + MSG_HUMANO;
      motivo = "pediu_humano";
      await alertarRainiere(nomeParaAviso + " pediu para falar com você. Mensagem: " + entrada.slice(0, 200));
      await registrar();
      return json({ ok: true, resposta, persona: null, bloqueado, aguardando_humano: aguardando });
    }

    // 2) Pré-filtro: recomendação, carteira, alocação.
    const pre = preFiltro(entrada);
    if (pre.redirecionar) {
      const n = Number(estado.redirecionamentos ?? 0) + 1;
      estado.redirecionamentos = n;
      bloqueado = true;
      motivo = "pre:" + pre.categoria;
      resposta = prefixo + pre.resposta;
      if (n >= 2 && !aguardando) {
        aguardando = true;
        await alertarRainiere(nomeParaAviso + " insistiu em recomendação pessoal (" + pre.categoria + "). Última mensagem: " + entrada.slice(0, 200));
      }
      await registrar();
      return json({ ok: true, resposta, persona: null, bloqueado, aguardando_humano: aguardando });
    }
    estado.redirecionamentos = 0;

    // 3) Persona (tabela ray_personas) por palavra-chave.
    const personaId: PersonaId = escolherPersona(entrada, {
      ehCliente: !!cliente,
      personaAnterior: estado.persona ?? null,
      primeiraDoEpisodio: primeira,
    });
    let { data: persona } = await db.from("ray_personas").select("id, prompt").eq("id", personaId).eq("ativo", true).maybeSingle();
    if (!persona) {
      ({ data: persona } = await db.from("ray_personas").select("id, prompt").eq("id", "educador").maybeSingle());
    }
    if (!persona) throw new Error("persona 'educador' não encontrada em ray_personas");
    personaUsada = persona.id;
    estado.persona = persona.id;

    // 4) RAG: fichas de conhecimento.
    const falas = mensagensDoEpisodio(historico, desde).filter((m) => m.role === "user").slice(-3);
    const consulta = falas.map((m) => m.content).join(" \n ").slice(0, 600);
    let fichas = "";
    const emb = await embedding(consulta);
    if (emb) {
      const { data } = await db.rpc("buscar_conhecimento_ray", {
        query_embedding: JSON.stringify(emb), k: 4, min_similaridade: 0.3, categoria_filter: null,
      });
      if (Array.isArray(data) && data.length) {
        fichas = "\n\n## FICHAS DE CONHECIMENTO RELEVANTES\nUse no máximo duas por resposta, com as suas palavras. Nunca copie literalmente. Se a ficha não cobre a pergunta, diga que não sabe e indique a fonte oficial ou o Rainiere.\n" +
          data.map((f: { titulo: string; conteudo: string }) => "- " + f.titulo + ": " + String(f.conteudo).slice(0, 1200)).join("\n");
      }
    }

    // 5) Diário do dia e cotações (só quando o assunto é mercado).
    let mercado = "";
    if (persona.id === "mercado") {
      const { data: post } = await db.from("posts").select("titulo, resumo, conteudo_html, data_publicacao")
        .eq("status", "published").order("data_publicacao", { ascending: false }).limit(1).maybeSingle();
      const cot = formatarCotacoes(await buscarJson(SITE + "/api/quotes"));
      const partes: string[] = [];
      if (post) {
        partes.push("Diário Saga de " + post.data_publicacao + ": " + post.titulo + ". " + (post.resumo ?? "") + " " + textoDoPost(post.conteudo_html));
      }
      if (cot) partes.push(cot);
      mercado = partes.length
        ? "\n\n## CONTEXTO DE MERCADO DE HOJE (use só isto; cite a fonte e a data)\n" + partes.join("\n\n")
        : "\n\n## CONTEXTO DE MERCADO\nNão há dados do Diário nem cotações agora. Diga isso com honestidade.";
    }

    // 6) Agenda: o prompt lembra os horários já oferecidos.
    let agendaCtx = "";
    const oferecidos: Slot[] = Array.isArray(estado.slots_oferecidos) ? estado.slots_oferecidos : [];
    if (persona.id === "agenda" && oferecidos.length) {
      agendaCtx = "\n\n## HORÁRIOS JÁ OFERECIDOS\n" + oferecidos.map((s) => s.rotulo + " = " + s.inicio).join("\n");
    }

    const system = persona.prompt +
      blocoIdentidade({
        nome_contato: conv.nome ?? cliente?.nome, ehCliente: !!cliente, segmento: cliente?.segmento,
        primeiraDoEpisodio: primeira, agoraIso: agoraBrasilia(),
      }) + fichas + mercado + agendaCtx;

    const turnos = normalizarTurnos(
      ultimasDoEpisodio(historico, 16).map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      })),
    );

    // 7) Claude.
    const bruto = await chamarClaude({ modelo: MODELO_CHAT, system, mensagens: turnos, maxTokens: 700 });
    const { texto: semMarcador, marcador } = extrairMarcadorAgenda(bruto);

    // 8) Pós-filtro no texto do modelo (a lista de horários vem da agenda, não do modelo).
    let corpoResposta = semMarcador;
    if (temMarcadorSolto(corpoResposta)) corpoResposta = corpoResposta.replace(/\[\[[^\]]*\]?\]?/g, "").trim();
    const pos = posFiltro(corpoResposta, { forcarAviso: primeira });
    if (pos.bloqueado) {
      bloqueado = true;
      motivo = "pos:" + pos.motivos.join(",");
      corpoResposta = pos.texto;
    } else {
      corpoResposta = pos.texto;
    }

    // 9) Agendamento.
    let anexo = "";
    if (marcador && !pos.bloqueado) {
      if (marcador.tipo === "listar") {
        const r = await chamarFuncao<{ ok?: boolean; slots?: Slot[] }>("ray-agendar", { acao: "horarios_livres" });
        if (r._status < 300 && r.slots) {
          estado.slots_oferecidos = r.slots;
          anexo = "\n\n" + listaDeHorarios(r.slots);
        } else {
          anexo = "\n\n" + MSG_AGENDA_INDISPONIVEL;
          aguardando = true;
          await alertarRainiere("agenda indisponível ao atender " + nomeParaAviso + ". Combine o horário com a pessoa.");
        }
      } else {
        const alvo = Date.parse(marcador.inicio ?? "");
        const escolhido = oferecidos.find((s) => Date.parse(s.inicio) === alvo);
        if (!escolhido) {
          const r = await chamarFuncao<{ slots?: Slot[] }>("ray-agendar", { acao: "horarios_livres" });
          if (r.slots) estado.slots_oferecidos = r.slots;
          anexo = "\n\nEsse horário não está entre os que a agenda liberou.\n\n" + listaDeHorarios(r.slots ?? []);
        } else {
          const r = await chamarFuncao<{ ok?: boolean; erro?: string; slots?: Slot[]; rotulo?: string }>("ray-agendar", {
            acao: "criar",
            telefone: conv.telefone,
            nome: marcador.nome ?? conv.nome ?? cliente?.nome ?? "Contato WhatsApp",
            inicio: escolhido.inicio,
          });
          if (r._status < 300 && r.ok) {
            delete estado.slots_oferecidos;
            anexo = "\n\nReunião confirmada com o Rainiere Rocha: " + (r.rotulo ?? escolhido.rotulo) + " (horário de Brasília). Se precisar remarcar, é só me avisar.";
            await alertarRainiere("reunião marcada: " + (marcador.nome ?? nomeParaAviso) + ", " + (r.rotulo ?? escolhido.rotulo) + ".");
          } else if (r.slots) {
            estado.slots_oferecidos = r.slots;
            anexo = "\n\nEsse horário acabou de ser ocupado.\n\n" + listaDeHorarios(r.slots);
          } else {
            anexo = "\n\n" + MSG_AGENDA_INDISPONIVEL;
            aguardando = true;
            await alertarRainiere("não consegui criar a reunião de " + nomeParaAviso + ". Combine o horário com a pessoa.");
          }
        }
      }
    }

    resposta = (prefixo + (corpoResposta || MSG_FALLBACK_BLOQUEIO + "\n\n" + DISCLAIMER_CURTO) + anexo).slice(0, 3900);
    await registrar();
    return json({ ok: true, resposta, persona: personaUsada, bloqueado, aguardando_humano: aguardando });
  } catch (e) {
    console.error("ray-agent:", String(e));
    return json({ ok: false, erro: String(e) }, 500);
  }
});
