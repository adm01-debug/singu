import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactProfile {
  firstName: string;
  lastName: string;
  roleTitle?: string;
  companyName?: string;
  discProfile?: 'D' | 'I' | 'S' | 'C' | null;
  discNotes?: string;
  preferredChannel?: string;
  messageStyle?: string;
  formalityLevel?: number;
  primaryMotivation?: string;
  primaryFear?: string;
  communicationStyle?: string;
  hobbies?: string[];
  interests?: string[];
}

interface InteractionSummary {
  type: string;
  sentiment: string;
  content?: string;
  createdAt: string;
}

interface RequestPayload {
  contact: ContactProfile;
  recentInteractions: InteractionSummary[];
  messageType: 'follow_up' | 'introduction' | 'proposal' | 'check_in' | 'thank_you' | 'meeting_request' | 'custom';
  customContext?: string;
  tone?: 'formal' | 'casual' | 'friendly';
}

const DISC_COMMUNICATION_STYLES = {
  D: {
    name: "Dominante",
    approach: "Seja direto, objetivo e focado em resultados. Evite detalhes desnecessários. Vá direto ao ponto e mostre valor imediatamente.",
    avoid: "Não seja prolixo, não use linguagem emocional excessiva, não perca tempo com conversa fiada.",
    tone: "Confiante, assertivo, orientado a resultados",
    messageLength: "Curtas e diretas",
  },
  I: {
    name: "Influente", 
    approach: "Seja entusiasta, amigável e pessoal. Use linguagem positiva e mostre interesse genuíno na pessoa. Inclua elementos sociais.",
    avoid: "Não seja muito formal ou frio, não foque apenas em dados e números.",
    tone: "Caloroso, otimista, inspirador",
    messageLength: "Médias com toque pessoal",
  },
  S: {
    name: "Estável",
    approach: "Seja gentil, paciente e tranquilizador. Construa confiança gradualmente. Mostre que você é confiável e previsível.",
    avoid: "Não seja agressivo ou pressione para decisões rápidas. Não mude de assunto abruptamente.",
    tone: "Calmo, acolhedor, sincero",
    messageLength: "Médias com contexto",
  },
  C: {
    name: "Conforme",
    approach: "Seja preciso, detalhado e lógico. Forneça dados e evidências. Seja organizado e estruturado na comunicação.",
    avoid: "Não seja vago ou impreciso. Não use exageros ou promessas sem fundamento.",
    tone: "Profissional, analítico, preciso",
    messageLength: "Detalhadas e bem estruturadas",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contact, recentInteractions, messageType, customContext, tone }: RequestPayload = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build DISC-aware system prompt
    const discStyle = contact.discProfile ? DISC_COMMUNICATION_STYLES[contact.discProfile] : null;
    
    // Build interaction history context
    const interactionContext = recentInteractions.length > 0 
      ? recentInteractions.slice(0, 5).map(i => 
          `- ${i.type} (${i.sentiment}): ${i.content?.substring(0, 100) || 'Sem conteúdo'}...`
        ).join('\n')
      : 'Sem interações recentes registradas.';

    // Build personal context
    const personalContext = [];
    if (contact.hobbies?.length) personalContext.push(`Hobbies: ${contact.hobbies.join(', ')}`);
    if (contact.interests?.length) personalContext.push(`Interesses: ${contact.interests.join(', ')}`);
    if (contact.primaryMotivation) personalContext.push(`Motivação principal: ${contact.primaryMotivation}`);
    if (contact.primaryFear) personalContext.push(`Preocupação/Medo: ${contact.primaryFear}`);

    const systemPrompt = `Você é um assistente especializado em comunicação empresarial e relacionamento com clientes.
Sua função é gerar sugestões de mensagens personalizadas para o usuário enviar ao seu contato.

## Informações do Contato:
- Nome: ${contact.firstName} ${contact.lastName}
- Cargo: ${contact.roleTitle || 'Não especificado'}
- Empresa: ${contact.companyName || 'Não especificada'}
${discStyle ? `
## Perfil DISC: ${discStyle.name}
- Abordagem recomendada: ${discStyle.approach}
- O que evitar: ${discStyle.avoid}
- Tom ideal: ${discStyle.tone}
- Tamanho de mensagem: ${discStyle.messageLength}
${contact.discNotes ? `- Notas adicionais: ${contact.discNotes}` : ''}
` : ''}
## Canal Preferido: ${contact.preferredChannel || 'WhatsApp'}
## Nível de Formalidade: ${contact.formalityLevel || 3}/5 (1=muito informal, 5=muito formal)
${personalContext.length > 0 ? `
## Contexto Pessoal:
${personalContext.join('\n')}
` : ''}
## Histórico de Interações Recentes:
${interactionContext}

## Regras para geração de mensagens:
1. SEMPRE gere 3 variações de mensagem para o usuário escolher
2. Adapte o tom e estilo ao perfil DISC do contato
3. Considere o histórico de interações para contextualizar
4. Seja natural e autêntico, evite linguagem robótica
5. Inclua personalização baseada nos interesses quando apropriado
6. A mensagem deve parecer escrita por um humano, não por IA
7. Escreva em português brasileiro
8. Formato esperado de resposta: JSON com array de sugestões`;

    const userPrompt = buildUserPrompt(messageType, customContext, tone, contact);

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
              name: "generate_message_suggestions",
              description: "Gera 3 sugestões de mensagens personalizadas para o contato",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "ID único da sugestão (1, 2, ou 3)" },
                        label: { type: "string", description: "Rótulo curto da sugestão (ex: 'Direto', 'Amigável', 'Formal')" },
                        message: { type: "string", description: "O texto completo da mensagem sugerida" },
                        reasoning: { type: "string", description: "Breve explicação de por que esta abordagem é recomendada para este perfil" },
                      },
                      required: ["id", "label", "message", "reasoning"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 dicas rápidas para melhorar a comunicação com este perfil",
                  },
                },
                required: ["suggestions", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_message_suggestions" } },
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response received");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Writing Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar sugestões" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildUserPrompt(
  messageType: RequestPayload['messageType'],
  customContext: string | undefined,
  tone: string | undefined,
  contact: ContactProfile
): string {
  const typeDescriptions: Record<string, string> = {
    follow_up: "uma mensagem de follow-up para retomar o contato ou dar continuidade a uma conversa anterior",
    introduction: "uma mensagem de apresentação inicial para estabelecer primeiro contato",
    proposal: "uma mensagem apresentando uma proposta comercial ou sugestão de colaboração",
    check_in: "uma mensagem casual para verificar como a pessoa está e manter o relacionamento",
    thank_you: "uma mensagem de agradecimento sincero",
    meeting_request: "uma mensagem solicitando uma reunião ou call",
    custom: customContext || "uma mensagem personalizada",
  };

  const toneDescription = tone === 'formal' 
    ? 'Use um tom mais formal e profissional.'
    : tone === 'casual' 
    ? 'Use um tom mais descontraído e casual.'
    : 'Use um tom amigável mas profissional.';

  return `Gere 3 sugestões de mensagem para ${contact.firstName}.

Tipo de mensagem: ${typeDescriptions[messageType]}

${customContext ? `Contexto adicional fornecido pelo usuário: ${customContext}` : ''}

Tom desejado: ${toneDescription}

Lembre-se:
- Adapte ao perfil DISC e preferências do contato
- Seja autêntico e natural
- Considere o histórico de interações
- Cada sugestão deve ter uma abordagem ligeiramente diferente`;
}
