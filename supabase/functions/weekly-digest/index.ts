import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklyDigestData {
  userId: string;
  email: string;
  firstName: string;
  stats: {
    totalInteractions: number;
    newContacts: number;
    upcomingBirthdays: number;
    atRiskContacts: number;
    pendingFollowUps: number;
  };
  highlights: string[];
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting weekly digest generation...');

    // Get all users with profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users`);

    const digests: WeeklyDigestData[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const profile of profiles || []) {
      // Get user's email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      
      if (!userData?.user?.email) continue;

      // Get interactions from last week
      const { data: interactions } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', oneWeekAgo.toISOString());

      // Get new contacts from last week
      const { data: newContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', oneWeekAgo.toISOString());

      // Get all contacts for analysis
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', profile.id);

      // Check for upcoming birthdays (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingBirthdays = (allContacts || []).filter(contact => {
        if (!contact.birthday) return false;
        const birthday = new Date(contact.birthday);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthday.getMonth(),
          birthday.getDate()
        );
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      });

      // Get pending follow-ups
      const { data: pendingFollowUps } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('follow_up_required', true)
        .lte('follow_up_date', new Date().toISOString());

      // Calculate at-risk contacts (no interaction in 30+ days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentInteractions } = await supabase
        .from('interactions')
        .select('contact_id')
        .eq('user_id', profile.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const contactsWithRecentInteraction = new Set(
        recentInteractions?.map(i => i.contact_id) || []
      );
      
      const atRiskContacts = (allContacts || []).filter(
        c => !contactsWithRecentInteraction.has(c.id)
      );

      // Generate highlights
      const highlights: string[] = [];
      if ((interactions?.length || 0) > 10) {
        highlights.push(`Semana produtiva! Você teve ${interactions?.length} interações.`);
      }
      if ((newContacts?.length || 0) > 0) {
        highlights.push(`${newContacts?.length} novo(s) contato(s) adicionado(s).`);
      }
      if (upcomingBirthdays.length > 0) {
        highlights.push(`${upcomingBirthdays.length} aniversário(s) esta semana.`);
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (atRiskContacts.length > 5) {
        recommendations.push(`Atenção: ${atRiskContacts.length} contatos sem interação há mais de 30 dias.`);
      }
      if ((pendingFollowUps?.length || 0) > 0) {
        recommendations.push(`Você tem ${pendingFollowUps?.length} follow-up(s) pendente(s).`);
      }
      if ((interactions?.length || 0) < 5) {
        recommendations.push('Considere aumentar a frequência de contato esta semana.');
      }

      digests.push({
        userId: profile.id,
        email: userData.user.email,
        firstName: profile.first_name || 'Usuário',
        stats: {
          totalInteractions: interactions?.length || 0,
          newContacts: newContacts?.length || 0,
          upcomingBirthdays: upcomingBirthdays.length,
          atRiskContacts: atRiskContacts.length,
          pendingFollowUps: pendingFollowUps?.length || 0,
        },
        highlights,
        recommendations,
      });
    }

    console.log(`Generated ${digests.length} digests`);

    // In production, you would send emails here using Resend or similar
    // For now, we'll just return the digest data
    
    // Example email sending (requires RESEND_API_KEY):
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const { Resend } = await import('npm:resend@2.0.0');
      const resend = new Resend(resendApiKey);
      
      for (const digest of digests) {
        await resend.emails.send({
          from: 'RelateIQ <noreply@yourdomain.com>',
          to: [digest.email],
          subject: `Seu Resumo Semanal - RelateIQ`,
          html: generateEmailHtml(digest),
        });
      }
    }
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        digestsGenerated: digests.length,
        digests: digests 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error generating weekly digest:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function generateEmailHtml(digest: WeeklyDigestData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 12px; color: #64748b; }
        .highlight { background: #dbeafe; padding: 10px 15px; border-radius: 8px; margin: 8px 0; }
        .recommendation { background: #fef3c7; padding: 10px 15px; border-radius: 8px; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Olá, ${digest.firstName}! 👋</h1>
          <p>Aqui está seu resumo semanal do RelateIQ</p>
        </div>
        <div class="content">
          <h2>📊 Esta Semana</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${digest.stats.totalInteractions}</div>
              <div class="stat-label">Interações</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.newContacts}</div>
              <div class="stat-label">Novos Contatos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.upcomingBirthdays}</div>
              <div class="stat-label">Aniversários</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.pendingFollowUps}</div>
              <div class="stat-label">Follow-ups</div>
            </div>
          </div>
          
          ${digest.highlights.length > 0 ? `
            <h3>✨ Destaques</h3>
            ${digest.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
          ` : ''}
          
          ${digest.recommendations.length > 0 ? `
            <h3>💡 Recomendações</h3>
            ${digest.recommendations.map(r => `<div class="recommendation">${r}</div>`).join('')}
          ` : ''}
          
          <p style="text-align: center; margin-top: 30px; color: #64748b;">
            Continue cultivando seus relacionamentos! 🌱
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
