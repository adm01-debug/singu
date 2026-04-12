import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface BusinessAlert {
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affected_count: number;
  action_required: string;
}

export function useBusinessAlerts() {
  return useQuery({
    queryKey: ['business-alerts'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<BusinessAlert[]>(
        'get_business_alerts',
        {}
      );
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
