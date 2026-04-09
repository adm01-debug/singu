import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type EmotionalAnchor = Tables<'emotional_anchors'>;

export function useEmotionalAnchors(contactId?: string) {
  const { user } = useAuth();
  const [anchors, setAnchors] = useState<EmotionalAnchor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnchors = useCallback(async () => {
    if (!user || !contactId) return;
    try {
      const { data, error } = await supabase
        .from('emotional_anchors')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('strength', { ascending: false });
      if (error) throw error;
      setAnchors(data || []);
    } catch (err) {
      logger.error('Error fetching emotional anchors:', err);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => { fetchAnchors(); }, [fetchAnchors]);

  const createAnchor = useCallback(async (anchor: Omit<TablesInsert<'emotional_anchors'>, 'user_id'>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('emotional_anchors')
        .insert({ ...anchor, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setAnchors(prev => [data, ...prev]);
      toast.success('Âncora emocional registrada');
      return data;
    } catch (err) {
      logger.error('Error creating emotional anchor:', err);
      toast.error('Erro ao criar âncora emocional');
      return null;
    }
  }, [user]);

  const deleteAnchor = useCallback(async (id: string) => {
    if (!user) return;
    setAnchors(prev => prev.filter(a => a.id !== id));
    try {
      const { error } = await supabase.from('emotional_anchors').delete().eq('id', id);
      if (error) throw error;
      toast.success('Âncora removida');
    } catch (err) {
      logger.error('Error deleting anchor:', err);
      fetchAnchors();
    }
  }, [user, fetchAnchors]);

  return { anchors, loading, createAnchor, deleteAnchor, refresh: fetchAnchors };
}
