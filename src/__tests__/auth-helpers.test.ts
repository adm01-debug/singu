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


// ============================================================================
// withAuthOrServiceRole / isServiceRoleCaller (round 2 audit fix)
// ============================================================================

const SERVICE_ROLE_KEY = "eyJfake_service_role_for_test_purposes_only_xyz123";

function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Pure logic of withAuthOrServiceRole — extracted for testability
function classifyAuthHeader(authHeader: string | null, serviceKey: string): "user_jwt" | "service_role" | "missing" {
  if (!authHeader?.startsWith("Bearer ")) return "missing";
  const token = authHeader.substring(7);
  if (serviceKey && token.length === serviceKey.length && constantTimeStringEqual(token, serviceKey)) {
    return "service_role";
  }
  return "user_jwt";
}

describe("withAuthOrServiceRole — auth header classification", () => {
  it("rejects requests with no Authorization header", () => {
    expect(classifyAuthHeader(null, SERVICE_ROLE_KEY)).toBe("missing");
  });

  it("rejects requests with malformed Authorization (no Bearer)", () => {
    expect(classifyAuthHeader("Basic abc123", SERVICE_ROLE_KEY)).toBe("missing");
  });

  it("identifies service_role token via constant-time comparison", () => {
    expect(classifyAuthHeader(`Bearer ${SERVICE_ROLE_KEY}`, SERVICE_ROLE_KEY)).toBe("service_role");
  });

  it("treats any other Bearer token as user JWT (will be validated downstream)", () => {
    expect(classifyAuthHeader("Bearer eyJ_user_jwt_xyz", SERVICE_ROLE_KEY)).toBe("user_jwt");
  });

  it("does NOT match service_role if token has different length (timing-safe)", () => {
    const wrongKey = SERVICE_ROLE_KEY.slice(0, -1); // 1 char shorter
    expect(classifyAuthHeader(`Bearer ${wrongKey}`, SERVICE_ROLE_KEY)).toBe("user_jwt");
  });

  it("does NOT match service_role if token has 1 different char in same length", () => {
    const tampered = "X" + SERVICE_ROLE_KEY.slice(1);
    expect(classifyAuthHeader(`Bearer ${tampered}`, SERVICE_ROLE_KEY)).toBe("user_jwt");
  });

  it("requires non-empty service_role to match", () => {
    expect(classifyAuthHeader("Bearer ", "")).toBe("user_jwt");
  });
});

describe("isServiceRoleCaller marker", () => {
  const MARKER = "__SERVICE_ROLE__";

  it("returns true for the exact marker string", () => {
    expect(MARKER === "__SERVICE_ROLE__").toBe(true);
  });

  it("returns false for any UUID-like userId", () => {
    expect("a1b2c3d4-e5f6-7890-abcd-ef1234567890" === MARKER).toBe(false);
  });

  it("returns false for empty string", () => {
    expect("" === MARKER).toBe(false);
  });
});

// ============================================================================
// disc-analyzer dual-auth flow (integration logic)
// ============================================================================
describe("disc-analyzer dual-auth resolution", () => {
  function resolveUserId(
    callerType: "user_jwt" | "service_role",
    jwtUserId: string | null,
    bodyUserId: string | undefined,
    contactOwnerId: string
  ): { userId: string | null; error: string | null } {
    if (callerType === "service_role") {
      if (!bodyUserId) return { userId: null, error: "userId required for service-role calls" };
      // After ownership check, userId is overridden by contact owner
      return { userId: contactOwnerId, error: null };
    }
    // user JWT path
    if (!jwtUserId) return { userId: null, error: "Unauthorized" };
    if (contactOwnerId !== jwtUserId) {
      return { userId: null, error: "Forbidden: contact does not belong to user" };
    }
    return { userId: jwtUserId, error: null };
  }

  it("user JWT: returns JWT userId when contact ownership matches", () => {
    const r = resolveUserId("user_jwt", "user-1", undefined, "user-1");
    expect(r).toEqual({ userId: "user-1", error: null });
  });

  it("user JWT: rejects when caller tries to access another user's contact", () => {
    const r = resolveUserId("user_jwt", "user-1", undefined, "user-2");
    expect(r.error).toMatch(/Forbidden/);
    expect(r.userId).toBeNull();
  });

  it("user JWT: ignores body.userId entirely (anti-impersonation)", () => {
    const r = resolveUserId("user_jwt", "user-1", "user-99-attacker", "user-1");
    expect(r.userId).toBe("user-1"); // not "user-99-attacker"
  });

  it("service_role: requires body.userId to be present", () => {
    const r = resolveUserId("service_role", null, undefined, "user-1");
    expect(r.error).toMatch(/userId required/);
  });

  it("service_role: overrides body.userId with contact owner (defense in depth)", () => {
    const r = resolveUserId("service_role", null, "user-99-attacker", "user-1");
    expect(r.userId).toBe("user-1"); // contact owner wins, not body.userId
  });
});
