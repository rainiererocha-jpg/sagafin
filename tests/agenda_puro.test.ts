import { describe, expect, it } from "vitest";
import {
  filtrarLivres, gerarSlots, resumirSlots, rotuloSlot, sobrepoe, validarSlot,
} from "../supabase/functions/_shared/agenda_puro.ts";

// Sexta, 23/10/2026 10:00 em Brasília = 13:00 UTC
const SEXTA_10H = new Date("2026-10-23T13:00:00Z");
const local = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 16);

describe("gerarSlots", () => {
  const slots = gerarSlots(SEXTA_10H);
  it("só seg-sex, 9h a 18h, de 30 em 30", () => {
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      const l = new Date(new Date(s.inicio).getTime() - 3 * 3_600_000);
      expect([0, 6]).not.toContain(l.getUTCDay());
      const min = l.getUTCHours() * 60 + l.getUTCMinutes();
      expect(min).toBeGreaterThanOrEqual(9 * 60);
      expect(min + 30).toBeLessThanOrEqual(18 * 60);
      expect(min % 30).toBe(0);
    }
  });
  it("respeita a antecedência de 2 h (primeiro horário de sexta é 12:00)", () => {
    expect(local(slots[0].inicio)).toBe("2026-10-23T12:00");
  });
  it("pula o fim de semana (depois de sexta vem segunda)", () => {
    const dias = new Set(slots.map((s) => local(s.inicio).slice(0, 10)));
    expect(dias.has("2026-10-24")).toBe(false);
    expect(dias.has("2026-10-25")).toBe(false);
    expect(dias.has("2026-10-26")).toBe(true);
  });
  it("último horário do dia começa 17:30", () => {
    const seg = slots.filter((s) => local(s.inicio).startsWith("2026-10-26"));
    expect(local(seg[seg.length - 1].inicio)).toBe("2026-10-26T17:30");
  });
  it("não passa de 7 dias", () => {
    const limite = SEXTA_10H.getTime() + 7 * 86_400_000;
    expect(slots.every((s) => Date.parse(s.inicio) <= limite)).toBe(true);
  });
  it("rótulo em português", () => {
    expect(rotuloSlot(new Date("2026-10-26T17:00:00Z"))).toBe("seg, 26/10 às 14:00");
  });
});

describe("filtrarLivres / sobrepoe", () => {
  const slots = gerarSlots(SEXTA_10H);
  it("tira o horário ocupado e só ele", () => {
    const ocupado = [{ start: "2026-10-26T12:00:00Z", end: "2026-10-26T13:00:00Z" }]; // 09:00 e 09:30 locais
    const livres = filtrarLivres(slots, ocupado);
    expect(livres.length).toBe(slots.length - 2);
    expect(livres.some((s) => local(s.inicio) === "2026-10-26T09:00")).toBe(false);
    expect(livres.some((s) => local(s.inicio) === "2026-10-26T10:00")).toBe(true);
  });
  it("encostar na ponta não é sobreposição", () => {
    expect(sobrepoe(0, 10, 10, 20)).toBe(false);
    expect(sobrepoe(0, 11, 10, 20)).toBe(true);
  });
  it("ignora intervalos inválidos", () => {
    expect(filtrarLivres(slots, [{ start: "x", end: "y" }]).length).toBe(slots.length);
  });
});

describe("resumirSlots", () => {
  it("no máximo 2 por dia e 6 no total", () => {
    const r = resumirSlots(gerarSlots(SEXTA_10H), 6, 2);
    expect(r).toHaveLength(6);
    const porDia = new Map<string, number>();
    for (const s of r) {
      const d = local(s.inicio).slice(0, 10);
      porDia.set(d, (porDia.get(d) ?? 0) + 1);
    }
    expect(Math.max(...porDia.values())).toBeLessThanOrEqual(2);
  });
});

describe("validarSlot", () => {
  it("aceita horário livre", () => {
    expect(validarSlot("2026-10-26T17:00:00Z", SEXTA_10H, []).ok).toBe(true);
  });
  it("recusa formato, passado, fim de semana, fora do expediente, ocupado e fora da janela", () => {
    expect(validarSlot("amanhã", SEXTA_10H, [])).toEqual({ ok: false, erro: "formato_invalido" });
    expect(validarSlot("2026-10-22T17:00:00Z", SEXTA_10H, [])).toEqual({ ok: false, erro: "passado" });
    expect(validarSlot("2026-10-24T17:00:00Z", SEXTA_10H, [])).toEqual({ ok: false, erro: "fim_de_semana" });
    expect(validarSlot("2026-10-26T08:00:00Z", SEXTA_10H, [])).toEqual({ ok: false, erro: "fora_do_expediente" });
    expect(validarSlot("2026-10-26T17:10:00Z", SEXTA_10H, [])).toEqual({ ok: false, erro: "fora_do_expediente" });
    expect(
      validarSlot("2026-10-26T17:00:00Z", SEXTA_10H, [{ start: "2026-10-26T16:45:00Z", end: "2026-10-26T17:15:00Z" }]),
    ).toEqual({ ok: false, erro: "ocupado" });
    expect(validarSlot("2026-12-01T17:00:00Z", SEXTA_10H, [])).toEqual({ ok: false, erro: "fora_da_janela" });
  });
});
