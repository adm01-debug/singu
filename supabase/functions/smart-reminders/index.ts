import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, corsHeaders } from "../_shared/auth.ts";

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

  // 🔒 Dual auth: user JWT or service-role
  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  let userId: string;
  if (isServiceRoleCaller(authResult)) {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty */ }
    if (!body.userId || typeof body.userId !== 'string') return jsonError('userId required for service-role calls', 400);
    userId = body.userId;
  } else {
    userId = authResult;
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();

    const reminders: SmartReminder[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get Follow-ups for today and upcoming (next 3 days)
    const followUpEndDate = new Date(today);
    followUpEndDate.setDate(followUpEndDate.getDate() + 3);

    const { data: followUps, error: followUpError } = await supabaseClient
      .from('interactions')
      .select(`
        id, title, content, follow_up_date, contact_id,
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
      for (const followUp of followUps) {
        const contactData = followUp.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] : contactData;
        const contactName = contact ? `${(contact as Record<string, string>).first_name} ${(contact as Record<string, string>).last_name}` : 'Contato';
        
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
          metadata: { interactionId: followUp.id, content: followUp.content }
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
      for (const contact of contacts) {
        if (!contact.birthday) continue;
        const birthday = new Date(contact.birthday);
        const birthMonth = birthday.getMonth() + 1;
        const birthDay = birthday.getDate();
        
        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + i);
          if (birthday.getMonth() === checkDate.getMonth() && birthDay === checkDate.getDate()) {
            const contactName = `${contact.first_name} ${contact.last_name}`;
            reminders.push({
              id: `birthday-${contact.id}`,
              type: 'birthday',
              priority: i <= 1 ? 'high' : 'medium',
              title: i === 0 ? `🎂 Aniversário Hoje: ${contactName}` :
                     i === 1 ? `🎂 Aniversário Amanhã: ${contactName}` :
                     `🎂 Aniversário em ${i} dias: ${contactName}`,
              description: i === 0 ? 'Não esqueça de enviar uma mensagem de parabéns!' :
                `Prepare-se para parabenizar ${contact.first_name}!`,
              contactId: contact.id,
              contactName,
              dueDate: checkDate.toISOString().split('T')[0],
              metadata: { daysUntil: i, relationshipScore: contact.relationship_score }
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

    if (!allContactsError && allContacts) {
      for (const contact of allContacts) {
        const { data: lastInteraction } = await supabaseClient
          .from('interactions')
          .select('created_at')
          .eq('contact_id', contact.id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastInteraction) {
          const lastInteractionDate = new Date(lastInteraction.created_at);
          const daysSinceLastInteraction = Math.floor(
            (today.getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const relationshipScore = contact.relationship_score || 50;
          const decayThreshold = relationshipScore >= 70 ? 14 : relationshipScore >= 50 ? 21 : 30;

          type DecayLevel = 'warming' | 'cooling' | 'cold' | 'frozen';
          let decayLevel: DecayLevel = 'warming';
          let priority: SmartReminder['priority'] = 'low';
          let shouldAlert = false;

          if (daysSinceLastInteraction >= decayThreshold * 2) {
            decayLevel = 'frozen'; priority = 'high'; shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold * 1.5) {
            decayLevel = 'cold'; priority = 'high'; shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold) {
            decayLevel = 'cooling'; priority = 'medium'; shouldAlert = true;
          } else if (daysSinceLastInteraction >= decayThreshold * 0.75 && relationshipScore >= 70) {
            decayLevel = 'warming'; shouldAlert = true;
          }

          if (shouldAlert) {
            const contactName = `${contact.first_name} ${contact.last_name}`;
            const emojiMap: Record<DecayLevel, string> = { frozen: '🥶', cold: '❄️', cooling: '🌡️', warming: '💛' };
            const descMap: Record<DecayLevel, string> = {
              frozen: `Reconecte-se urgentemente! ${daysSinceLastInteraction} dias sem contato.`,
              cold: `Relacionamento esfriando. Última interação há ${daysSinceLastInteraction} dias.`,
              cooling: `Considere fazer um check-in. ${daysSinceLastInteraction} dias desde o último contato.`,
              warming: `Mantenha o momentum. ${daysSinceLastInteraction} dias desde a última interação.`,
            };

            reminders.push({
              id: `decay-${contact.id}`, type: 'decay', priority,
              title: `${emojiMap[decayLevel]} Relacionamento Esfriando: ${contactName}`,
              description: descMap[decayLevel],
              contactId: contact.id, contactName, dueDate: null,
              metadata: { daysSinceLastInteraction, decayLevel, relationshipScore, relationshipStage: contact.relationship_stage }
            });
          }
        }
      }
    }

    // 4. Milestones
    const { data: recentInteractions, error: recentError } = await supabaseClient
      .from('interactions')
      .select(`id, title, type, contact_id, created_at, contacts:contact_id (id, first_name, last_name, relationship_score)`)
      .eq('user_id', userId)
      .gte('created_at', new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (!recentError && recentInteractions) {
      const interactionCounts = new Map<string, number>();
      for (const interaction of recentInteractions) {
        interactionCounts.set(interaction.contact_id, (interactionCounts.get(interaction.contact_id) || 0) + 1);
      }
      for (const [contactId, count] of interactionCounts) {
        if (count >= 10) {
          const contact = recentInteractions.find(i => i.contact_id === contactId)?.contacts;
          const contactData = Array.isArray(contact) ? contact[0] : contact;
          if (contactData) {
            const cd = contactData as Record<string, unknown>;
            reminders.push({
              id: `milestone-${contactId}`, type: 'milestone', priority: 'low',
              title: `🌟 Relacionamento Forte: ${cd.first_name} ${cd.last_name}`,
              description: `${count} interações nos últimos 30 dias. Continue assim!`,
              contactId, contactName: `${cd.first_name} ${cd.last_name}`, dueDate: null,
              metadata: { interactionCount: count, relationshipScore: cd.relationship_score }
            });
          }
        }
      }
    }

    // Sort
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reminders.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

    // AI insights for decay
    const decayReminders = reminders.filter(r => r.type === 'decay');
    let aiInsights = null;

    if (action === 'analyze' && decayReminders.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const prompt = `Analise estes relacionamentos que estão esfriando e sugira ações específicas:\n\n${decayReminders.slice(0, 5).map(r => `- ${r.contactName}: ${r.description}\n  - Score: ${r.metadata.relationshipScore}\n  - Dias sem contato: ${r.metadata.daysSinceLastInteraction}`).join('\n')}`;
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'Você é um especialista em gestão de relacionamentos profissionais. Forneça insights práticos e acionáveis.' },
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

    return jsonOk({ success: true, reminders, summary, aiInsights });

  } catch (error: unknown) {
    console.error('Smart Reminders Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});