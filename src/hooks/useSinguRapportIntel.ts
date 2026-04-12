import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SinguRapportIntel {
  user_id: string;
  contact_id: string;
  full_name: string;
  birthday: string | null;
  hobbies: string[] | null;
  interests: string[] | null;
  family_info: string | null;
  personal_notes: string | null;
  upcoming_events: unknown;
  relatives: unknown;
  top_values: unknown;
  positive_anchors: unknown;
}

export function useSinguRapportIntel(contactId: string | undefined) {
  return useQuery({
    queryKey: ['singu-rapport-intel', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<SinguRapportIntel>({
        table: 'vw_singu_rapport_intel',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
