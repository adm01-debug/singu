// ==============================================
// DISC Analyzer Edge Function (HARDENED)
// ==============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

interface DISCScores { D: number; I: number; S: number; C: number }

interface AnalysisResult {
  scores: DISCScores;
  primaryProfile: string;
  secondaryProfile: string | null;
  blendProfile: string;
  confidence: number;
  stressPrimary: string | null;
  stressSecondary: string | null;
  behaviorIndicators: string[];
  salesStrategies: {
    opening: string[];
    presentation: string[];
    objectionHandling: string[];
    closing: string[];
  };
  communicationTips: string[];
  avoidBehaviors: string[];
  profileSummary: string;
}

const DISC_ANALYSIS_PROMPT = `Você é um especialista certificado em metodologia DISC com mais de 20 anos de experiência em análise comportamental.

Analise o seguinte texto e identifique o perfil DISC da pessoa que escreveu/falou, considerando:

## CARACTERÍSTICAS DOS PERFIS:

**D (Dominância)** - Foco em resultados
- Palavras-chave: agora, imediatamente, resultado, objetivo, decisão, controle, vencer
- Frases típicas: "vamos ao ponto", "qual o resultado?", "não temos tempo"
- Comunicação: direta, assertiva, impaciente, focada em resultados
- Sob pressão: mais autoritário, impositivo

**I (Influência)** - Foco em pessoas
- Palavras-chave: incrível, fantástico, juntos, equipe, celebrar, criativo, empolgante
- Frases típicas: "que legal!", "vamos fazer junto", "tenho uma ideia"
- Comunicação: entusiasta, otimista, expressiva, storytelling
- Sob pressão: mais disperso, emocional

**S (Estabilidade)** - Foco em segurança
- Palavras-chave: processo, calma, apoio, harmonia, tradicional, confiável
- Frases típicas: "sempre fizemos assim", "preciso pensar", "vamos com calma"
- Comunicação: paciente, acolhedora, metódica, evita conflitos
- Sob pressão: mais passivo, indeciso

**C (Conformidade)** - Foco em qualidade
- Palavras-chave: dados, análise, precisão, correto, documentação, padrão
- Frases típicas: "preciso analisar", "onde estão os dados?", "está correto?"
- Comunicação: precisa, detalhada, questionadora, cética
- Sob pressão: mais crítico, perfeccionista

## INSTRUÇÕES:
1. Analise tom, vocabulário, estrutura e conteúdo
2. Identifique padrões comportamentais
3. Atribua scores 0-100 para cada dimensão
4. Determine perfil primário e secundário
5. Identifique comportamento sob pressão
6. Forneça insights acionáveis para vendas

Retorne APENAS um JSON válido com a estrutura:
{
  "scores": { "D": 0-100, "I": 0-100, "S": 0-100, "C": 0-100 },
  "primaryProfile": "D|I|S|C",
  "secondaryProfile": "D|I|S|C|null",
  "blendProfile": "string (ex: DI, SC)",
  "confidence": 0-100,
  "stressPrimary": "D|I|S|C|null",
  "stressSecondary": "D|I|S|C|null",
  "behaviorIndicators": ["3-5 indicadores"],
  "salesStrategies": {
    "opening": ["2-3 estratégias"],
    "presentation": ["2-3 dicas"],
    "objectionHandling": ["2-3 técnicas"],
    "closing": ["2-3 técnicas"]
  },
  "communicationTips": ["3-5 dicas"],
  "avoidBehaviors": ["3-5 comportamentos a evitar"],
  "profileSummary": "Resumo de 2-3 frases"
}`;

