import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface CommunicationIntel {
  contact_id?: string;
  contact_name?: string;
  preferred_channel?: string;
  best_time?: string;
  best_day?: string;
  response_rate?: number;
  avg_response_time_min?: number;
  total_messages?: number;
  last_contact_at?: string;
  engagement_score?: number;
  [key: string]: unknown;
}

export function useCommunicationIntel(contactId?: string) {
  return useQuery({
    queryKey: ['vw-singu-communication-intel', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<CommunicationIntel>({
        table: 'vw_singu_communication_intel',
        select: '*',
        filters: contactId ? [{ type: 'eq', column: 'contact_id', value: contactId }] : [],
        range: { from: 0, to: contactId ? 0 : 49 },
      });
      if (error) throw error;
      return contactId ? (data?.[0] || null) : (data || []);
    },
    enabled: contactId ? !!contactId : true,
    staleTime: 10 * 60 * 1000,
  });
}
