import { describe, expect, it } from "vitest";
import {
  escolherPersona, extrairMarcadorAgenda, formatarCotacoes, temMarcadorSolto, textoDoPost,
} from "../supabase/functions/_shared/contexto.ts";
// @ts-expect-error - script .mjs sem tipos
import { arquivosDeFichas, parseFicha } from "../scripts/ray-carregar-fichas.mjs";

describe("escolherPersona", () => {
  it("roteia por palavra-chave", () => {
    expect(escolherPersona("quero marcar uma reunião")).toBe("agenda");
    expect(escolherPersona("qual é o meu perfil de investidor?")).toBe("perfil");
    expect(escolherPersona("como está o mercado hoje?")).toBe("mercado");
    expect(escolherPersona("o que é LCI?", { ehCliente: true })).toBe("educador");
  });
  it("novo contato vira prospect só na primeira do episódio", () => {
    expect(escolherPersona("oi", { ehCliente: false, primeiraDoEpisodio: true })).toBe("prospect");
    expect(escolherPersona("o que é LCI?", { ehCliente: true, primeiraDoEpisodio: true })).toBe("educador");
  });
  it("resposta curta continua a agenda em andamento", () => {
    expect(escolherPersona("terça de manhã", { personaAnterior: "agenda" })).toBe("agenda");
    expect(
      escolherPersona("explique detalhadamente como funciona o tesouro direto", { personaAnterior: "agenda" }),
    ).toBe("educador");
  });
});

describe("marcadores de agenda", () => {
  it("lista", () => {
    const r = extrairMarcadorAgenda("Vou ver os horários.\n[[AGENDAR]]");
    expect(r.marcador).toEqual({ tipo: "listar" });
    expect(r.texto).toBe("Vou ver os horários.");
  });
  it("criar com nome", () => {
    const r = extrairMarcadorAgenda("Fechado! [[AGENDAR:2026-10-26T14:00:00-03:00|Maria Souza]]");
    expect(r.marcador).toEqual({ tipo: "criar", inicio: "2026-10-26T14:00:00-03:00", nome: "Maria Souza" });
    expect(r.texto).toBe("Fechado!");
  });
  it("sem marcador", () => {
    expect(extrairMarcadorAgenda("oi").marcador).toBeNull();
    expect(temMarcadorSolto("oi [[AGENDAR")).toBe(true);
    expect(temMarcadorSolto("oi")).toBe(false);
  });
});

describe("contexto de mercado", () => {
  it("formata cotações sem ações individuais", () => {
    const t = formatarCotacoes({
      updatedAt: "2026-10-23T12:00:00Z",
      quotes: { IBOV: { value: 130000, change: 0.5 }, PETR4: { value: 40, change: 1 }, SELIC: { value: 14.5, change: 0 } },
    });
    expect(t).toContain("Ibovespa");
    expect(t).toContain("Selic");
    expect(t).not.toContain("PETR4");
    expect(formatarCotacoes(null)).toBe("");
  });
  it("limpa HTML do Diário", () => {
    expect(textoDoPost("<p>Olá&nbsp;<b>mundo</b></p><script>x()</script>")).toBe("Olá mundo");
    expect(textoDoPost("a".repeat(2000), 100).length).toBe(101);
  });
});

describe("carregador de fichas", () => {
  it("lê título, categoria e conteúdo", () => {
    const f = parseFicha("# CDB e FGC\ncategoria: renda_fixa\n\n" + "Texto da ficha. ".repeat(5));
    expect(f.titulo).toBe("CDB e FGC");
    expect(f.categoria).toBe("renda_fixa");
    expect(f.conteudo.startsWith("Texto da ficha")).toBe(true);
  });
  it("recusa categoria desconhecida e ficha sem título", () => {
    expect(() => parseFicha("# X\ncategoria: outra\n" + "a".repeat(60))).toThrow();
    expect(() => parseFicha("sem titulo\ncategoria: fii\n" + "a".repeat(60))).toThrow();
  });
  it("pula 00 e 99", () => {
    expect(arquivosDeFichas(["00-fontes.md", "01-a.md", "24-z.md", "99-guarda-corpo.md", "leia.txt"])).toEqual([
      "01-a.md",
      "24-z.md",
    ]);
  });
});
