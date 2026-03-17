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

interface AnalyzeRequest {
  contactId: string;
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

    const { contactId }: AnalyzeRequest = await req.json();

    if (!contactId) {
      return new Response(JSON.stringify({ error: "Contact ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar perfis sociais do contato
    const { data: socialProfiles, error: profilesError } = await supabaseClient
      .from('social_profiles')
      .select('*')
      .eq('contact_id', contactId);

    if (profilesError || !socialProfiles || socialProfiles.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No social profiles found for this contact" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar dados do contato
    const { data: contact } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    // Preparar dados para análise
    const profilesSummary = socialProfiles.map(p => ({
      platform: p.platform,
      headline: p.headline,
      current_company: p.current_company,
      current_position: p.current_position,
      skills: p.skills,
      followers: p.followers_count,
      following: p.following_count,
      recent_posts: p.recent_posts?.slice(0, 5),
      experience: p.experience,
    }));

    const systemPrompt = `Você é um especialista em análise comportamental e psicologia aplicada a vendas. Sua tarefa é analisar perfis de redes sociais para extrair insights comportamentais que ajudem em estratégias de relacionamento comercial.

Analise os dados fornecidos e retorne insights nas seguintes categorias:

1. TRAÇOS DE PERSONALIDADE (Big Five inferido):
- Abertura a experiências (curiosidade, criatividade)
- Conscienciosidade (organização, disciplina)
- Extroversão (sociabilidade, energia)
- Amabilidade (cooperação, empatia)
- Neuroticismo (estabilidade emocional)

2. ESTILO DE COMUNICAÇÃO:
- Formal vs Informal
- Técnico vs Emocional
- Direto vs Indireto
- Visual vs Textual

3. INTERESSES E MOTIVAÇÕES:
- Tópicos de interesse
- Valores profissionais
- Motivadores de carreira

4. NÍVEL DE INFLUÊNCIA:
- thought_leader: Cria conteúdo original, muitos seguidores
- active_contributor: Engaja ativamente, compartilha insights
- passive_observer: Consome mais do que produz
- lurker: Presença mínima

5. INSIGHTS DE VENDAS:
- Melhores abordagens
- Tópicos para rapport
- Gatilhos de decisão prováveis
- O que evitar

Responda APENAS com um JSON válido no formato especificado.`;

    const userPrompt = `Analise os seguintes perfis de redes sociais:

CONTATO: ${contact?.first_name} ${contact?.last_name}
CARGO: ${contact?.role || 'Não informado'}

PERFIS SOCIAIS:
${JSON.stringify(profilesSummary, null, 2)}

Retorne um JSON com a seguinte estrutura:
{
  "personality_traits": {
    "openness": { "score": 0.7, "indicators": ["curiosidade em posts", "interesse em inovação"] },
    "conscientiousness": { "score": 0.8, "indicators": [] },
    "extraversion": { "score": 0.6, "indicators": [] },
    "agreeableness": { "score": 0.7, "indicators": [] },
    "neuroticism": { "score": 0.3, "indicators": [] }
  },
  "communication_style": {
    "formality": "formal|informal|balanced",
    "approach": "technical|emotional|balanced",
    "directness": "direct|indirect|balanced",
    "preferred_format": "visual|textual|balanced",
    "tips": ["dica 1", "dica 2"]
  },
  "interests": ["interesse 1", "interesse 2"],
  "topics": ["tópico 1", "tópico 2"],
  "keywords": ["palavra-chave 1", "palavra-chave 2"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "overall_sentiment": "positive|neutral|negative",
  "sentiment_score": 0.7,
  "influence_level": "thought_leader|active_contributor|passive_observer|lurker",
  "influence_score": 0.6,
  "active_hours": { "morning": 0.3, "afternoon": 0.5, "evening": 0.2 },
  "active_days": ["weekdays|weekends|both"],
  "sales_insights": {
    "best_approaches": ["abordagem 1", "abordagem 2"],
    "rapport_topics": ["tópico 1", "tópico 2"],
    "decision_triggers": ["gatilho 1", "gatilho 2"],
    "avoid": ["evitar 1", "evitar 2"],
    "optimal_contact_time": "manhã|tarde|noite",
    "preferred_channel": "email|linkedin|phone|whatsapp"
  },
  "executive_summary": "Resumo executivo de 2-3 frases sobre o perfil comportamental"
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
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Insufficient credits. Please add credits in Settings." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    // Parse JSON da resposta
    let analysis: any = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw content:", content);
    }

    if (!analysis) {
      return new Response(JSON.stringify({ 
        error: "Failed to parse analysis results" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Salvar análise no banco
    const analysisData = {
      contact_id: contactId,
      user_id: user.id,
      personality_traits: analysis.personality_traits,
      communication_style: analysis.communication_style,
      interests: analysis.interests,
      topics: analysis.topics,
      overall_sentiment: analysis.overall_sentiment,
      sentiment_score: analysis.sentiment_score,
      active_hours: analysis.active_hours,
      active_days: analysis.active_days,
      influence_level: analysis.influence_level,
      influence_score: analysis.influence_score,
      keywords: analysis.keywords,
      hashtags: analysis.hashtags,
      sales_insights: analysis.sales_insights,
      executive_summary: analysis.executive_summary,
      confidence: 0.75,
    };

    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from('social_behavior_analysis')
      .insert(analysisData)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving analysis:", saveError);
    }

    console.log(`Successfully analyzed behavior for contact ${contactId}`);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      savedId: savedAnalysis?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("social-behavior-analyzer error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
