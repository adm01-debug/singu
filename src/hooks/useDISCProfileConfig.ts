import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';

export type DISCProfileConfig = Tables<'disc_profile_config'>;

export function useDISCProfileConfig(profileType?: string) {
  const [configs, setConfigs] = useState<DISCProfileConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      let query = supabase.from('disc_profile_config').select('*');
      if (profileType) query = query.eq('profile_type', profileType);
      const { data, error } = await query;
      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      logger.error('Error fetching DISC profile configs:', err);
    } finally {
      setLoading(false);
    }
  }, [profileType]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const getConfig = useCallback((type: string) => configs.find(c => c.profile_type === type), [configs]);

  return { configs, loading, getConfig, refresh: fetchConfigs };
}
