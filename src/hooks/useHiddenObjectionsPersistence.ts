import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HiddenObjection, ObjectionType } from '@/types/nlp-advanced';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ObjectionRecord {
  id: string;
  contact_id: string;
  interaction_id: string | null;
  objection_type: string;
  indicator: string;
  probability: number;
  severity: 'low' | 'medium' | 'high';
  possible_real_objection: string | null;
  suggested_probe: string | null;
  resolution_templates: string[] | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export function useHiddenObjectionsPersistence(contactId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedObjections, setSavedObjections] = useState<ObjectionRecord[]>([]);
  const [resolvedObjections, setResolvedObjections] = useState<ObjectionRecord[]>([]);

  // Fetch saved objections
  const fetchObjections = useCallback(async () => {
    if (!user || !contactId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hidden_objections')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const objections = (data || []) as ObjectionRecord[];
      setSavedObjections(objections.filter(o => !o.resolved));
      setResolvedObjections(objections.filter(o => o.resolved));
    } catch (error) {
      logger.error('Error fetching objections:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => {
    fetchObjections();
  }, [fetchObjections]);

  // Save a new objection
  const saveObjection = useCallback(async (
    objection: HiddenObjection,
    interactionId?: string
  ) => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('hidden_objections')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId || null,
          objection_type: objection.type,
          indicator: objection.indicator,
          probability: objection.probability,
          severity: objection.severity,
          possible_real_objection: objection.possibleRealObjection || null,
          suggested_probe: objection.suggestedProbe || null,
          resolution_templates: objection.resolutionTemplates || null,
          resolved: false
        })
        .select()
        .single();

      if (error) throw error;
      
      const record = data as ObjectionRecord;
      setSavedObjections(prev => [record, ...prev]);
      return record;
    } catch (error) {
      logger.error('Error saving objection:', error);
      toast.error('Erro ao salvar objeção');
      return null;
    }
  }, [user, contactId]);

  // Mark objection as resolved
  const resolveObjection = useCallback(async (objectionId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('hidden_objections')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', objectionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const record = data as ObjectionRecord;
      setSavedObjections(prev => prev.filter(o => o.id !== objectionId));
      setResolvedObjections(prev => [record, ...prev]);
      toast.success('Objeção marcada como resolvida!');
      return true;
    } catch (error) {
      logger.error('Error resolving objection:', error);
      toast.error('Erro ao resolver objeção');
      return false;
    }
  }, [user]);

  // Unresolve objection
  const unresolveObjection = useCallback(async (objectionId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('hidden_objections')
        .update({
          resolved: false,
          resolved_at: null
        })
        .eq('id', objectionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const record = data as ObjectionRecord;
      setResolvedObjections(prev => prev.filter(o => o.id !== objectionId));
      setSavedObjections(prev => [record, ...prev]);
      return true;
    } catch (error) {
      logger.error('Error unresolving objection:', error);
      toast.error('Erro ao reabrir objeção');
      return false;
    }
  }, [user]);

  // Bulk persist objections
  const persistObjections = useCallback(async (
    objections: HiddenObjection[],
    interactionId?: string
  ) => {
    if (!user || !contactId || objections.length === 0) return false;

    setLoading(true);
    try {
      // Check for existing objections to avoid duplicates
      const existingTypes = savedObjections.map(o => o.objection_type);
      const newObjections = objections.filter(o => !existingTypes.includes(o.type));

      if (newObjections.length === 0) {
        toast.info('Todas as objeções já estão registradas');
        return true;
      }

      const records = newObjections.map(o => ({
        user_id: user.id,
        contact_id: contactId,
        interaction_id: interactionId || null,
        objection_type: o.type,
        indicator: o.indicator,
        probability: o.probability,
        severity: o.severity,
        possible_real_objection: o.possibleRealObjection || null,
        suggested_probe: o.suggestedProbe || null,
        resolution_templates: o.resolutionTemplates || null,
        resolved: false
      }));

      const { error } = await supabase
        .from('hidden_objections')
        .insert(records);

      if (error) throw error;

      await fetchObjections();
      toast.success(`${newObjections.length} objeções salvas com sucesso!`);
      return true;
    } catch (error) {
      logger.error('Error persisting objections:', error);
      toast.error('Erro ao persistir objeções');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, contactId, savedObjections, fetchObjections]);

  // Delete objection
  const deleteObjection = useCallback(async (objectionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('hidden_objections')
        .delete()
        .eq('id', objectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedObjections(prev => prev.filter(o => o.id !== objectionId));
      setResolvedObjections(prev => prev.filter(o => o.id !== objectionId));
      toast.success('Objeção removida');
      return true;
    } catch (error) {
      logger.error('Error deleting objection:', error);
      toast.error('Erro ao remover objeção');
      return false;
    }
  }, [user]);

  // Get statistics
  const getStats = useCallback(() => {
    const total = savedObjections.length + resolvedObjections.length;
    const resolved = resolvedObjections.length;
    const highSeverity = savedObjections.filter(o => o.severity === 'high').length;
    
    return {
      total,
      resolved,
      pending: savedObjections.length,
      highSeverity,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  }, [savedObjections, resolvedObjections]);

  return {
    loading,
    savedObjections,
    resolvedObjections,
    saveObjection,
    resolveObjection,
    unresolveObjection,
    persistObjections,
    deleteObjection,
    getStats,
    refetch: fetchObjections
  };
}
