import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

/**
 * Extended interaction data from the external DB view vw_interaction_timeline.
 * Contains fields not present in the local interactions table:
 * channel, direction, assunto, resumo, duracao_segundos, etc.
 */
export interface ExternalInteraction {
  id: string;
  company_id: string | null;
  contact_id: string;
  channel: string | null;
  direction: string | null;
  status: string | null;
  assunto: string | null;
  resumo: string | null;
  data_interacao: string | null;
  duracao_segundos: number | null;
  created_at: string;
  contato_nome: string | null;
  contato_email: string | null;
  contato_phone: string | null;
  empresa_nome: string | null;
  empresa_razao_social: string | null;
  empresa_cnpj: string | null;
}

export function useExternalInteractions(contactId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['external-interactions', contactId, limit],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<ExternalInteraction>({
        table: 'vw_interaction_timeline',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'data_interacao', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
