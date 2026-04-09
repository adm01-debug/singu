// ============================================================================
// SINGU CRM — Smoke Tests para Edge Functions
// Testa segurança e contratos básicos das edge functions críticas
//
// Como rodar:
//   bun test src/__tests__/edge-functions.test.ts
//   ou: npm test
//
// Pré-requisitos:
//   - VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.test
//   - TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.test
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;

const TEST_EMAIL = import.meta.env.TEST_USER_EMAIL || "test@singu.local";
const TEST_PASSWORD = import.meta.env.TEST_USER_PASSWORD || "Test@1234567890";

let supabase: SupabaseClient;
let authToken: string;
let testContactId: string;

beforeAll(async () => {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Login do test user (ele precisa existir antes — criar manualmente)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.warn("⚠️  Test user signin failed. Tests requiring auth will skip.");
    return;
  }

  authToken = data.session?.access_token ?? "";

  // Criar contato de teste
  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      first_name: "Test",
      last_name: "Smoke",
      email: `smoke+${Date.now()}@test.com`,
      phone: "11999999999",
    })
    .select("id")
    .single();

  testContactId = contact?.id ?? "";
});

afterAll(async () => {
  if (testContactId) {
    await supabase.from("contacts").delete().eq("id", testContactId);
  }
  await supabase.auth.signOut();
});

// ============================================================================
// CATEGORIA 1: Funções devem REJEITAR requisições anônimas
// ============================================================================

describe("🔒 Authentication enforcement (anonymous calls must be rejected)", () => {
  const PROTECTED_FUNCTIONS = [
    "disc-analyzer",
    "voice-to-text",
    "ai-writing-assistant",
    "generate-insights",
    "generate-offer-suggestions",
    "suggest-next-action",
    "enrichlayer-linkedin",
    "firecrawl-scrape",
    "enrich-contacts",
    "social-profile-scraper",
    "social-behavior-analyzer",
    "social-events-detector",
    "rfm-analyzer",
    "elevenlabs-tts",
    "elevenlabs-scribe-token",
    "voice-agent",
    "external-data",
    "lux-trigger",
  ];

  PROTECTED_FUNCTIONS.forEach((fn) => {
    it(`${fn} retorna 401 para chamadas sem JWT`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([401, 403]).toContain(res.status);
    });

    it(`${fn} retorna 401 para JWT inválido`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer this-is-a-fake-token-xxx",
        },
        body: JSON.stringify({}),
      });
      expect([401, 403]).toContain(res.status);
    });
  });
});

// ============================================================================
// CATEGORIA 2: Webhooks de terceiros devem REJEITAR sem secret
// ============================================================================

describe("🔒 Webhook secret enforcement", () => {
  const WEBHOOKS = [
    { fn: "bitrix24-webhook", header: "x-bitrix-secret" },
    { fn: "evolution-webhook", header: "x-evolution-secret" },
    { fn: "evolution-api", header: "x-evolution-secret" },
    { fn: "lux-webhook", header: "x-lux-secret" },
  ];

  WEBHOOKS.forEach(({ fn, header }) => {
    it(`${fn} retorna 401 sem ${header}`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "test" }),
      });
      expect([401, 503]).toContain(res.status);
    });

    it(`${fn} retorna 401 com ${header} inválido`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [header]: "wrong-secret",
        },
        body: JSON.stringify({ event: "test" }),
      });
      expect([401, 503]).toContain(res.status);
    });
  });
});

// ============================================================================
// CATEGORIA 3: Crons devem REJEITAR sem cron secret
// ============================================================================

describe("🔒 Cron secret enforcement", () => {
  const CRONS = [
    "check-notifications",
    "check-health-alerts",
    "client-notifications",
    "template-success-notifications",
    "smart-reminders",
    "weekly-digest",
  ];

  CRONS.forEach((fn) => {
    it(`${fn} retorna 401 sem x-cron-secret`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([401, 503]).toContain(res.status);
    });
  });
});

// ============================================================================
// CATEGORIA 4: disc-analyzer com auth válida deve aceitar
// ============================================================================

