import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useTriggerAnalytics(contactId?: string) {
  const { user } = useAuth();
  const [abTests, setAbTests] = useState<Tables<'trigger_ab_tests'>[]>([]);
  const [channelEffectiveness, setChannelEffectiveness] = useState<Tables<'trigger_channel_effectiveness'>[]>([]);
  const [bundles, setBundles] = useState<Tables<'trigger_bundles'>[]>([]);
  const [intensityHistory, setIntensityHistory] = useState<Tables<'trigger_intensity_history'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchAll = async () => {
      const baseQuery = (table: string) => {
        let q = supabase.from(table as any).select('*');
        if (contactId) q = q.eq('contact_id', contactId);
        return q.order('created_at', { ascending: false }).limit(50);
      };

      const [abRes, chRes, buRes, intRes] = await Promise.all([
        baseQuery('trigger_ab_tests'),
        baseQuery('trigger_channel_effectiveness'),
        supabase.from('trigger_bundles').select('*').order('success_rate', { ascending: false }).limit(20),
        contactId
          ? supabase.from('trigger_intensity_history').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
      ]);

      setAbTests(abRes.data || []);
      setChannelEffectiveness(chRes.data || []);
      setBundles(buRes.data || []);
      setIntensityHistory(intRes.data || []);
      setLoading(false);
    };

    fetchAll();
  }, [user, contactId]);

  return { abTests, channelEffectiveness, bundles, intensityHistory, loading };
}
