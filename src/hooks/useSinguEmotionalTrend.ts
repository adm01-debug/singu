import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SinguEmotionalTrendEntry {
  user_id: string;
  contact_id: string;
  contact_name: string;
  emotional_state: string;
  confidence: number | null;
  trigger: string | null;
  context: string | null;
  created_at: string;
  previous_state: string | null;
}

export function useSinguEmotionalTrend(contactId: string | undefined) {
  return useQuery({
    queryKey: ['singu-emotional-trend', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<SinguEmotionalTrendEntry>({
        table: 'vw_singu_emotional_trend',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
