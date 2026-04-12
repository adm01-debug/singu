import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  metadata: Record<string, unknown> | null;
}

export function useContactTimeline(contactId?: string) {
  return useQuery({
    queryKey: ['contact-timeline', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TimelineEvent[]>(
        'get_contact_timeline',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
