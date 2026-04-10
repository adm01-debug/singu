import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { contact, interactions, company } = await req.json();

    console.log("Generating next action suggestion for contact:", contact?.id);

    const systemPrompt = `Você é um assistente especializado em relacionamentos comerciais e CRM. Sua função é analisar o perfil de um contato, seu histórico de interações e sugerir a melhor próxima ação a ser tomada.

Considere:
1. O perfil comportamental DISC do contato e como isso afeta a comunicação
2. O histórico de interações recentes (frequência, tipo, sentimento)
3. O estágio do relacionamento atual
4. Eventos importantes (aniversários, últimas reuniões)
5. O cargo e papel de decisão do contato
6. O tempo desde a última interação

Gere UMA sugestão de próxima ação que seja:
- Específica e acionável
- Baseada no contexto real do relacionamento
- Adequada ao perfil comportamental do contato
- Com timing apropriado

Use tool calling para retornar a resposta estruturada.`;

    const userPrompt = `Analise este contato e sugira a melhor próxima ação:

CONTATO:
${JSON.stringify(contact, null, 2)}

HISTÓRICO DE INTERAÇÕES (últimas 10):
${JSON.stringify(interactions?.slice(0, 10) || [], null, 2)}

EMPRESA:
${JSON.stringify(company || {}, null, 2)}

Com base nestes dados, qual é a melhor próxima ação a ser tomada com este contato?`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_next_action",
              description: "Retorna a sugestão de próxima ação para o contato.",
              parameters: {
                type: "object",
                properties: {
                  action_type: {
                    type: "string",
                    enum: ["call", "email", "whatsapp", "meeting", "social", "gift", "follow_up"],
                    description: "Tipo de ação sugerida"
                  },
                  title: { type: "string", description: "Título curto da ação (max 60 caracteres)" },
                  description: { type: "string", description: "Descrição detalhada da ação e porque ela é recomendada" },
                  suggested_message: { type: "string", description: "Exemplo de mensagem ou script para a interação (opcional)" },
                  urgency: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Nível de urgência da ação" },
                  best_time: { type: "string", description: "Melhor horário ou dia para realizar a ação" },
                  reasoning: { type: "string", description: "Explicação de por que esta ação é a melhor escolha" },
                  confidence: { type: "number", description: "Nível de confiança na sugestão (0-100)" }
                },
                required: ["action_type", "title", "description", "urgency", "reasoning", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_next_action" } },
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonError("Limite de requisições excedido. Tente novamente em alguns minutos.", 429);
      if (response.status === 402) return jsonError("Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso.", 402);
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonError("Erro ao gerar sugestão", 500);
    }

    const aiResponse = await response.json();
    console.log("AI Response received:", JSON.stringify(aiResponse, null, 2));

    let suggestion = null;
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        suggestion = JSON.parse(toolCall.function.arguments);
        console.log("Parsed suggestion:", suggestion);
      } catch (parseError) {
        console.error("Error parsing tool call arguments:", parseError);
      }
    }

    return jsonOk({ suggestion });
  } catch (error) {
    console.error("suggest-next-action error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500);
  }
});
