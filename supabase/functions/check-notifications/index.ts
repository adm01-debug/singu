import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, requireCronSecret, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Cron secret validation
  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const notifications: Array<{
      userId: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
      tag: string;
    }> = [];

    // Check for today's follow-ups
    const { data: followUps, error: followUpError } = await supabaseClient
      .from('interactions')
      .select(`
        id,
        title,
        follow_up_date,
        contact_id,
        user_id,
        contacts:contact_id (first_name, last_name)
      `)
      .eq('follow_up_required', true)
      .eq('follow_up_date', todayStr);

    if (followUpError) {
      console.error('Error fetching follow-ups:', followUpError);
    } else if (followUps) {
      for (const followUp of followUps) {
        const contactData = followUp.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] as { first_name: string; last_name: string } | undefined : contactData as { first_name: string; last_name: string } | null;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Contato';
        
        notifications.push({
          userId: followUp.user_id,
          title: `📅 Follow-up: ${followUp.title}`,
          body: `Lembrete de acompanhamento com ${contactName}`,
          data: {
            type: 'followup',
            interactionId: followUp.id,
            contactId: followUp.contact_id
          },
          tag: `followup-${followUp.id}`
        });
      }
    }

    // Check for birthdays today
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, first_name, last_name, birthday, user_id')
      .not('birthday', 'is', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    } else if (contacts) {
      for (const contact of contacts) {
        if (!contact.birthday) continue;
        
        const birthday = new Date(contact.birthday);
        const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
        const birthDay = String(birthday.getDate()).padStart(2, '0');
        
        if (birthMonth === month && birthDay === day) {
          notifications.push({
            userId: contact.user_id,
            title: `🎂 Aniversário: ${contact.first_name} ${contact.last_name}`,
            body: 'Não esqueça de enviar uma mensagem de parabéns!',
            data: {
              type: 'birthday',
              contactId: contact.id
            },
            tag: `birthday-${contact.id}`
          });
        }
      }
    }

    // Check for new insights (from last 24 hours)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: insights, error: insightsError } = await supabaseClient
      .from('insights')
      .select(`
        id,
        title,
        contact_id,
        user_id,
        contacts:contact_id (first_name, last_name)
      `)
      .eq('dismissed', false)
      .gte('created_at', yesterday.toISOString());

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
    } else if (insights) {
      for (const insight of insights) {
        const contactData = insight.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] as { first_name: string; last_name: string } | undefined : contactData as { first_name: string; last_name: string } | null;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Contato';
        
        notifications.push({
          userId: insight.user_id,
          title: `💡 Novo Insight: ${insight.title}`,
          body: `Insight sobre ${contactName}`,
          data: {
            type: 'insight',
            insightId: insight.id,
            contactId: insight.contact_id
          },
          tag: `insight-${insight.id}`
        });
      }
    }

    // Send notifications
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    let sentCount = 0;
    
    for (const notification of notifications) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            userId: notification.userId,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            tag: notification.tag
          })
        });
        
        if (response.ok) {
          sentCount++;
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: {
          followUps: followUps?.length || 0,
          birthdays: contacts?.filter(c => {
            if (!c.birthday) return false;
            const birthday = new Date(c.birthday);
            const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
            const birthDay = String(birthday.getDate()).padStart(2, '0');
            return birthMonth === month && birthDay === day;
          }).length || 0,
          insights: insights?.length || 0
        },
        notificationsSent: sentCount,
        totalNotifications: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
