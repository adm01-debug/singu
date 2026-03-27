import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertData {
  type: 'birthday' | 'renewal' | 'at_risk' | 'health_alert' | 'life_event';
  title: string;
  body: string;
  url?: string;
  contactId?: string;
  userId: string;
}

async function sendPushToUser(supabase: any, userId: string, alert: AlertData) {
  // Get user's push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (subError || !subscriptions?.length) {
    console.log(`No push subscriptions for user ${userId}`);
    return { sent: 0 };
  }

  let sentCount = 0;

  for (const sub of subscriptions) {
    try {
      // Web Push API call
      const pushData = {
        title: alert.title,
        body: alert.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `${alert.type}-${alert.contactId || 'general'}`,
        data: {
          url: alert.url || '/',
          type: alert.type,
          contactId: alert.contactId,
        },
      };

      // Note: In production, you'd use web-push library with VAPID keys
      // For now, we store the notification for client-side fetching
      await supabase.from('alerts').insert({
        user_id: userId,
        title: alert.title,
        description: alert.body,
        type: alert.type,
        contact_id: alert.contactId || null,
        action_url: alert.url || null,
        priority: alert.type === 'at_risk' || alert.type === 'health_alert' ? 'high' : 'medium',
      });

      sentCount++;
    } catch (error) {
      console.error(`Error sending push to subscription:`, error);
    }
  }

  return { sent: sentCount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateCheck = checkRateLimit(`client-notifications:${clientIP}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rateCheck.allowed) {
    return rateLimitResponse(corsHeaders, rateCheck.resetAt);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for notification triggers...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all users with their profiles
    const { data: profiles } = await supabase.from('profiles').select('id, first_name');

    const alertsSent: AlertData[] = [];

    for (const profile of profiles || []) {
      const userId = profile.id;

      // 1. Check for birthdays today and in next 7 days
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, birthday, relationship_score')
        .eq('user_id', userId)
        .not('birthday', 'is', null);

      for (const contact of contacts || []) {
        if (!contact.birthday) continue;

        const birthday = new Date(contact.birthday);
        const thisYearBday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
          const alert: AlertData = {
            type: 'birthday',
            title: `🎂 Aniversário Hoje!`,
            body: `${contact.first_name} ${contact.last_name} faz aniversário hoje!`,
            url: `/contatos/${contact.id}`,
            contactId: contact.id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert);
          alertsSent.push(alert);
        } else if (daysUntil === 7) {
          const alert: AlertData = {
            type: 'birthday',
            title: `🎂 Aniversário em 7 dias`,
            body: `${contact.first_name} ${contact.last_name} fará aniversário em uma semana`,
            url: `/contatos/${contact.id}`,
            contactId: contact.id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert);
          alertsSent.push(alert);
        }
      }

      // 2. Check for upcoming renewals
      const { data: renewals } = await supabase
        .from('purchase_history')
        .select(`
          id, product_name, renewal_date, contact_id,
          contacts!inner (first_name, last_name)
        `)
        .eq('user_id', userId)
        .not('renewal_date', 'is', null)
        .gte('renewal_date', today.toISOString())
        .lte('renewal_date', sevenDaysFromNow.toISOString());

      for (const renewal of renewals || []) {
        const contact = renewal.contacts as any;
        const renewalDate = new Date(renewal.renewal_date!);
        const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 7) {
          const alert: AlertData = {
            type: 'renewal',
            title: `🔄 Renovação em ${daysUntil} dia(s)`,
            body: `${renewal.product_name} de ${contact.first_name} ${contact.last_name}`,
            url: `/contatos/${renewal.contact_id}`,
            contactId: renewal.contact_id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert);
          alertsSent.push(alert);
        }
      }

      // 3. Check for at-risk contacts (no contact in 30+ days, high score)
      const { data: recentInteractions } = await supabase
        .from('interactions')
        .select('contact_id')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const recentContactIds = new Set((recentInteractions || []).map(i => i.contact_id));

      const { data: highValueContacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, relationship_score')
        .eq('user_id', userId)
        .gte('relationship_score', 60);

      for (const contact of highValueContacts || []) {
        if (!recentContactIds.has(contact.id)) {
          // Check if we already sent an at-risk alert recently
          const { data: recentAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('contact_id', contact.id)
            .eq('type', 'at_risk')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!recentAlert?.length) {
            const alert: AlertData = {
              type: 'at_risk',
              title: `⚠️ Cliente em Risco`,
              body: `${contact.first_name} ${contact.last_name} está há mais de 30 dias sem contato`,
              url: `/contatos/${contact.id}`,
              contactId: contact.id,
              userId,
            };
            await sendPushToUser(supabase, userId, alert);
            alertsSent.push(alert);
          }
        }
      }

      // 4. Check for upcoming life events
      const { data: lifeEvents } = await supabase
        .from('life_events')
        .select(`
          id, title, event_date, event_type, reminder_days_before, last_reminded_at, contact_id,
          contacts!inner (first_name, last_name)
        `)
        .eq('user_id', userId)
        .gte('event_date', today.toISOString())
        .lte('event_date', sevenDaysFromNow.toISOString());

      for (const event of lifeEvents || []) {
        const contact = event.contacts as any;
        const eventDate = new Date(event.event_date);
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDays = event.reminder_days_before || 7;

        // Check if we should remind
        if (daysUntil <= reminderDays) {
          // Check if already reminded recently
          if (event.last_reminded_at) {
            const lastReminded = new Date(event.last_reminded_at);
            const daysSinceReminder = (today.getTime() - lastReminded.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceReminder < 1) continue; // Already reminded today
          }

          const alert: AlertData = {
            type: 'life_event',
            title: daysUntil === 0 ? `📅 Evento Hoje!` : `📅 Evento em ${daysUntil} dia(s)`,
            body: `${event.title} - ${contact.first_name} ${contact.last_name}`,
            url: `/contatos/${event.contact_id}`,
            contactId: event.contact_id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert);
          alertsSent.push(alert);

          // Update last_reminded_at
          await supabase
            .from('life_events')
            .update({ last_reminded_at: now.toISOString() })
            .eq('id', event.id);
        }
      }
    }

    console.log(`Sent ${alertsSent.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: alertsSent.length,
        notifications: alertsSent.map(a => ({ type: a.type, title: a.title }))
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error checking notifications:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
