import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertExternalData, deleteExternalData } from '@/lib/externalData';
import { toast } from 'sonner';

/**
 * Generic hook for CRUD on external relational tables (phones, emails, addresses, socials).
 */
export function useExternalRelationalMutations(contactId: string | undefined, table: string, label: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
  };

  const add = useMutation({
    mutationFn: async (record: Record<string, unknown>) => {
      if (!contactId) throw new Error('Missing contact ID');
      const { error } = await insertExternalData(table, { ...record, contact_id: contactId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`${label} adicionado(a)`); invalidate(); },
    onError: (e) => toast.error(`Erro ao adicionar ${label.toLowerCase()}: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteExternalData(table, id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`${label} removido(a)`); invalidate(); },
    onError: (e) => toast.error(`Erro ao remover ${label.toLowerCase()}: ${e.message}`),
  });

  return { add, remove };
}
