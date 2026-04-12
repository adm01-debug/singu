import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface ChannelSuggestion {
  channel: string;
  confidence: number;
  reason: string;
  best_time: string | null;
}

export function useNextContactChannel(contactId?: string) {
  return useQuery({
    queryKey: ['next-contact-channel', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ChannelSuggestion>(
        'suggest_next_contact_channel',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
