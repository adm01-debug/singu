import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';

export type DISCConversionMetric = Tables<'disc_conversion_metrics'>;

export function useDISCConversionMetrics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: metrics = [], isLoading: loading } = useQuery({
    queryKey: ['disc-conversion-metrics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disc_conversion_metrics')
        .select('*')
        .eq('user_id', user!.id)
        .order('conversion_rate', { ascending: false });
      if (error) throw error;
      return (data || []) as DISCConversionMetric[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const bestProfile = metrics.length > 0 ? metrics[0] : null;
  const totalContacts = useMemo(() => metrics.reduce((sum, m) => sum + m.total_contacts, 0), [metrics]);
  const totalConverted = useMemo(() => metrics.reduce((sum, m) => sum + m.converted_count, 0), [metrics]);
  const overallConversionRate = totalContacts > 0 ? Math.round((totalConverted / totalContacts) * 100) : 0;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['disc-conversion-metrics', user?.id] });
  }, [queryClient, user?.id]);

  return { metrics, loading, bestProfile, totalContacts, totalConverted, overallConversionRate, refresh };
}
