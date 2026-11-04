// Aviso ao Rainiere no próprio WhatsApp (handoff). Texto livre só chega se ele falou com o
// número do RAY nas últimas 24 h; fora da janela usa o template opcional RAY_TEMPLATE_ALERTA
// (um parâmetro {{1}} com o resumo). Nunca derruba o atendimento: devolve true/false.
import { chamarFuncao } from "./comum.ts";

export async function alertarRainiere(resumo: string): Promise<boolean> {
  const dono = Deno.env.get("RAY_OWNER_PHONE");
  if (!dono) {
    console.warn("alerta: RAY_OWNER_PHONE não configurado");
    return false;
  }
  const texto = ("RAY: " + resumo).slice(0, 900);
  const r = await chamarFuncao("ray-send", { to: dono, type: "text", text: texto });
  if (r._status < 300) return true;
  const template = Deno.env.get("RAY_TEMPLATE_ALERTA");
  if (template) {
    const t = await chamarFuncao("ray-send", {
      to: dono,
      type: "template",
      template_name: template,
      body_params: [resumo.slice(0, 500)],
    });
    return t._status < 300;
  }
  return false;
}
