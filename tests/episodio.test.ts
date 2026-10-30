import { describe, expect, it } from "vitest";
import {
  HORAS_EPISODIO, episodioSemFalaDoCliente, episodioSemResposta, inicioDoEpisodio, mensagensDoEpisodio,
  primeiraRespostaDoEpisodio, ultimasDoEpisodio, ultimoMarcador, type MensagemConversa,
} from "../supabase/functions/_shared/episodio.ts";

const h = (horas: number) => new Date(Date.UTC(2026, 9, 1) + horas * 3_600_000).toISOString();
const u = (c: string, t: number): MensagemConversa => ({ role: "user", content: c, ts: h(t) });
const a = (c: string, t: number, extra: Partial<MensagemConversa> = {}): MensagemConversa =>
  ({ role: "assistant", content: c, ts: h(t), ...extra });

describe("episódio de 72 h", () => {
  it("usa 72 horas", () => expect(HORAS_EPISODIO).toBe(72));
  it("histórico vazio ou de um episódio só começa em 0", () => {
    expect(inicioDoEpisodio([])).toBe(0);
    expect(inicioDoEpisodio([u("oi", 0), a("olá", 1), u("cdb?", 2)])).toBe(0);
  });
  it("silêncio de 72 h abre novo episódio", () => {
    expect(inicioDoEpisodio([u("oi", 0), a("olá", 1), u("lci?", 100), a("explico", 101)])).toBe(2);
  });
  it("71 h não corta", () => {
    expect(inicioDoEpisodio([u("oi", 0), u("e então", 71)])).toBe(0);
  });
  it("marcador de disparo abre episódio e é achado por ultimoMarcador", () => {
    const m: MensagemConversa[] = [
      u("oi", 0),
      a("olá", 1),
      { role: "assistant", content: "", tipo: "disparo", campanha_nome: "boas_vindas", ts: h(2) },
      u("sim", 3),
    ];
    expect(inicioDoEpisodio(m)).toBe(2);
    expect(ultimoMarcador(m, 2)?.campanha_nome).toBe("boas_vindas");
    expect(mensagensDoEpisodio(m, 2).map((x) => x.content)).toEqual(["sim"]);
  });
  it("mensagens sem ts não cortam", () => {
    expect(inicioDoEpisodio([{ role: "user", content: "a" }, { role: "user", content: "b", ts: h(500) }])).toBe(0);
  });
  it("detecta episódio sem fala do cliente e sem resposta", () => {
    expect(episodioSemFalaDoCliente([a("oi", 0)], 0)).toBe(true);
    expect(episodioSemFalaDoCliente([{ role: "user", content: "[SISTEMA] x", ts: h(0) }], 0)).toBe(true);
    expect(episodioSemFalaDoCliente([u("oi", 0)], 0)).toBe(false);
    expect(episodioSemResposta([u("oi", 0)], 0)).toBe(true);
    expect(episodioSemResposta([u("oi", 0), a("olá", 1)], 0)).toBe(false);
  });
  it("ultimasDoEpisodio limita a n e ignora o episódio antigo", () => {
    const antigo = [u("velho1", 0), a("velho2", 1)];
    const novo = Array.from({ length: 20 }, (_, i) => u("m" + i, 200 + i));
    const r = ultimasDoEpisodio([...antigo, ...novo], 16);
    expect(r).toHaveLength(16);
    expect(r[0].content).toBe("m4");
  });
  it("primeiraRespostaDoEpisodio ignora confirmações de sistema", () => {
    expect(primeiraRespostaDoEpisodio([u("oi", 0)])).toBe(true);
    expect(primeiraRespostaDoEpisodio([u("sim", 0), a("confirmado", 1, { tipo: "sistema" }), u("o que é cdb", 2)])).toBe(true);
    expect(primeiraRespostaDoEpisodio([u("oi", 0), a("olá", 1), u("cdb", 2)])).toBe(false);
  });
});
