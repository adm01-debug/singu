import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  contactId: string;
  platform: 'linkedin' | 'twitter' | 'instagram';
  profileUrl: string;
}

// Extrair informações do LinkedIn a partir do conteúdo scraped
function parseLinkedInProfile(markdown: string, metadata: any) {
  const profile: any = {
    headline: '',
    current_company: '',
    current_position: '',
    location: '',
    skills: [],
    certifications: [],
    experience: [],
    education: [],
  };

  // Extrair título/headline
  const headlineMatch = markdown.match(/^#\s*(.+)/m);
  if (headlineMatch) {
    profile.headline = headlineMatch[1].trim();
  }

  // Tentar extrair experiência
  const experienceSection = markdown.match(/(?:Experience|Experiência)[\s\S]*?(?=(?:Education|Educação|Skills|Competências|$))/i);
  if (experienceSection) {
    const jobs = experienceSection[0].match(/(?:\*\*|##)\s*([^*\n]+)/g);
    if (jobs) {
      profile.experience = jobs.slice(0, 5).map((job: string) => ({
        title: job.replace(/[\*#]/g, '').trim()
      }));
      if (profile.experience.length > 0) {
        const firstJob = profile.experience[0].title;
        const atMatch = firstJob.match(/(.+?)\s+(?:at|@|em)\s+(.+)/i);
        if (atMatch) {
          profile.current_position = atMatch[1].trim();
          profile.current_company = atMatch[2].trim();
        } else {
          profile.current_position = firstJob;
        }
      }
    }
  }

  // Extrair skills
  const skillsSection = markdown.match(/(?:Skills|Competências|Habilidades)[\s\S]*?(?=(?:Education|Experiência|Experience|$))/i);
  if (skillsSection) {
    const skills = skillsSection[0].match(/[-•]\s*([^\n]+)/g);
    if (skills) {
      profile.skills = skills.slice(0, 20).map((s: string) => s.replace(/[-•]\s*/, '').trim());
    }
  }

  // Extrair localização
  const locationMatch = markdown.match(/(?:Location|Localização|📍)\s*:?\s*([^\n]+)/i);
  if (locationMatch) {
    profile.location = locationMatch[1].trim();
  }

  // Usar metadata se disponível
  if (metadata) {
    if (metadata.title && !profile.headline) {
      profile.headline = metadata.title;
    }
    if (metadata.description) {
      // Tentar extrair mais info da description
      const descMatch = metadata.description.match(/(.+?)\s+[-–|]\s+(.+)/);
      if (descMatch && !profile.current_position) {
        profile.current_position = descMatch[1].trim();
        profile.current_company = descMatch[2].trim();
      }
    }
  }

  return profile;
}

// Extrair informações do Twitter/X
function parseTwitterProfile(markdown: string, metadata: any) {
  const profile: any = {
    headline: '',
    followers_count: 0,
    following_count: 0,
    recent_posts: [],
  };

  // Bio/headline
  const bioMatch = markdown.match(/(?:Bio|Sobre)[\s\S]*?([^\n]+)/i);
  if (bioMatch) {
    profile.headline = bioMatch[1].trim();
  }

  // Followers/Following
  const followersMatch = markdown.match(/(\d+(?:[,.\s]?\d+)*)\s*(?:followers|seguidores)/i);
  if (followersMatch) {
    profile.followers_count = parseInt(followersMatch[1].replace(/[,.\s]/g, ''));
  }

  const followingMatch = markdown.match(/(\d+(?:[,.\s]?\d+)*)\s*(?:following|seguindo)/i);
  if (followingMatch) {
    profile.following_count = parseInt(followingMatch[1].replace(/[,.\s]/g, ''));
  }

  // Posts recentes
  const tweets = markdown.match(/(?:^|\n)(?:>|[-•])\s*([^\n]{20,280})/g);
  if (tweets) {
    profile.recent_posts = tweets.slice(0, 10).map((t: string) => ({
      content: t.replace(/^[>\-•\s]+/, '').trim(),
      timestamp: new Date().toISOString()
    }));
  }

  if (metadata?.title) {
    profile.headline = profile.headline || metadata.title;
  }

  return profile;
}

// Extrair informações do Instagram
function parseInstagramProfile(markdown: string, metadata: any) {
  const profile: any = {
    headline: '',
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    recent_posts: [],
  };

  // Bio
  const bioMatch = markdown.match(/(?:Bio|Sobre)[\s\S]*?([^\n]+)/i);
  if (bioMatch) {
    profile.headline = bioMatch[1].trim();
  }

  // Stats
  const followersMatch = markdown.match(/(\d+(?:[,.\s]?\d+)*)\s*(?:followers|seguidores)/i);
  if (followersMatch) {
    profile.followers_count = parseInt(followersMatch[1].replace(/[,.\s]/g, ''));
  }

  const followingMatch = markdown.match(/(\d+(?:[,.\s]?\d+)*)\s*(?:following|seguindo)/i);
  if (followingMatch) {
    profile.following_count = parseInt(followingMatch[1].replace(/[,.\s]/g, ''));
  }

  const postsMatch = markdown.match(/(\d+(?:[,.\s]?\d+)*)\s*(?:posts|publicações)/i);
  if (postsMatch) {
    profile.posts_count = parseInt(postsMatch[1].replace(/[,.\s]/g, ''));
  }

  if (metadata?.title) {
    profile.headline = profile.headline || metadata.title;
  }

  return profile;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
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

    const { contactId, platform, profileUrl }: ScrapeRequest = await req.json();

    if (!contactId || !platform || !profileUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping ${platform} profile: ${profileUrl}`);

    // Fazer scraping com Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: profileUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Esperar JavaScript carregar
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      
      // Atualizar schedule com erro
      await supabaseClient
        .from('social_scraping_schedule')
        .update({
          last_run_at: new Date().toISOString(),
          consecutive_failures: 1,
          last_error: `Firecrawl error: ${scrapeResponse.status}`,
        })
        .eq('contact_id', contactId)
        .eq('platform', platform);

      return new Response(JSON.stringify({ error: "Failed to scrape profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Parse baseado na plataforma
    let parsedProfile: any;
    switch (platform) {
      case 'linkedin':
        parsedProfile = parseLinkedInProfile(markdown, metadata);
        break;
      case 'twitter':
        parsedProfile = parseTwitterProfile(markdown, metadata);
        break;
      case 'instagram':
        parsedProfile = parseInstagramProfile(markdown, metadata);
        break;
      default:
        parsedProfile = { headline: metadata.title || '' };
    }

    // Buscar perfil existente para comparar mudanças
    const { data: existingProfile } = await supabaseClient
      .from('social_profiles')
      .select('*')
      .eq('contact_id', contactId)
      .eq('platform', platform)
      .single();

    // Detectar eventos de vida (mudanças significativas)
    const lifeEvents: any[] = [];

    if (existingProfile) {
      // Detectar mudança de emprego
      if (platform === 'linkedin') {
        if (existingProfile.current_company && 
            parsedProfile.current_company && 
            existingProfile.current_company !== parsedProfile.current_company) {
          lifeEvents.push({
            contact_id: contactId,
            user_id: user.id,
            platform,
            event_type: 'company_change',
            event_title: 'Mudança de Empresa',
            event_description: `Mudou de ${existingProfile.current_company} para ${parsedProfile.current_company}`,
            previous_value: existingProfile.current_company,
            new_value: parsedProfile.current_company,
            confidence: 0.9,
            event_date: new Date().toISOString(),
          });
        }

        // Detectar promoção (mudança de cargo na mesma empresa)
        if (existingProfile.current_position && 
            parsedProfile.current_position && 
            existingProfile.current_position !== parsedProfile.current_position &&
            existingProfile.current_company === parsedProfile.current_company) {
          lifeEvents.push({
            contact_id: contactId,
            user_id: user.id,
            platform,
            event_type: 'promotion',
            event_title: 'Possível Promoção',
            event_description: `Cargo mudou de "${existingProfile.current_position}" para "${parsedProfile.current_position}"`,
            previous_value: existingProfile.current_position,
            new_value: parsedProfile.current_position,
            confidence: 0.85,
            event_date: new Date().toISOString(),
          });
        }

        // Detectar novas certificações
        const existingCerts = existingProfile.certifications || [];
        const newCerts = parsedProfile.certifications || [];
        const addedCerts = newCerts.filter((c: string) => !existingCerts.includes(c));
        
        for (const cert of addedCerts) {
          lifeEvents.push({
            contact_id: contactId,
            user_id: user.id,
            platform,
            event_type: 'certification',
            event_title: 'Nova Certificação',
            event_description: `Obteve nova certificação: ${cert}`,
            new_value: cert,
            confidence: 0.95,
            event_date: new Date().toISOString(),
          });
        }
      }

      // Detectar spike de engajamento (Twitter/Instagram)
      if (platform === 'twitter' || platform === 'instagram') {
        const oldFollowers = existingProfile.followers_count || 0;
        const newFollowers = parsedProfile.followers_count || 0;
        
        if (oldFollowers > 0 && newFollowers > oldFollowers * 1.2) {
          lifeEvents.push({
            contact_id: contactId,
            user_id: user.id,
            platform,
            event_type: 'engagement_spike',
            event_title: 'Crescimento de Seguidores',
            event_description: `Seguidores aumentaram de ${oldFollowers.toLocaleString()} para ${newFollowers.toLocaleString()} (+${Math.round((newFollowers/oldFollowers - 1) * 100)}%)`,
            previous_value: String(oldFollowers),
            new_value: String(newFollowers),
            confidence: 0.9,
            event_date: new Date().toISOString(),
          });
        }
      }
    }

    // Salvar/atualizar perfil
    const profileData = {
      contact_id: contactId,
      user_id: user.id,
      platform,
      profile_url: profileUrl,
      profile_data: scrapeData,
      headline: parsedProfile.headline,
      current_company: parsedProfile.current_company,
      current_position: parsedProfile.current_position,
      location: parsedProfile.location,
      followers_count: parsedProfile.followers_count,
      following_count: parsedProfile.following_count,
      skills: parsedProfile.skills,
      certifications: parsedProfile.certifications,
      education: parsedProfile.education,
      experience: parsedProfile.experience,
      recent_posts: parsedProfile.recent_posts,
      last_scraped_at: new Date().toISOString(),
    };

    const { data: savedProfile, error: saveError } = await supabaseClient
      .from('social_profiles')
      .upsert(profileData, { onConflict: 'contact_id,platform' })
      .select()
      .single();

    if (saveError) {
      // Se der erro de conflito, tenta insert normal
      const { data: insertedProfile, error: insertError } = await supabaseClient
        .from('social_profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error saving profile:', insertError);
      }
    }

    // Salvar eventos de vida detectados
    if (lifeEvents.length > 0) {
      const { error: eventsError } = await supabaseClient
        .from('social_life_events')
        .insert(lifeEvents);

      if (eventsError) {
        console.error('Error saving life events:', eventsError);
      }
    }

    // Atualizar schedule
    await supabaseClient
      .from('social_scraping_schedule')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        consecutive_failures: 0,
        last_error: null,
      })
      .eq('contact_id', contactId)
      .eq('platform', platform);

    console.log(`Successfully scraped ${platform} profile for contact ${contactId}`);
    console.log(`Detected ${lifeEvents.length} life events`);

    return new Response(JSON.stringify({
      success: true,
      profile: parsedProfile,
      lifeEvents,
      raw: { markdown: markdown.substring(0, 500) + '...' },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("social-profile-scraper error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