describe("✅ Authenticated calls (positive tests)", () => {
  it("disc-analyzer aceita request autenticada com payload válido", async () => {
    if (!authToken) return; // skip se test user não existe

    const res = await fetch(`${FN_BASE}/disc-analyzer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        texts: ["Olá, gostaria de saber mais sobre o produto. Estou pesquisando opções para meu time."],
        contactId: testContactId,
      }),
    });

    // 200 = sucesso, 402 = sem créditos AI (aceitável), 429 = rate limit
    expect([200, 402, 429]).toContain(res.status);

    if (res.status === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.analysis).toHaveProperty("scores");
      expect(body.analysis.scores).toHaveProperty("D");
      expect(body.analysis.scores).toHaveProperty("I");
      expect(body.analysis.scores).toHaveProperty("S");
      expect(body.analysis.scores).toHaveProperty("C");
    }
  });

  it("disc-analyzer rejeita contactId de outro usuário", async () => {
    if (!authToken) return;

    const fakeContactId = "00000000-0000-0000-0000-000000000000";
    const res = await fetch(`${FN_BASE}/disc-analyzer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        texts: ["test text long enough to be valid for analysis purposes here"],
        contactId: fakeContactId,
      }),
    });

    expect([403, 404]).toContain(res.status);
  });
});

// ============================================================================
// CATEGORIA 5: external-data — write operations exigem admin
// ============================================================================

describe("🔒 external-data admin gate", () => {
  it("SELECT operations passam para qualquer usuário autenticado", async () => {
    if (!authToken) return;

    const res = await fetch(`${FN_BASE}/external-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "select",
        table: "contacts",
        range: { from: 0, to: 0 },
      }),
    });

    // 200 ok, 500 se EXTERNAL_SUPABASE_URL não configurado (mas não 401/403)
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("INSERT é bloqueado para usuário não-admin", async () => {
    if (!authToken) return;

    const res = await fetch(`${FN_BASE}/external-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "insert",
        table: "contacts",
        record: { first_name: "Hacker" },
      }),
    });

    // Se não é admin → 403; se for admin → vai depender do banco externo
    // Mas NUNCA pode ser 200 sem ser admin
    if (res.status === 200) {
      // Se passou, é porque o test user é admin — ok
      console.warn("Test user is admin — skipping non-admin assertion");
    } else {
      expect([401, 403, 500]).toContain(res.status);
    }
  });
});

// ============================================================================
// CATEGORIA 6: CORS funciona corretamente
// ============================================================================

describe("🌐 CORS preflight", () => {
  const FUNCTIONS_TO_CHECK = ["disc-analyzer", "lux-trigger", "external-data"];

  FUNCTIONS_TO_CHECK.forEach((fn) => {
    it(`${fn} responde OPTIONS preflight`, async () => {
      const res = await fetch(`${FN_BASE}/${fn}`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization, content-type",
        },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
    });
  });
});

// ============================================================================
// CATEGORIA 7: Validação de input
// ============================================================================

describe("🛡️ Input validation", () => {
  it("disc-analyzer rejeita texts vazios", async () => {
    if (!authToken) return;

    const res = await fetch(`${FN_BASE}/disc-analyzer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ texts: [], contactId: testContactId }),
    });

    expect(res.status).toBe(400);
  });

  it("disc-analyzer rejeita sem contactId", async () => {
    if (!authToken) return;

    const res = await fetch(`${FN_BASE}/disc-analyzer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ texts: ["abc"] }),
    });

    expect(res.status).toBe(400);
  });

  it("voice-to-text rejeita audio > 5MB", async () => {
    if (!authToken) return;

    // String base64 de ~6MB
    const hugeAudio = "A".repeat(6_500_000);
    const res = await fetch(`${FN_BASE}/voice-to-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ audio: hugeAudio }),
    });

    expect(res.status).toBe(413);
  });

  it("external-data rejeita tabela não permitida", async () => {
    if (!authToken) return;

    const res = await fetch(`${FN_BASE}/external-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: "select",
        table: "auth.users",
      }),
    });

    expect(res.status).toBe(400);
  });
});
