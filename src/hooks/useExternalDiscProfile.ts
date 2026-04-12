import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface ExternalDiscProfile {
  primary_profile: string;
  secondary_profile: string | null;
  blend_profile: string | null;
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
  confidence: number;
  summary: string | null;
}

export function useExternalDiscProfile(contactId?: string) {
  return useQuery({
    queryKey: ['external-disc-profile', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ExternalDiscProfile>(
        'get_contact_disc_profile',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
