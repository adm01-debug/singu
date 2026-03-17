import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientValue, DecisionCriterion, ValueCategory } from '@/types/nlp-advanced';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ClientValueRecord {
  id: string;
  contact_id: string;
  category: string;
  value_name: string;
  importance: number;
  detected_phrases: string[] | null;
  frequency: number;
  last_mentioned: string;
  created_at: string;
  updated_at: string;
}

interface DecisionCriterionRecord {
  id: string;
  contact_id: string;
  name: string;
  priority: number;
  criteria_type: 'must_have' | 'nice_to_have' | 'deal_breaker';
  detected_from: string | null;
  how_to_address: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientValuesPersistence(contactId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedValues, setSavedValues] = useState<ClientValueRecord[]>([]);
  const [savedCriteria, setSavedCriteria] = useState<DecisionCriterionRecord[]>([]);

  // Fetch saved values and criteria
  const fetchSavedData = useCallback(async () => {
    if (!user || !contactId) return;
    
    setLoading(true);
    try {
      const [valuesRes, criteriaRes] = await Promise.all([
        supabase
          .from('client_values')
          .select('*')
          .eq('contact_id', contactId)
          .order('importance', { ascending: false }),
        supabase
          .from('decision_criteria')
          .select('*')
          .eq('contact_id', contactId)
          .order('priority', { ascending: true })
      ]);

      if (valuesRes.error) throw valuesRes.error;
      if (criteriaRes.error) throw criteriaRes.error;

      setSavedValues(valuesRes.data || []);
      setSavedCriteria((criteriaRes.data || []) as DecisionCriterionRecord[]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => {
    fetchSavedData();
  }, [fetchSavedData]);

  // Upsert a client value
  const saveValue = useCallback(async (value: ClientValue) => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('client_values')
        .upsert({
          user_id: user.id,
          contact_id: contactId,
          category: value.category,
          value_name: value.name,
          importance: value.importance,
          detected_phrases: value.detectedPhrases,
          frequency: value.frequency,
          last_mentioned: value.lastMentioned
        }, {
          onConflict: 'user_id,contact_id,category,value_name'
        })
        .select()
        .single();

      if (error) throw error;
      
      setSavedValues(prev => {
        const filtered = prev.filter(v => 
          !(v.category === value.category && v.value_name === value.name)
        );
        return [...filtered, data].sort((a, b) => b.importance - a.importance);
      });
      
      return data;
    } catch {
      toast.error('Erro ao salvar valor do cliente');
      return null;
    }
  }, [user, contactId]);

  // Save decision criterion
  const saveCriterion = useCallback(async (criterion: DecisionCriterion) => {
    if (!user || !contactId) return null;

    try {
      const { data, error } = await supabase
        .from('decision_criteria')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          name: criterion.name,
          priority: criterion.priority,
          criteria_type: criterion.type,
          detected_from: criterion.detectedFrom || null,
          how_to_address: criterion.howToAddress || null
        })
        .select()
        .single();

      if (error) throw error;
      
      const record = data as DecisionCriterionRecord;
      setSavedCriteria(prev => [...prev, record].sort((a, b) => a.priority - b.priority));
      return record;
    } catch {
      toast.error('Erro ao salvar critério de decisão');
      return null;
    }
  }, [user, contactId]);

  // Bulk persist values map
  const persistValuesMap = useCallback(async (
    values: ClientValue[],
    criteria: DecisionCriterion[]
  ) => {
    if (!user || !contactId) return false;

    setLoading(true);
    try {
      // Upsert all values
      if (values.length > 0) {
        const valueRecords = values.map(v => ({
          user_id: user.id,
          contact_id: contactId,
          category: v.category,
          value_name: v.name,
          importance: v.importance,
          detected_phrases: v.detectedPhrases,
          frequency: v.frequency,
          last_mentioned: v.lastMentioned
        }));

        const { error: valuesError } = await supabase
          .from('client_values')
          .upsert(valueRecords, {
            onConflict: 'user_id,contact_id,category,value_name'
          });

        if (valuesError) throw valuesError;
      }

      // Replace criteria: insert first, then delete old ones (safe order)
      if (criteria.length > 0) {
        const criteriaRecords = criteria.map(c => ({
          user_id: user.id,
          contact_id: contactId,
          name: c.name,
          priority: c.priority,
          criteria_type: c.type,
          detected_from: c.detectedFrom || null,
          how_to_address: c.howToAddress || null
        }));

        const { data: inserted, error: criteriaError } = await supabase
          .from('decision_criteria')
          .insert(criteriaRecords)
          .select('id');

        if (criteriaError) throw criteriaError;

        // Only delete old criteria after successful insert
        const newIds = (inserted || []).map(r => r.id);
        if (newIds.length > 0) {
          await supabase
            .from('decision_criteria')
            .delete()
            .eq('contact_id', contactId)
            .eq('user_id', user.id)
            .not('id', 'in', `(${newIds.join(',')})`);
        }
      }

      await fetchSavedData();
      toast.success('Valores e critérios salvos com sucesso!');
      return true;
    } catch {
      toast.error('Erro ao persistir análise de valores');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, contactId, fetchSavedData]);

  // Delete a value
  const deleteValue = useCallback(async (valueId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('client_values')
        .delete()
        .eq('id', valueId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedValues(prev => prev.filter(v => v.id !== valueId));
      toast.success('Valor removido');
      return true;
    } catch {
      toast.error('Erro ao remover valor');
      return false;
    }
  }, [user]);

  // Delete a criterion
  const deleteCriterion = useCallback(async (criterionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('decision_criteria')
        .delete()
        .eq('id', criterionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedCriteria(prev => prev.filter(c => c.id !== criterionId));
      toast.success('Critério removido');
      return true;
    } catch {
      toast.error('Erro ao remover critério');
      return false;
    }
  }, [user]);

  return {
    loading,
    savedValues,
    savedCriteria,
    saveValue,
    saveCriterion,
    persistValuesMap,
    deleteValue,
    deleteCriterion,
    refetch: fetchSavedData
  };
}
