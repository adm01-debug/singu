// ============================================================================
// SINGU CRM — Unit tests para helpers de _shared/auth.ts
// ============================================================================

import { describe, it, expect } from "vitest";

// NOTA: como _shared/auth.ts roda em Deno (edge function), não dá pra importar
// direto no Node/Vitest. Replicamos as funções puras aqui pra testar a lógica.

function sanitizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let phone = String(raw).replace(/\D/g, "").slice(0, 15);
  if (phone.startsWith("55") && phone.length > 11) {
    phone = phone.substring(2);
  }
  return phone.length >= 8 ? phone : "";
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

describe("sanitizePhone", () => {
  it("remove caracteres não numéricos", () => {
    expect(sanitizePhone("+55 (11) 99999-8888")).toBe("11999998888");
  });

  it("remove prefixo 55 quando length > 11", () => {
    expect(sanitizePhone("5511999998888")).toBe("11999998888");
  });

  it("mantém telefone fixo 10 dígitos sem 55", () => {
    expect(sanitizePhone("1133334444")).toBe("1133334444");
  });

  it("mantém celular 11 dígitos sem prefixo", () => {
    expect(sanitizePhone("11999998888")).toBe("11999998888");
  });

  it("retorna vazio para input null", () => {
    expect(sanitizePhone(null)).toBe("");
  });

  it("retorna vazio para input undefined", () => {
    expect(sanitizePhone(undefined)).toBe("");
  });

  it("retorna vazio para string vazia", () => {
    expect(sanitizePhone("")).toBe("");
  });

  it("retorna vazio para telefone curto demais", () => {
    expect(sanitizePhone("1234567")).toBe("");
  });

  it("limita a 15 caracteres (E.164)", () => {
    expect(sanitizePhone("999999999999999999999")).toBe("999999999999999");
  });

  it("rejeita injection com aspas e wildcards", () => {
    // Tentativa de injection PostgREST
    expect(sanitizePhone("11999%' OR '1'='1")).toBe("119991111");
  });

  it("rejeita comandos SQL embutidos", () => {
    expect(sanitizePhone("11; DROP TABLE contacts; --")).toBe("11");
    // Cai abaixo de 8 dígitos → vazio
    expect(sanitizePhone("11; DROP TABLE contacts; --")).toBe("");
  });

  it("aceita formato internacional não-Brasil", () => {
    // EUA: +1-555-1234567 → 11 dígitos sem prefixo Brasil
    expect(sanitizePhone("+1 555 123-4567")).toBe("15551234567");
  });
});

describe("constantTimeEqual", () => {
  it("retorna true para strings iguais", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
  });

  it("retorna false para strings diferentes mesmo tamanho", () => {
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });

  it("retorna false para tamanhos diferentes", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("retorna true para strings vazias", () => {
    expect(constantTimeEqual("", "")).toBe(true);
  });

  it("é case-sensitive", () => {
    expect(constantTimeEqual("ABC", "abc")).toBe(false);
  });

  it("funciona com caracteres especiais", () => {
    expect(constantTimeEqual("!@#$%^&*()", "!@#$%^&*()")).toBe(true);
  });
});
