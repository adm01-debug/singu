import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmotionalState, EmotionalAnchor } from '@/types/nlp-advanced';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface EmotionalStateRecord {
  id: string;
  contact_id: string;
  interaction_id: string | null;
  emotional_state: string;
  confidence: number;
  trigger: string | null;
  context: string | null;
  created_at: string;
}

interface EmotionalAnchorRecord {
  id: string;
  contact_id: string;
  anchor_type: 'positive' | 'negative';
  trigger_word: string;
  emotional_state: string;
  context: string | null;
  strength: number;
  detected_at: string;
  created_at: string;
}

export function useEmotionalStatesPersistence(contactId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stateHistory, setStateHistory] = useState<EmotionalStateRecord[]>([]);
  const [positiveAnchors, setPositiveAnchors] = useState<EmotionalAnchorRecord[]>([]);
  const [negativeAnchors, setNegativeAnchors] = useState<EmotionalAnchorRecord[]>([]);

  // Fetch emotional states history
  const fetchHistory = useCallback(async () => {
    if (!user || !contactId) return;
    
    setLoading(true);
    try {
      const [statesRes, anchorsRes] = await Promise.all([
        supabase
          .from('emotional_states_history')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('emotional_anchors')
          .select('*')
          .eq('contact_id', contactId)
          .order('strength', { ascending: false })
      ]);

      if (statesRes.error) throw statesRes.error;
      if (anchorsRes.error) throw anchorsRes.error;

      setStateHistory(statesRes.data || []);
      
      const anchors = (anchorsRes.data || []) as EmotionalAnchorRecord[];
      setPositiveAnchors(anchors.filter(a => a.anchor_type === 'positive'));
      setNegativeAnchors(anchors.filter(a => a.anchor_type === 'negative'));
    } catch (error) {
      logger.error('Error fetching emotional history:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Save emotional state
  const saveEmotionalState = useCallback(async (
    state: EmotionalState,
    confidence: number,
    trigger?: string,
    context?: string,
    interactionId?: string
  ) => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('emotional_states_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId || null,
          emotional_state: state,
          confidence,
          trigger: trigger || null,
          context: context || null
        })
        .select()
        .single();

      if (error) throw error;
      
      setStateHistory(prev => [data, ...prev]);
      return data;
    } catch (error) {
      logger.error('Error saving emotional state:', error);
      toast.error('Erro ao salvar estado emocional');
      return null;
    }
  }, [user, contactId]);

  // Save emotional anchor
  const saveAnchor = useCallback(async (
    anchor: Omit<EmotionalAnchor, 'id'>
  ) => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('emotional_anchors')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          anchor_type: anchor.type,
          trigger_word: anchor.trigger,
          emotional_state: anchor.state,
          context: anchor.context || null,
          strength: anchor.strength,
          detected_at: anchor.detectedAt
        })
        .select()
        .single();

      if (error) throw error;
      
      const record = data as EmotionalAnchorRecord;
      if (anchor.type === 'positive') {
        setPositiveAnchors(prev => [...prev, record]);
      } else {
        setNegativeAnchors(prev => [...prev, record]);
      }
      
      return record;
    } catch (error) {
      logger.error('Error saving anchor:', error);
      toast.error('Erro ao salvar âncora emocional');
      return null;
    }
  }, [user, contactId]);

  // Bulk save from analysis
  const persistAnalysis = useCallback(async (
    states: { state: EmotionalState; confidence: number; trigger?: string; context?: string; interactionId?: string }[],
    anchors: Omit<EmotionalAnchor, 'id'>[]
  ) => {
    if (!user || !contactId) return false;

    setLoading(true);
    try {
      // Save states
      if (states.length > 0) {
        const stateRecords = states.map(s => ({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: s.interactionId || null,
          emotional_state: s.state,
          confidence: s.confidence,
          trigger: s.trigger || null,
          context: s.context || null
        }));

        const { error: statesError } = await supabase
          .from('emotional_states_history')
          .insert(stateRecords);

        if (statesError) throw statesError;
      }

      // Save anchors
      if (anchors.length > 0) {
        const anchorRecords = anchors.map(a => ({
          user_id: user.id,
          contact_id: contactId,
          anchor_type: a.type,
          trigger_word: a.trigger,
          emotional_state: a.state,
          context: a.context || null,
          strength: a.strength,
          detected_at: a.detectedAt
        }));

        const { error: anchorsError } = await supabase
          .from('emotional_anchors')
          .insert(anchorRecords);

        if (anchorsError) throw anchorsError;
      }

      await fetchHistory();
      toast.success('Análise emocional salva com sucesso!');
      return true;
    } catch (error) {
      logger.error('Error persisting analysis:', error);
      toast.error('Erro ao persistir análise');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, contactId, fetchHistory]);

  // Delete anchor
  const deleteAnchor = useCallback(async (anchorId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('emotional_anchors')
        .delete()
        .eq('id', anchorId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPositiveAnchors(prev => prev.filter(a => a.id !== anchorId));
      setNegativeAnchors(prev => prev.filter(a => a.id !== anchorId));
      toast.success('Âncora removida');
      return true;
    } catch (error) {
      logger.error('Error deleting anchor:', error);
      toast.error('Erro ao remover âncora');
      return false;
    }
  }, [user]);

  return {
    loading,
    stateHistory,
    positiveAnchors,
    negativeAnchors,
    saveEmotionalState,
    saveAnchor,
    persistAnalysis,
    deleteAnchor,
    refetch: fetchHistory
  };
}
