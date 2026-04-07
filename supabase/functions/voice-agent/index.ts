import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error("UNAUTHORIZED");
  }
  return data.claims.sub as string;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    try {
      await authenticateRequest(req);
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const transcript = body?.transcript;

    if (!transcript || typeof transcript !== "string" || transcript.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid transcript" }),
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
                    enum: ["search", "navigate", "answer", "create_interaction", "create_reminder"],
                  },
                  response: { type: "string", description: "Friendly response to speak back (max 2 sentences)" },
                  data: {
                    type: "object",
                    properties: {
                      query: { type: "string" },
                      route: { type: "string" },
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

    let result;
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { action: "answer", response: "Desculpe, não entendi. Pode repetir?", data: {} };
      }
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        result = JSON.parse(content);
      } catch {
        result = { action: "answer", response: content || "Desculpe, não entendi.", data: {} };
      }
    }

    if (!result.action || !result.response) {
      result = { action: "answer", response: result.response || "Desculpe, ocorreu um erro.", data: {} };
    }

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