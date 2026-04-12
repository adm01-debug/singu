import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface InteracaoSemApelido {
  interaction_id: string;
  contact_id: string;
  full_name: string;
  nome_tratamento: string | null;
  company_id: string | null;
  empresa: string | null;
  canal: string | null;
  data_interacao: string | null;
  created_by: number | null;
  vendedor: string | null;
}

/** Interactions where contact has no nickname — data quality view */
export function useInteracoesSemApelido(limit = 20) {
  return useQuery({
    queryKey: ['interacoes-sem-apelido', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<InteracaoSemApelido>({
        table: 'vw_interacoes_sem_apelido',
        order: { column: 'data_interacao', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
