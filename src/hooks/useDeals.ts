import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  title: string;
  value: number;
  currency: string;
  stage: string;
  priority: string;
  probability: number;
  expected_close_date: string | null;
  closed_at: string | null;
  lost_reason: string | null;
  notes: string | null;
  tags: string[];
  stage_entered_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: { first_name: string; last_name: string; avatar_url: string | null } | null;
  company?: { name: string; logo_url: string | null } | null;
}

export const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead', color: 'hsl(var(--muted-foreground))', probability: 10 },
  { id: 'qualified', label: 'Qualificado', color: 'hsl(var(--primary))', probability: 25 },
  { id: 'proposal', label: 'Proposta', color: 'hsl(210, 100%, 50%)', probability: 50 },
  { id: 'negotiation', label: 'Negociação', color: 'hsl(38, 92%, 50%)', probability: 75 },
  { id: 'won', label: 'Ganho ✓', color: 'hsl(var(--success))', probability: 100 },
  { id: 'lost', label: 'Perdido', color: 'hsl(var(--destructive))', probability: 0 },
] as const;

export function useDeals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, contact:contacts(first_name, last_name, avatar_url), company:companies(name, logo_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Deal[];
    },
    enabled: !!user,
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { data, error } = await supabase
        .from('deals')
        .insert({ ...deal, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar deal'),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: () => toast.error('Erro ao atualizar deal'),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal removido');
    },
    onError: () => toast.error('Erro ao remover deal'),
  });

  const moveDeal = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const stageConfig = PIPELINE_STAGES.find(s => s.id === stage);
      const updates: any = {
        stage,
        probability: stageConfig?.probability ?? 0,
        stage_entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (stage === 'won') updates.closed_at = new Date().toISOString();
      if (stage === 'lost') updates.closed_at = new Date().toISOString();

      const { error } = await supabase.from('deals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { stage }) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      if (stage === 'won') toast.success('🎉 Deal ganho!');
      else if (stage === 'lost') toast('Deal marcado como perdido');
      else toast.success('Deal movido!');
    },
    onError: () => toast.error('Erro ao mover deal'),
  });

  return { deals: dealsQuery.data || [], isLoading: dealsQuery.isLoading, createDeal, updateDeal, deleteDeal, moveDeal };
}
