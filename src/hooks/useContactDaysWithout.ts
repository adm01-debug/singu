import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export function useContactDaysWithout(contactId?: string) {
  return useQuery({
    queryKey: ['days-without-contact', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<{ days: number; last_contact_date: string | null }>(
        'get_days_without_contact',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
