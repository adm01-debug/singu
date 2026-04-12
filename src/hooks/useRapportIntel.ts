import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface RapportIntelRecord {
  contact_id?: string;
  contact_name?: string;
  rapport_score?: number;
  rapport_level?: string;
  rapport_tips?: string[];
  shared_interests?: string[];
  mirroring_score?: number;
  trust_indicators?: number;
  connection_quality?: string;
  last_rapport_at?: string;
  [key: string]: unknown;
}

export function useRapportIntel(contactId?: string) {
  return useQuery({
    queryKey: ['vw-singu-rapport-intel', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<RapportIntelRecord>({
        table: 'vw_singu_rapport_intel',
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
