import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_TRANSCRIPT_LENGTH = 1000;

const SYSTEM_PROMPT = `Você é um assistente de voz inteligente para um CRM de relacionamentos (SINGU).
Sua função é interpretar comandos de voz do usuário e retornar uma ação estruturada.

CONTEXTO: O usuário gerencia contatos, empresas, interações e relacionamentos comerciais.

PÁGINAS DO SISTEMA:
- /dashboard (painel principal)
- /contatos (lista de contatos)
- /empresas (lista de empresas)
- /interacoes (interações)
- /pipeline (pipeline de vendas)
- /automacao (automações)
- /relatorios (relatórios)
- /configuracoes (configurações)

AÇÕES DISPONÍVEIS:
- search: Buscar contatos ou empresas
- navigate: Navegar para uma página
- answer: Responder uma pergunta geral
- create_interaction: Sugerir criar uma interação
- create_reminder: Sugerir criar um lembrete

Responda SEMPRE em JSON com esta estrutura:
{
  "action": "search" | "navigate" | "answer" | "create_interaction" | "create_reminder",
  "response": "texto curto e amigável para falar de volta ao usuário (max 2 frases)",
  "data": {
    "query": "termo de busca (se action=search)",
    "route": "rota para navegar (se action=navigate)",
    "contactName": "nome do contato mencionado (se aplicável)",
    "filters": {
      "tag": "tag mencionada",
      "company": "empresa mencionada",
      "sentiment": "sentimento mencionado"
    }
  }
}

Se o usuário fizer uma pergunta geral, use action="answer" e responda de forma útil.
Se o comando não fizer sentido, responda com action="answer" e peça esclarecimento.
Seja conciso e amigável. Use linguagem informal brasileira.`;

const VALID_ACTIONS = ["search", "navigate", "answer", "create_interaction", "create_reminder"];
const VALID_ROUTES = ["/dashboard", "/contatos", "/empresas", "/interacoes", "/pipeline", "/automacao", "/relatorios", "/configuracoes"];

function sanitizeTranscript(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "").trim();
}

function validateRoute(route: string | undefined): string | undefined {
  if (!route) return undefined;
  return VALID_ROUTES.includes(route) ? route : undefined;
}

function sanitizeResult(raw: Record<string, unknown>): Record<string, unknown> {
  const action = typeof raw.action === "string" && VALID_ACTIONS.includes(raw.action)
    ? raw.action
    : "answer";

  const response = typeof raw.response === "string"
    ? raw.response.slice(0, 500)
    : "Desculpe, não entendi. Pode repetir?";

  const data: Record<string, unknown> = {};
  if (raw.data && typeof raw.data === "object") {
    const d = raw.data as Record<string, unknown>;
    if (typeof d.query === "string") data.query = d.query.slice(0, 200);
    if (typeof d.route === "string") data.route = validateRoute(d.route);
    if (typeof d.contactName === "string") data.contactName = d.contactName.slice(0, 100);
    if (d.filters && typeof d.filters === "object") {
      const f = d.filters as Record<string, unknown>;
      const filters: Record<string, string> = {};
      for (const key of ["tag", "company", "sentiment"]) {
        if (typeof f[key] === "string") filters[key] = (f[key] as string).slice(0, 100);
      }
      if (Object.keys(filters).length > 0) data.filters = filters;
    }
  }

  return { action, response, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawTranscript = body?.transcript;
    if (!rawTranscript || typeof rawTranscript !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: transcript (string)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = sanitizeTranscript(rawTranscript);
    if (transcript.length === 0) {
      return new Response(
        JSON.stringify({ error: "Transcript is empty after sanitization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "execute_voice_command",
              description: "Execute a voice command from the user",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: VALID_ACTIONS,
                  },
                  response: { type: "string", description: "Friendly response to speak back (max 2 sentences)" },
                  data: {
                    type: "object",
                    properties: {
                      query: { type: "string" },
                      route: { type: "string", enum: VALID_ROUTES },
                      contactName: { type: "string" },
                      filters: {
                        type: "object",
                        properties: {
                          tag: { type: "string" },
                          company: { type: "string" },
                          sentiment: { type: "string" },
                        },
                      },
                    },
                  },
                },
                required: ["action", "response"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_voice_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let rawResult: Record<string, unknown>;
    if (toolCall?.function?.arguments) {
      try {
        rawResult = JSON.parse(toolCall.function.arguments);
      } catch {
        rawResult = { action: "answer", response: "Desculpe, não entendi. Pode repetir?", data: {} };
      }
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        rawResult = JSON.parse(content);
      } catch {
        rawResult = { action: "answer", response: content || "Desculpe, não entendi.", data: {} };
      }
    }

    const result = sanitizeResult(rawResult);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Voice agent error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
