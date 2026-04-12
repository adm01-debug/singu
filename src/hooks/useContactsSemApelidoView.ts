import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactSemApelido {
  contact_id: string;
  full_name: string;
  first_name: string | null;
  nome_tratamento: string | null;
  apelido: string | null;
  cargo: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  empresa: string | null;
  cidade: string | null;
  total_interacoes: number | null;
  ultima_interacao: string | null;
  prioridade_preenchimento: string | null;
}

/** Contacts missing nickname — useful for data quality dashboards */
export function useContactsSemApelido(limit = 20) {
  return useQuery({
    queryKey: ['contacts-sem-apelido', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactSemApelido>({
        table: 'vw_contacts_sem_apelido',
        order: { column: 'total_interacoes', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
