import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichLayerResponse {
  success: boolean;
  data?: {
    first_name?: string;
    last_name?: string;
    headline?: string;
    summary?: string;
    location?: string;
    industry?: string;
    connections?: number;
    profile_pic_url?: string;
    background_cover_url?: string;
    public_identifier?: string;
    experiences?: Array<{
      title?: string;
      company?: string;
      company_linkedin_profile_url?: string;
      location?: string;
      starts_at?: { year?: number; month?: number; day?: number };
      ends_at?: { year?: number; month?: number; day?: number };
      description?: string;
    }>;
    education?: Array<{
      school?: string;
      degree_name?: string;
      field_of_study?: string;
      starts_at?: { year?: number; month?: number; day?: number };
      ends_at?: { year?: number; month?: number; day?: number };
    }>;
    skills?: string[];
    certifications?: Array<{
      name?: string;
      authority?: string;
    }>;
    languages?: string[];
  };
  error?: string;
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

    // Call EnrichLayer API - using the correct /profile endpoint
    const enrichResponse = await fetch(
      `https://enrichlayer.com/api/v2/profile?url=${encodeURIComponent(linkedinUrl)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!enrichResponse.ok) {
      const errorText = await enrichResponse.text();
      console.error('EnrichLayer API error:', enrichResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `EnrichLayer API error: ${enrichResponse.status}` 
        }),
        { status: enrichResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const enrichData: EnrichLayerResponse = await enrichResponse.json();
    console.log('EnrichLayer response received');

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
        
        if (user && enrichData.data) {
          const profileData = {
            contact_id: contactId,
            user_id: user.id,
            platform: 'linkedin',
            profile_url: linkedinUrl,
            profile_data: enrichData.data,
            headline: enrichData.data.headline,
            current_company: enrichData.data.experiences?.[0]?.company,
            current_position: enrichData.data.experiences?.[0]?.title,
            location: enrichData.data.location,
            skills: enrichData.data.skills || [],
            certifications: enrichData.data.certifications?.map(c => c.name) || [],
            education: enrichData.data.education || [],
            experience: enrichData.data.experiences || [],
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
        data: enrichData.data,
        profile: {
          name: `${enrichData.data?.first_name || ''} ${enrichData.data?.last_name || ''}`.trim(),
          headline: enrichData.data?.headline,
          location: enrichData.data?.location,
          industry: enrichData.data?.industry,
          currentPosition: enrichData.data?.experiences?.[0]?.title,
          currentCompany: enrichData.data?.experiences?.[0]?.company,
          skills: enrichData.data?.skills || [],
          experienceCount: enrichData.data?.experiences?.length || 0,
          educationCount: enrichData.data?.education?.length || 0,
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
