import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SocialProfile {
  id: string;
  contact_id: string;
  platform: 'linkedin' | 'twitter' | 'instagram';
  profile_url: string | null;
  headline: string | null;
  current_company: string | null;
  current_position: string | null;
  location: string | null;
  followers_count: number | null;
  following_count: number | null;
  skills: string[] | null;
  certifications: string[] | null;
  experience: any[] | null;
  education: any[] | null;
  recent_posts: any[] | null;
  last_scraped_at: string;
  created_at: string;
}

export interface SocialLifeEvent {
  id: string;
  contact_id: string;
  platform: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  event_date: string | null;
  previous_value: string | null;
  new_value: string | null;
  confidence: number;
  notified: boolean;
  dismissed: boolean;
  created_at: string;
  metadata?: any;
}

export interface SocialBehaviorAnalysis {
  id: string;
  contact_id: string;
  personality_traits: {
    openness: { score: number; indicators: string[] };
    conscientiousness: { score: number; indicators: string[] };
    extraversion: { score: number; indicators: string[] };
    agreeableness: { score: number; indicators: string[] };
    neuroticism: { score: number; indicators: string[] };
  } | null;
  communication_style: {
    formality: 'formal' | 'informal' | 'balanced';
    approach: 'technical' | 'emotional' | 'balanced';
    directness: 'direct' | 'indirect' | 'balanced';
    preferred_format: 'visual' | 'textual' | 'balanced';
    tips: string[];
  } | null;
  interests: string[] | null;
  topics: string[] | null;
  overall_sentiment: string | null;
  sentiment_score: number | null;
  influence_level: 'thought_leader' | 'active_contributor' | 'passive_observer' | 'lurker' | null;
  influence_score: number | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  sales_insights: {
    best_approaches: string[];
    rapport_topics: string[];
    decision_triggers: string[];
    avoid: string[];
    optimal_contact_time: string;
    preferred_channel: string;
  } | null;
  executive_summary: string | null;
  confidence: number;
  created_at: string;
}

export interface ScrapingSchedule {
  id: string;
  contact_id: string;
  platform: string;
  profile_url: string;
  frequency_days: number;
  priority: 'high' | 'normal' | 'low';
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  consecutive_failures: number;
  last_error: string | null;
}

export function useSocialProfiles(contactId?: string) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [lifeEvents, setLifeEvents] = useState<SocialLifeEvent[]>([]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<SocialBehaviorAnalysis | null>(null);
  const [schedules, setSchedules] = useState<ScrapingSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Buscar perfis sociais do contato
  const fetchProfiles = useCallback(async () => {
    if (!user || !contactId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_profiles')
        .select('*')
        .eq('contact_id', contactId)
        .order('last_scraped_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as SocialProfile[]);
    } catch (err) {
      console.error('Error fetching social profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  // Buscar eventos de vida
  const fetchLifeEvents = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      const { data, error } = await supabase
        .from('social_life_events')
        .select('*')
        .eq('contact_id', contactId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLifeEvents((data || []) as SocialLifeEvent[]);
    } catch (err) {
      console.error('Error fetching life events:', err);
    }
  }, [user, contactId]);

  // Buscar última análise comportamental
  const fetchBehaviorAnalysis = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      const { data, error } = await supabase
        .from('social_behavior_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBehaviorAnalysis(data as unknown as SocialBehaviorAnalysis | null);
    } catch (err) {
      console.error('Error fetching behavior analysis:', err);
    }
  }, [user, contactId]);

  // Buscar schedules
  const fetchSchedules = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      const { data, error } = await supabase
        .from('social_scraping_schedule')
        .select('*')
        .eq('contact_id', contactId);

      if (error) throw error;
      setSchedules((data || []) as ScrapingSchedule[]);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  }, [user, contactId]);

  // Fazer scraping de um perfil
  const scrapeProfile = useCallback(async (
    platform: 'linkedin' | 'twitter' | 'instagram',
    profileUrl: string
  ) => {
    if (!user || !contactId) return null;

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-profile-scraper', {
        body: {
          contactId,
          platform,
          profileUrl,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Perfil do ${platform} atualizado com sucesso!`);
        if (data.lifeEvents?.length > 0) {
          toast.info(`${data.lifeEvents.length} evento(s) de vida detectado(s)!`);
        }
        await fetchProfiles();
        await fetchLifeEvents();
        return data;
      } else {
        throw new Error(data?.error || 'Falha ao fazer scraping');
      }
    } catch (err) {
      console.error('Error scraping profile:', err);
      toast.error(`Erro ao fazer scraping: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setScraping(false);
    }
  }, [user, contactId, fetchProfiles, fetchLifeEvents]);

  // Analisar comportamento baseado nos perfis
  const analyzeBehavior = useCallback(async () => {
    if (!user || !contactId) return null;

    if (profiles.length === 0) {
      toast.error('Nenhum perfil social encontrado. Faça o scraping primeiro.');
      return null;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-behavior-analyzer', {
        body: { contactId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Análise comportamental concluída!');
        await fetchBehaviorAnalysis();
        return data.analysis;
      } else {
        throw new Error(data?.error || 'Falha na análise');
      }
    } catch (err) {
      console.error('Error analyzing behavior:', err);
      toast.error(`Erro na análise: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user, contactId, profiles.length, fetchBehaviorAnalysis]);

  // Configurar schedule de scraping
  const configureSchedule = useCallback(async (
    platform: 'linkedin' | 'twitter' | 'instagram',
    profileUrl: string,
    frequencyDays: number = 7,
    priority: 'high' | 'normal' | 'low' = 'normal',
    enabled: boolean = true
  ) => {
    if (!user || !contactId) return false;

    try {
      const { error } = await supabase
        .from('social_scraping_schedule')
        .upsert({
          contact_id: contactId,
          user_id: user.id,
          platform,
          profile_url: profileUrl,
          frequency_days: frequencyDays,
          priority,
          enabled,
          next_run_at: new Date().toISOString(),
        }, { onConflict: 'contact_id,platform' });

      if (error) throw error;

      toast.success(`Monitoramento do ${platform} configurado!`);
      await fetchSchedules();
      return true;
    } catch (err) {
      console.error('Error configuring schedule:', err);
      toast.error('Erro ao configurar monitoramento');
      return false;
    }
  }, [user, contactId, fetchSchedules]);

  // Dispensar evento de vida
  const dismissLifeEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('social_life_events')
        .update({ dismissed: true })
        .eq('id', eventId);

      if (error) throw error;
      setLifeEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Error dismissing event:', err);
    }
  }, []);

  // Carregar dados ao montar
  useEffect(() => {
    if (contactId && user) {
      fetchProfiles();
      fetchLifeEvents();
      fetchBehaviorAnalysis();
      fetchSchedules();
    }
  }, [contactId, user, fetchProfiles, fetchLifeEvents, fetchBehaviorAnalysis, fetchSchedules]);

  return {
    profiles,
    lifeEvents,
    behaviorAnalysis,
    schedules,
    loading,
    scraping,
    analyzing,
    scrapeProfile,
    analyzeBehavior,
    configureSchedule,
    dismissLifeEvent,
    refreshProfiles: fetchProfiles,
    refreshEvents: fetchLifeEvents,
    refreshAnalysis: fetchBehaviorAnalysis,
  };
}

// Hook para buscar todos os eventos de vida não lidos
export function useAllSocialLifeEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(SocialLifeEvent & { contact?: any })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_life_events')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents((data || []) as (SocialLifeEvent & { contact?: any })[]);
    } catch (err) {
      console.error('Error fetching all life events:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refreshEvents: fetchEvents };
}
