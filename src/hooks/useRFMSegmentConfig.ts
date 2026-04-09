import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useRFMSegmentConfig() {
  const { user } = useAuth();
  const [segments, setSegments] = useState<Tables<'rfm_segment_config'>[]>([]);
  const [metrics, setMetrics] = useState<Tables<'rfm_metrics'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchAll = async () => {
      const [segRes, metRes] = await Promise.all([
        supabase.from('rfm_segment_config').select('*').order('priority', { ascending: true }),
        supabase.from('rfm_metrics').select('*').order('created_at', { ascending: false }).limit(1),
      ]);

      setSegments(segRes.data || []);
      setMetrics(metRes.data?.[0] || null);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  return { segments, metrics, loading };
}
