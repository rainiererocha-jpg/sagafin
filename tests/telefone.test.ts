import { describe, expect, it } from "vitest";
import {
  formatarTelefoneBR, motivoBloqueio, telefoneValidoParaDisparo, validarListaTelefones, validarTelefone,
} from "../supabase/functions/_shared/telefone.ts";

describe("validarTelefone", () => {
  it("aceita o padrão perfeito de 13 dígitos", () => {
    const r = validarTelefone("5562981526559");
    expect(r.status).toBe("aceito");
    expect(r.numero_final).toBe("5562981526559");
  });
  it("corrige 11 dígitos prefixando 55", () => {
    expect(validarTelefone("(62) 98152-6559").numero_final).toBe("5562981526559");
  });
  it("corrige 12 dígitos inserindo o nono dígito", () => {
    const r = validarTelefone("556281526559");
    expect(r.status).toBe("corrigido");
    expect(r.numero_final).toBe("5562981526559");
  });
  it("corrige 10 dígitos", () => {
    expect(validarTelefone("6281526559").numero_final).toBe("5562981526559");
  });
  it("descarta DDD inexistente", () => {
    expect(validarTelefone("56281526559").motivo).toBe("DDD_INVALIDO");
  });
  it("descarta fixo", () => {
    expect(validarTelefone("6232221234").motivo).toBe("TELEFONE_FIXO");
  });
  it("descarta internacional, vazio e dígitos repetidos", () => {
    expect(validarTelefone("351912345678").motivo).toBe("INTERNACIONAL");
    expect(validarTelefone("").motivo).toBe("VAZIO");
    expect(validarTelefone("5562999999999").motivo).toBe("DIGITOS_REPETIDOS");
  });
  it("sem correção automática só passa o perfeito", () => {
    expect(validarTelefone("62981526559", { corrigirAutomaticamente: false }).status).toBe("descartado");
    expect(telefoneValidoParaDisparo("5562981526559")).toBe(true);
    expect(telefoneValidoParaDisparo("62981526559")).toBe(false);
  });
  it("motivoBloqueio: null quando perfeito, motivo real quando não", () => {
    expect(motivoBloqueio("5562981526559")).toBeNull();
    expect(motivoBloqueio("56281526559")).toBe("DDD_INVALIDO");
    expect(motivoBloqueio("556281526559")).toBe("QTD_DIGITOS");
  });
  it("formata para exibição", () => {
    expect(formatarTelefoneBR("5562981526559")).toBe("(62) 98152-6559");
  });
  it("lista: remove duplicados e respeita jaExistentes", () => {
    const r = validarListaTelefones(
      [{ telefone: "62981526559" }, { telefone: "5562981526559" }, { telefone: "62988887777" }],
      { jaExistentes: ["5562988887777"] },
    );
    expect(r.corrigidos).toHaveLength(1);
    expect(r.descartados.map((d) => d.motivo)).toEqual(["DUPLICADO", "DUPLICADO"]);
  });
});
