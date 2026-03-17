import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contacts, interactions, companies } = await req.json();

    const systemPrompt = `Você é um assistente especializado em análise de relacionamentos comerciais e CRM. Sua função é analisar dados de contatos, empresas e interações para gerar insights acionáveis.

Analise os dados fornecidos e gere insights nas seguintes categorias:
1. RELACIONAMENTO: Avalie a saúde dos relacionamentos, identifique contatos que precisam de atenção
2. SENTIMENTO: Analise o sentimento das interações e identifique tendências
3. AÇÃO: Sugira ações específicas para melhorar relacionamentos
4. OPORTUNIDADE: Identifique oportunidades de negócio ou networking
5. RISCO: Identifique riscos de perda de relacionamento ou cliente

Para cada insight, forneça:
- Título claro e objetivo
- Descrição detalhada
- Sugestão de ação específica
- Nível de confiança (0-100)
- Se é acionável (true/false)

Responda APENAS com um JSON válido no formato especificado.`;

    const userPrompt = `Analise os seguintes dados e gere insights:

CONTATOS (${contacts?.length || 0}):
${JSON.stringify(contacts?.slice(0, 20) || [], null, 2)}

INTERAÇÕES RECENTES (${interactions?.length || 0}):
${JSON.stringify(interactions?.slice(0, 30) || [], null, 2)}

EMPRESAS (${companies?.length || 0}):
${JSON.stringify(companies?.slice(0, 10) || [], null, 2)}

Gere entre 3 e 8 insights relevantes baseados nestes dados. Retorne um JSON com a seguinte estrutura:
{
  "insights": [
    {
      "category": "relationship|sentiment|action|opportunity|risk",
      "title": "Título do insight",
      "description": "Descrição detalhada",
      "action_suggestion": "Sugestão de ação específica",
      "confidence": 85,
      "actionable": true,
      "contact_id": "uuid do contato relacionado (opcional)",
      "priority": "high|medium|low"
    }
  ]
}`;

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar insights" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    // Parse the JSON from the response
    let insights = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw content:", content);
    }

    return new Response(JSON.stringify({ insights, raw: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-insights error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