function calculateBlendCode(D: number, I: number, S: number, C: number): {
  primary: string; secondary: string | null; blend: string;
} {
  const scores: [string, number][] = [["D", D], ["I", I], ["S", S], ["C", C]];
  scores.sort((a, b) => b[1] - a[1]);
  const primary = scores[0][0];
  const secondary = scores[1][1] >= 40 ? scores[1][0] : null;
  const blend = secondary ? `${primary}${secondary}` : primary;
  return { primary, secondary, blend };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Authenticate user — userId comes from JWT, NOT from payload
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // ID autenticado, ignora qualquer userId do body

  try {
    const { texts, contactId, interactionId } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return jsonError("Textos são obrigatórios", 400);
    }

    if (!contactId) {
      return jsonError("contactId é obrigatório", 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonError("LOVABLE_API_KEY não configurada", 500);
    }

    const combinedText = texts.join("\n\n---\n\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: DISC_ANALYSIS_PROMPT },
          { role: "user", content: `Analise o seguinte texto e determine o perfil DISC:\n\n${combinedText}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonError("Rate limit exceeded. Tente novamente em alguns segundos.", 429);
      }
      if (aiResponse.status === 402) {
        return jsonError("Créditos insuficientes. Adicione créditos ao workspace.", 402);
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content);
      analysisResult = {
        scores: { D: 50, I: 50, S: 50, C: 50 },
        primaryProfile: "I", secondaryProfile: null, blendProfile: "I",
        confidence: 40, stressPrimary: null, stressSecondary: null,
        behaviorIndicators: ["Análise parcial - texto insuficiente"],
        salesStrategies: {
          opening: ["Abordagem balanceada recomendada"],
          presentation: ["Combine dados com entusiasmo"],
          objectionHandling: ["Ouça atentamente as preocupações"],
          closing: ["Ofereça tempo para decisão"],
        },
        communicationTips: ["Adapte conforme feedback"],
        avoidBehaviors: ["Pressão excessiva"],
        profileSummary: "Perfil indefinido - necessita mais dados de interação",
      };
    }

    const { primary, secondary, blend } = calculateBlendCode(
      analysisResult.scores.D,
      analysisResult.scores.I,
      analysisResult.scores.S,
      analysisResult.scores.C
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🔒 Verify the contact belongs to the authenticated user
    const { data: contactCheck, error: contactCheckErr } = await supabase
      .from("contacts")
      .select("id, user_id")
      .eq("id", contactId)
      .maybeSingle();

    if (contactCheckErr || !contactCheck) {
      return jsonError("Contact not found", 404);
    }
    if (contactCheck.user_id !== userId) {
      return jsonError("Forbidden: contact does not belong to user", 403);
    }

    const { data: savedRecord, error: saveError } = await supabase
      .from("disc_analysis_history")
      .insert({
        user_id: userId,
        contact_id: contactId,
        interaction_id: interactionId || null,
        dominance_score: analysisResult.scores.D,
        influence_score: analysisResult.scores.I,
        steadiness_score: analysisResult.scores.S,
        conscientiousness_score: analysisResult.scores.C,
        primary_profile: primary,
        secondary_profile: secondary,
        blend_profile: blend,
        stress_primary: analysisResult.stressPrimary,
        stress_secondary: analysisResult.stressSecondary,
        confidence: analysisResult.confidence,
        analysis_source: "ai_analysis",
        detected_keywords: [],
        detected_phrases: [],
        behavior_indicators: analysisResult.behaviorIndicators,
        analyzed_text: combinedText.slice(0, 5000),
        profile_summary: analysisResult.profileSummary,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error(`Database save error: ${saveError.message}`);
    }

    const { data: contactData } = await supabase
      .from("contacts")
      .select("behavior")
      .eq("id", contactId)
      .maybeSingle();

    const currentBehavior = (contactData?.behavior as Record<string, unknown>) || {};
    await supabase
      .from("contacts")
      .update({
        behavior: {
          ...currentBehavior,
          discProfile: primary,
          discConfidence: analysisResult.confidence,
          discBlend: blend,
          discLastAnalysis: new Date().toISOString(),
        },
      })
      .eq("id", contactId);

    await supabase.from("disc_communication_logs").insert({
      user_id: userId,
      contact_id: contactId,
      contact_disc_profile: primary,
      approach_adapted: false,
      adaptation_tips_shown: analysisResult.salesStrategies,
    });

    return jsonOk({
      success: true,
      analysis: {
        id: savedRecord.id,
        scores: analysisResult.scores,
        primaryProfile: primary,
        secondaryProfile: secondary,
        blendProfile: blend,
        confidence: analysisResult.confidence,
        stressPrimary: analysisResult.stressPrimary,
        stressSecondary: analysisResult.stressSecondary,
        behaviorIndicators: analysisResult.behaviorIndicators,
        salesStrategies: analysisResult.salesStrategies,
        communicationTips: analysisResult.communicationTips,
        avoidBehaviors: analysisResult.avoidBehaviors,
        profileSummary: analysisResult.profileSummary,
      },
    });
  } catch (error) {
    console.error("DISC analyzer error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500);
  }
});
