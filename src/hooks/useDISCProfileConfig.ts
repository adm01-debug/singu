import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';

export type DISCProfileConfig = Tables<'disc_profile_config'>;

export function useDISCProfileConfig(profileType?: string) {
  const { data: configs = [], isLoading: loading } = useQuery({
    queryKey: ['disc-profile-config', profileType],
    queryFn: async () => {
      try {
        let query = supabase.from('disc_profile_config').select('*');
        if (profileType) query = query.eq('profile_type', profileType);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        logger.error('Error fetching DISC profile configs:', err);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000, // DISC configs rarely change
    gcTime: 60 * 60 * 1000,
  });

  const getConfig = (type: string) => configs.find(c => c.profile_type === type);

  return { configs, loading, getConfig, refresh: () => {} };
}
