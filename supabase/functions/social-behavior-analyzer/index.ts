import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

interface AnalyzeRequest {
  contactId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { contactId }: AnalyzeRequest = await req.json();

    if (!contactId) {
      return jsonError("Contact ID is required", 400);
    }

    const { data: socialProfiles, error: profilesError } = await supabaseClient
      .from("social_profiles").select("*").eq("contact_id", contactId);

    if (profilesError || !socialProfiles || socialProfiles.length === 0) {
      return jsonError("No social profiles found for this contact", 404);
    }

    const { data: contact } = await supabaseClient
      .from("contacts").select("*").eq("id", contactId).single();

    const profilesSummary = socialProfiles.map(p => ({
      platform: p.platform, headline: p.headline, current_company: p.current_company,
      current_position: p.current_position, skills: p.skills, followers: p.followers_count,
      following: p.following_count, recent_posts: p.recent_posts?.slice(0, 5), experience: p.experience,
    }));

    const systemPrompt = `Você é um especialista em análise comportamental e psicologia aplicada a vendas. Sua tarefa é analisar perfis de redes sociais para extrair insights comportamentais que ajudem em estratégias de relacionamento comercial.

Analise os dados fornecidos e retorne insights nas seguintes categorias:
1. TRAÇOS DE PERSONALIDADE (Big Five inferido)
2. ESTILO DE COMUNICAÇÃO
3. INTERESSES E MOTIVAÇÕES
4. NÍVEL DE INFLUÊNCIA
5. INSIGHTS DE VENDAS

Responda APENAS com um JSON válido no formato especificado.`;

    const userPrompt = `Analise os seguintes perfis de redes sociais:

CONTATO: ${contact?.first_name} ${contact?.last_name}
CARGO: ${contact?.role || "Não informado"}

PERFIS SOCIAIS:
${JSON.stringify(profilesSummary, null, 2)}

Retorne um JSON com personality_traits, communication_style, interests, topics, keywords, hashtags, overall_sentiment, sentiment_score, influence_level, influence_score, active_hours, active_days, sales_insights, executive_summary.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
      if (response.status === 429) return jsonError("Rate limit exceeded. Please try again later.", 429);
      if (response.status === 402) return jsonError("Insufficient credits.", 402);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    // deno-lint-ignore no-explicit-any
    let analysis: any = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
    }

    if (!analysis) return jsonError("Failed to parse analysis results", 500);

    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from("social_behavior_analysis")
      .insert({
        contact_id: contactId, user_id: userId,
        personality_traits: analysis.personality_traits, communication_style: analysis.communication_style,
        interests: analysis.interests, topics: analysis.topics,
        overall_sentiment: analysis.overall_sentiment, sentiment_score: analysis.sentiment_score,
        active_hours: analysis.active_hours, active_days: analysis.active_days,
        influence_level: analysis.influence_level, influence_score: analysis.influence_score,
        keywords: analysis.keywords, hashtags: analysis.hashtags,
        sales_insights: analysis.sales_insights, executive_summary: analysis.executive_summary,
        confidence: 0.75,
      })
      .select().single();

    if (saveError) console.error("Error saving analysis:", saveError);

    return jsonOk({ success: true, analysis, savedId: savedAnalysis?.id });
  } catch (error) {
    console.error("social-behavior-analyzer error:", error);
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
