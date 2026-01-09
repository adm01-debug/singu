import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Interaction = Tables<'interactions'>;
export type InteractionInsert = TablesInsert<'interactions'>;
export type InteractionUpdate = TablesUpdate<'interactions'>;

export function useInteractions(contactId?: string, companyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('interactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast({
        title: 'Erro ao carregar interações',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, contactId, companyId, toast]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const createInteraction = async (interaction: Omit<InteractionInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interactions')
        .insert({ ...interaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setInteractions(prev => [data, ...prev]);
      toast({
        title: 'Interação registrada',
        description: 'A interação foi salva com sucesso.',
      });
      return data;
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast({
        title: 'Erro ao registrar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInteraction = async (id: string, updates: InteractionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInteractions(prev => prev.map(i => i.id === id ? data : i));
      toast({
        title: 'Interação atualizada',
        description: 'As alterações foram salvas.',
      });
      return data;
    } catch (error) {
      console.error('Error updating interaction:', error);
      toast({
        title: 'Erro ao atualizar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteInteraction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInteractions(prev => prev.filter(i => i.id !== id));
      toast({
        title: 'Interação removida',
        description: 'A interação foi excluída com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting interaction:', error);
      toast({
        title: 'Erro ao excluir interação',
        description: 'Não foi possível excluir a interação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    interactions,
    loading,
    fetchInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  };
}
