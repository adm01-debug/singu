import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { toast } from 'sonner';

export interface ProposalItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
}

export interface Proposal {
  id: string;
  title: string;
  contact_id?: string;
  contact_name?: string;
  company_id?: string;
  company_name?: string;
  deal_id?: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  items?: ProposalItem[];
  subtotal?: number;
  discount_total?: number;
  total?: number;
  valid_until?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
}

export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Proposal[]>('get_proposals', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposal: Partial<Proposal>) => {
      const { data, error } = await callExternalRpc('create_proposal', { p_proposal: proposal });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar proposta'),
  });
}

export function useSendProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await callExternalRpc('send_proposal', { p_proposal_id: proposalId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta enviada');
    },
    onError: () => toast.error('Erro ao enviar proposta'),
  });
}
