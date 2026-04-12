import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SinguCommunicationIntel {
  user_id: string;
  contact_id: string;
  contact_name: string;
  day_of_week: number | null;
  hour_of_day: number | null;
  total_attempts: number | null;
  success_count: number | null;
  success_rate: number | null;
  avg_response_time_minutes: number | null;
  preferred_channel: string | null;
  preferred_days: string[] | null;
  avoid_days: string[] | null;
}

export function useSinguCommunicationIntel(contactId: string | undefined) {
  return useQuery({
    queryKey: ['singu-communication-intel', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<SinguCommunicationIntel>({
        table: 'vw_singu_communication_intel',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
