// Cliente mínimo da API da Anthropic para as edge functions do RAY.
// Modelos fixos do projeto. Não enviamos temperature.
export const MODELO_CHAT = "claude-sonnet-5-5";
export const MODELO_CLASSIFICACAO = "claude-haiku-5-5";

export interface MensagemModelo {
  role: "user" | "assistant";
  content: string;
}

export async function chamarClaude(opts: {
  modelo: string;
  system: string;
  mensagens: MensagemModelo[];
  maxTokens?: number;
}): Promise<string> {
  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) throw new Error("ANTHROPIC_API_KEY não configurada");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": chave,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.modelo,
      max_tokens: opts.maxTokens ?? 700,
      system: opts.system,
      messages: opts.mensagens,
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const dados = await res.json();
  return String(dados?.content?.[0]?.text ?? "");
}

/** Mensagens da API precisam alternar user/assistant e começar por user. */
export function normalizarTurnos(msgs: MensagemModelo[]): MensagemModelo[] {
  const out: MensagemModelo[] = [];
  for (const m of msgs) {
    const texto = String(m.content ?? "").trim();
    if (!texto) continue;
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.role === m.role) ultimo.content += "\n" + texto;
    else out.push({ role: m.role, content: texto });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}
