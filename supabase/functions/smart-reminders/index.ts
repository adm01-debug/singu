import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelationshipDecay {
  contactId: string;
  contactName: string;
  daysSinceLastInteraction: number;
  relationshipScore: number;
  decayLevel: 'warming' | 'cooling' | 'cold' | 'frozen';
  suggestedAction: string;
}

interface SmartReminder {
  id: string;
  type: 'follow_up' | 'birthday' | 'decay' | 'milestone';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  dueDate: string | null;
  metadata: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId } = await req.json();
    console.log(`Smart Reminders - Action: ${action}, User: ${userId}`);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reminders: SmartReminder[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get Follow-ups for today and upcoming (next 3 days)
    const followUpEndDate = new Date(today);
    followUpEndDate.setDate(followUpEndDate.getDate() + 3);

    const { data: followUps, error: followUpError } = await supabaseClient
      .from('interactions')
      .select(`
        id,
        title,
        content,
        follow_up_date,
        contact_id,
        contacts:contact_id (id, first_name, last_name)
      `)
      .eq('user_id', userId)
      .eq('follow_up_required', true)
      .gte('follow_up_date', today.toISOString().split('T')[0])
      .lte('follow_up_date', followUpEndDate.toISOString().split('T')[0])
      .order('follow_up_date', { ascending: true });

    if (followUpError) {
      console.error('Error fetching follow-ups:', followUpError);
    } else if (followUps) {
      console.log(`Found ${followUps.length} follow-ups`);
      
      for (const followUp of followUps) {
        const contactData = followUp.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] : contactData;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Contato';
        
        const followUpDate = new Date(followUp.follow_up_date);
        const isToday = followUpDate.toDateString() === today.toDateString();
        const isTomorrow = followUpDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();

        reminders.push({
          id: `followup-${followUp.id}`,
          type: 'follow_up',
          priority: isToday ? 'high' : (isTomorrow ? 'medium' : 'low'),
          title: isToday ? `📅 Follow-up Hoje: ${followUp.title}` : 
                 isTomorrow ? `📅 Follow-up Amanhã: ${followUp.title}` :
                 `📅 Follow-up Próximo: ${followUp.title}`,
          description: `Acompanhamento agendado com ${contactName}`,
          contactId: followUp.contact_id,
          contactName,
          dueDate: followUp.follow_up_date,
          metadata: {
            interactionId: followUp.id,
            content: followUp.content
          }
        });
      }
    }

    // 2. Get Birthdays (today and next 7 days)
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, first_name, last_name, birthday, relationship_score')
      .eq('user_id', userId)
      .not('birthday', 'is', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    } else if (contacts) {
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      for (const contact of contacts) {
        if (!contact.birthday) continue;
        
        const birthday = new Date(contact.birthday);
        const birthMonth = birthday.getMonth() + 1;
        const birthDay = birthday.getDate();
        
        // Check if birthday is within the next 7 days
        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + i);
          const checkMonth = checkDate.getMonth() + 1;
          const checkDay = checkDate.getDate();
          
          if (birthMonth === checkMonth && birthDay === checkDay) {
            const isToday = i === 0;
            const isTomorrow = i === 1;
            const contactName = `${contact.first_name} ${contact.last_name}`;
            
            reminders.push({
              id: `birthday-${contact.id}`,
              type: 'birthday',
              priority: isToday ? 'high' : (isTomorrow ? 'high' : 'medium'),
              title: isToday ? `🎂 Aniversário Hoje: ${contactName}` :
                     isTomorrow ? `🎂 Aniversário Amanhã: ${contactName}` :
                     `🎂 Aniversário em ${i} dias: ${contactName}`,
              description: isToday ? 
                'Não esqueça de enviar uma mensagem de parabéns!' :
                `Prepare-se para parabenizar ${contact.first_name}!`,
              contactId: contact.id,
              contactName,
              dueDate: checkDate.toISOString().split('T')[0],
              metadata: {
                daysUntil: i,
                relationshipScore: contact.relationship_score
              }
            });
            break;
          }
        }
      }
    }

    // 3. Detect Relationship Decay
    const { data: allContacts, error: allContactsError } = await supabaseClient
      .from('contacts')
      .select('id, first_name, last_name, relationship_score, relationship_stage')
      .eq('user_id', userId);

    if (allContactsError) {
      console.error('Error fetching all contacts:', allContactsError);
    } else if (allContacts) {
      // Get last interaction for each contact
      for (const contact of allContacts) {
        const { data: lastInteraction } = await supabaseClient
          .from('interactions')
          .select('created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastInteraction) {
          const lastInteractionDate = new Date(lastInteraction.created_at);
          const daysSinceLastInteraction = Math.floor(
            (today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Determine decay level based on days and relationship stage
          let decayLevel: RelationshipDecay['decayLevel'] = 'warming';
          let priority: SmartReminder['priority'] = 'low';
          let shouldAlert = false;

          const contactName = `${contact.first_name} ${contact.last_name}`;
          const relationshipScore = contact.relationship_score || 50;

          // More important relationships decay faster
          const decayThreshold = relationshipScore >= 70 ? 14 : 
                                 relationshipScore >= 50 ? 21 : 30;

          if (daysSinceLastInteraction >= decayThreshold * 2) {
            decayLevel = 'frozen';
            priority = 'high';
            shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold * 1.5) {
            decayLevel = 'cold';
            priority = 'high';
            shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold) {
            decayLevel = 'cooling';
            priority = 'medium';
            shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold * 0.75) {
            decayLevel = 'warming';
            priority = 'low';
            // Only alert for high-value relationships
            if (relationshipScore >= 70) {
              shouldAlert = true;
            }
          }

          if (shouldAlert) {
            let suggestedAction = '';
            let emoji = '';
            
            switch (decayLevel) {
              case 'frozen':
                emoji = '🥶';
                suggestedAction = `Reconecte-se urgentemente! ${daysSinceLastInteraction} dias sem contato.`;
                break;
              case 'cold':
                emoji = '❄️';
                suggestedAction = `Relacionamento esfriando. Última interação há ${daysSinceLastInteraction} dias.`;
                break;
              case 'cooling':
                emoji = '🌡️';
                suggestedAction = `Considere fazer um check-in. ${daysSinceLastInteraction} dias desde o último contato.`;
                break;
              case 'warming':
                emoji = '💛';
                suggestedAction = `Mantenha o momentum. ${daysSinceLastInteraction} dias desde a última interação.`;
                break;
            }

            reminders.push({
              id: `decay-${contact.id}`,
              type: 'decay',
              priority,
              title: `${emoji} Relacionamento Esfriando: ${contactName}`,
              description: suggestedAction,
              contactId: contact.id,
              contactName,
              dueDate: null,
              metadata: {
                daysSinceLastInteraction,
                decayLevel,
                relationshipScore,
                relationshipStage: contact.relationship_stage
              }
            });
          }
        }
      }
    }

    // 4. Check for relationship milestones
    const { data: recentInteractions, error: recentError } = await supabaseClient
      .from('interactions')
      .select(`
        id,
        title,
        type,
        contact_id,
        created_at,
        contacts:contact_id (id, first_name, last_name, relationship_score)
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (!recentError && recentInteractions) {
      // Count interactions per contact
      const interactionCounts = new Map<string, number>();
      
      for (const interaction of recentInteractions) {
        const count = interactionCounts.get(interaction.contact_id) || 0;
        interactionCounts.set(interaction.contact_id, count + 1);
      }

      // Find contacts with significant engagement
      for (const [contactId, count] of interactionCounts) {
        if (count >= 10) {
          const contact = recentInteractions.find(i => i.contact_id === contactId)?.contacts;
          if (contact) {
            const contactData = Array.isArray(contact) ? contact[0] : contact;
            if (contactData) {
              reminders.push({
                id: `milestone-${contactId}`,
                type: 'milestone',
                priority: 'low',
                title: `🌟 Relacionamento Forte: ${contactData.first_name} ${contactData.last_name}`,
                description: `${count} interações nos últimos 30 dias. Continue assim!`,
                contactId,
                contactName: `${contactData.first_name} ${contactData.last_name}`,
                dueDate: null,
                metadata: {
                  interactionCount: count,
                  relationshipScore: contactData.relationship_score
                }
              });
            }
          }
        }
      }
    }

    // Sort reminders by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reminders.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    // Generate AI insights if there are decay alerts
    const decayReminders = reminders.filter(r => r.type === 'decay');
    let aiInsights = null;

    if (action === 'analyze' && decayReminders.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        try {
          const prompt = `Analise estes relacionamentos que estão esfriando e sugira ações específicas para reconectá-los:

${decayReminders.slice(0, 5).map(r => `
- ${r.contactName}: ${r.description}
  - Score: ${r.metadata.relationshipScore}
  - Dias sem contato: ${r.metadata.daysSinceLastInteraction}
`).join('\n')}

Forneça sugestões práticas e personalizadas para cada contato, considerando o tempo desde a última interação e a importância do relacionamento.`;

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'Você é um especialista em gestão de relacionamentos profissionais. Forneça insights práticos e acionáveis.'
                },
                { role: 'user', content: prompt }
              ],
              max_tokens: 500
            }),
          });

          if (response.ok) {
            const data = await response.json();
            aiInsights = data.choices?.[0]?.message?.content;
          }
        } catch (error) {
          console.error('Error getting AI insights:', error);
        }
      }
    }

    // Calculate summary stats
    const summary = {
      total: reminders.length,
      byType: {
        follow_up: reminders.filter(r => r.type === 'follow_up').length,
        birthday: reminders.filter(r => r.type === 'birthday').length,
        decay: reminders.filter(r => r.type === 'decay').length,
        milestone: reminders.filter(r => r.type === 'milestone').length
      },
      byPriority: {
        high: reminders.filter(r => r.priority === 'high').length,
        medium: reminders.filter(r => r.priority === 'medium').length,
        low: reminders.filter(r => r.priority === 'low').length
      }
    };

    console.log(`Smart Reminders completed. Total: ${summary.total}`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders,
        summary,
        aiInsights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Smart Reminders Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});