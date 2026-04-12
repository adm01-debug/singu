import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface CommunicationIntel {
  contact_id?: string;
  user_id?: string;
  full_name?: string;
  preferred_channel?: string;
  best_day?: string;
  best_time?: string;
  avg_response_time_minutes?: number;
  total_interactions?: number;
  last_interaction_at?: string;
  success_rate?: number;
  channel_breakdown?: Record<string, number>;
}

export function useCommunicationIntel(contactId?: string) {
  return useQuery({
    queryKey: ['communication-intel', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<CommunicationIntel>({
        table: 'vw_singu_communication_intel',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCommunicationIntelList() {
  return useQuery({
    queryKey: ['communication-intel-list'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<CommunicationIntel>({
        table: 'vw_singu_communication_intel',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
