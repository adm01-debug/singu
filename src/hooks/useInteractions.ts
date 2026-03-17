import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNLPAutoAnalysis } from '@/hooks/useNLPAutoAnalysis';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export type Interaction = Tables<'interactions'>;
export type InteractionInsert = TablesInsert<'interactions'>;
export type InteractionUpdate = TablesUpdate<'interactions'>;

export function useInteractions(contactId?: string, companyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchInteractions = useCallback(async (pageNum = 0, append = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('interactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      if (append) {
        setInteractions(prev => [...prev, ...(data || [])]);
      } else {
        setInteractions(data || []);
      }
      
      setHasMore((data?.length || 0) === pageSize);
      setPage(pageNum);
      
      return { data, count, hasMore: (data?.length || 0) === pageSize };
    } catch (error) {
      logger.error('Error fetching interactions:', error);
      toast({
        title: 'Erro ao carregar interações',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return { data: [], count: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  }, [user, contactId, companyId, toast]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchInteractions(page + 1, true);
    }
  }, [hasMore, loading, page, fetchInteractions]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const createInteraction = async (
    interaction: Omit<InteractionInsert, 'user_id'>,
    options?: { triggerDISCAnalysis?: boolean; triggerNLPAnalysis?: boolean }
  ) => {
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

      // Trigger DISC auto-analysis if enabled and has content
      if (options?.triggerDISCAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
          // Call DISC analyzer in background (non-blocking)
          supabase.functions.invoke('disc-analyzer', {
            body: {
              texts: [fullText],
              contactId: data.contact_id,
              interactionId: data.id,
              userId: user.id
            }
          }).then(({ data: discResult }) => {
            if (discResult?.success) {
              toast({
                title: `🎯 Perfil DISC Atualizado`,
                description: `Perfil: ${discResult.analysis?.blendProfile || discResult.analysis?.primaryProfile}`,
              });
            }
          }).catch(err => logger.error('DISC analysis failed:', err));
        }
      }

      // Trigger NLP auto-analysis if enabled and has content
      if (options?.triggerNLPAnalysis !== false && data.contact_id) {
        const fullText = [data.content, data.transcription].filter(Boolean).join('\n\n');
        if (fullText.length >= 100) {
          // Call NLP analyzer in background (non-blocking)
          triggerAnalysis(
            data.contact_id,
            data.id,
            data.content,
            data.transcription,
            data.type,
            true // showToast
          ).catch(err => logger.error('NLP analysis failed:', err));
        }
      }

      return data;
    } catch (error) {
      logger.error('Error creating interaction:', error);
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
      logger.error('Error updating interaction:', error);
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
      logger.error('Error deleting interaction:', error);
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
    hasMore,
    fetchInteractions,
    loadMore,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  };
}
