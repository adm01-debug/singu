import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface TriggerSuggestion {
  trigger_type: string;
  description: string;
  priority: number;
  timing: string | null;
  context: string | null;
}

export function useTriggerSuggestions(contactId?: string, enabled = false) {
  return useQuery({
    queryKey: ['trigger-suggestions', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TriggerSuggestion[]>(
        'suggest_triggers_for_contact',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
