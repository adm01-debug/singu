import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// EnrichLayer returns the profile data directly (not wrapped in data object)
interface EnrichLayerProfile {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  headline?: string;
  summary?: string;
  occupation?: string;
  location_str?: string;
  city?: string;
  state?: string;
  country?: string;
  country_full_name?: string;
  industry?: string;
  connections?: number;
  profile_pic_url?: string;
  background_cover_image_url?: string;
  public_identifier?: string;
  experiences?: Array<{
    title?: string;
    company?: string;
    company_linkedin_profile_url?: string;
    location?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
    description?: string;
    logo_url?: string;
  }>;
  education?: Array<{
    school?: string;
    degree_name?: string;
    field_of_study?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
    description?: string;
    logo_url?: string;
    school_linkedin_profile_url?: string;
  }>;
  certifications?: Array<{
    name?: string;
    authority?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
  }>;
  languages?: string[];
  activities?: Array<{
    title?: string;
    link?: string;
    activity_status?: string;
  }>;
  groups?: Array<{
    name?: string;
    url?: string;
  }>;
  recommendations?: string[];
  accomplishment_projects?: Array<{
    title?: string;
    description?: string;
    url?: string;
  }>;
  volunteer_work?: Array<{
    title?: string;
    company?: string;
    description?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl, contactId } = await req.json();

    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'LinkedIn URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ENRICHLAYER_API_KEY');
    if (!apiKey) {
      console.error('ENRICHLAYER_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'EnrichLayer API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enriching LinkedIn profile:', linkedinUrl);

    // Call EnrichLayer API - using /profile endpoint with url parameter
    const apiUrl = `https://enrichlayer.com/api/v2/profile?url=${encodeURIComponent(linkedinUrl)}`;
    console.log('Calling EnrichLayer API:', apiUrl);
    
    const enrichResponse = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseText = await enrichResponse.text();
    console.log('EnrichLayer response status:', enrichResponse.status);
    console.log('EnrichLayer response preview:', responseText.substring(0, 1000));

    if (!enrichResponse.ok) {
      console.error('EnrichLayer API error:', enrichResponse.status, responseText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `EnrichLayer API error: ${enrichResponse.status}`,
          details: responseText.substring(0, 500)
        }),
        { status: enrichResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let profile: EnrichLayerProfile;
    try {
      profile = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse EnrichLayer response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse API response',
          rawResponse: responseText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('EnrichLayer profile received:', profile.full_name || profile.first_name);
    console.log('Experience count:', profile.experiences?.length || 0);
    console.log('Education count:', profile.education?.length || 0);

    // If contactId provided, save to social_profiles table
    if (contactId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user && profile) {
          const profileData = {
            contact_id: contactId,
            user_id: user.id,
            platform: 'linkedin',
            profile_url: linkedinUrl,
            profile_data: profile,
            headline: profile.headline,
            current_company: profile.experiences?.[0]?.company,
            current_position: profile.experiences?.[0]?.title,
            location: profile.location_str || `${profile.city || ''} ${profile.state || ''} ${profile.country || ''}`.trim(),
            skills: [], // Skills need separate API call with skills=include
            certifications: profile.certifications?.map(c => c.name).filter(Boolean) || [],
            education: profile.education || [],
            experience: profile.experiences || [],
            last_scraped_at: new Date().toISOString(),
          };

          const { error: saveError } = await supabaseClient
            .from('social_profiles')
            .upsert(profileData, { onConflict: 'contact_id,platform' });

          if (saveError) {
            console.error('Error saving profile to database:', saveError);
          } else {
            console.log('Profile saved to database for contact:', contactId);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: profile,
        profile: {
          name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          firstName: profile.first_name,
          lastName: profile.last_name,
          headline: profile.headline,
          summary: profile.summary,
          occupation: profile.occupation,
          location: profile.location_str || `${profile.city || ''} ${profile.state || ''}`.trim(),
          country: profile.country_full_name || profile.country,
          industry: profile.industry,
          profilePicUrl: profile.profile_pic_url,
          connections: profile.connections,
          currentPosition: profile.experiences?.[0]?.title,
          currentCompany: profile.experiences?.[0]?.company,
          experiences: profile.experiences || [],
          education: profile.education || [],
          certifications: profile.certifications || [],
          languages: profile.languages || [],
          recommendations: profile.recommendations || [],
          experienceCount: profile.experiences?.length || 0,
          educationCount: profile.education?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EnrichLayer function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
