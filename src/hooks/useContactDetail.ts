import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData } from '@/lib/externalData';
import { logger } from '@/lib/logger';
import type { Tables, TablesUpdate, Json } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type Company = Tables<'companies'>;
export type Interaction = Tables<'interactions'>;
export type Insight = Tables<'insights'>;
export type Alert = Tables<'alerts'>;

export interface ContactDetailData {
  contact: Contact | null;
  company: Company | null;
  interactions: Interaction[];
  insights: Insight[];
  alerts: Alert[];
}

export function useContactDetail(contactId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ContactDetailData>({
    contact: null,
    company: null,
    interactions: [],
    insights: [],
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactDetail = useCallback(async (signal?: AbortSignal) => {
    if (!user || !contactId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (signal?.aborted) return;

      if (contactError || !contactData) {
        setError('Contato não encontrado');
        setLoading(false);
        return;
      }

      let companyData: Company | null = null;
      if (contactData?.company_id) {
        const { data: localCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('id', contactData.company_id)
          .single();

        if (localCompany) {
          companyData = localCompany;
        } else {
          const { data: companyResult } = await queryExternalData<Company>({
            table: 'companies',
            filters: [{ type: 'eq', column: 'id', value: contactData.company_id }],
          });
          if (companyResult && companyResult.length > 0) {
            companyData = companyResult[0];
          }
        }
      }

      if (signal?.aborted) return;

      const [interactionsRes, insightsRes, alertsRes] = await Promise.allSettled([
        supabase
          .from('interactions')
          .select('id, type, title, content, sentiment, tags, duration, attachments, audio_url, transcription, key_insights, initiated_by, response_time, follow_up_required, follow_up_date, emotion_analysis, created_at, contact_id, company_id, user_id')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('insights')
          .select('id, category, title, description, confidence, source, actionable, action_suggestion, expires_at, dismissed, created_at, contact_id, user_id')
          .eq('contact_id', contactId)
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('alerts')
          .select('id, type, priority, title, description, action_url, dismissed, expires_at, created_at, contact_id, user_id')
          .eq('contact_id', contactId)
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (signal?.aborted) return;

      setData({
        contact: contactData,
        company: companyData,
        interactions: (interactionsRes.status === 'fulfilled' ? interactionsRes.value.data : null) || [],
        insights: (insightsRes.status === 'fulfilled' ? insightsRes.value.data : null) || [],
        alerts: (alertsRes.status === 'fulfilled' ? alertsRes.value.data : null) || [],
      });
    } catch {
      if (signal?.aborted) return;
      setError('Erro ao carregar dados do contato');
      toast({
        title: 'Erro ao carregar contato',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [user, contactId, toast]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchContactDetail(abortController.signal);
    return () => abortController.abort();
  }, [fetchContactDetail]);

  // Set up realtime subscription for updates
  useEffect(() => {
    if (!user || !contactId) return;

    const channel = supabase
      .channel(`contact-detail-${contactId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setData(prev => ({
              ...prev,
              contact: payload.new as Contact,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interactions',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newInteraction = payload.new as Interaction;
            setData(prev => {
              if (prev.interactions.some(i => i.id === newInteraction.id)) return prev;
              return { ...prev, interactions: [newInteraction, ...prev.interactions] };
            });
          } else if (payload.eventType === 'DELETE') {
            setData(prev => ({
              ...prev,
              interactions: prev.interactions.filter(i => i.id !== payload.old.id),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insights',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newInsight = payload.new as Insight;
            setData(prev => {
              if (prev.insights.some(i => i.id === newInsight.id)) return prev;
              return { ...prev, insights: [newInsight, ...prev.insights] };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as Alert;
            setData(prev => {
              if (prev.alerts.some(a => a.id === newAlert.id)) return prev;
              return { ...prev, alerts: [newAlert, ...prev.alerts] };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId]);

  const updateContact = async (updates: TablesUpdate<'contacts'>) => {
    if (!user || !contactId) return null;

    try {
      const { data: updatedContact, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        contact: updatedContact,
      }));

      toast({
        title: 'Contato atualizado',
        description: 'As alterações foram salvas.',
      });

      return updatedContact;
    } catch {
      toast({
        title: 'Erro ao atualizar contato',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateBehavior = async (behavior: Record<string, unknown>) => {
    return updateContact({ behavior: behavior as Json });
  };

  const addInteraction = async (interaction: Omit<Tables<'interactions'>, 'id' | 'created_at' | 'user_id'>) => {
    if (!user || !contactId) return null;

    try {
      const { data: newInteraction, error } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          contact_id: contactId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Realtime will handle the update, but we can optimistically update
      setData(prev => ({
        ...prev,
        interactions: [newInteraction, ...prev.interactions],
      }));

      toast({
        title: 'Interação registrada',
        description: 'A interação foi salva com sucesso.',
      });

      return newInteraction;
    } catch {
      toast({
        title: 'Erro ao registrar interação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(a => a.id !== alertId),
      }));

      toast({
        title: 'Alerta dispensado',
      });
    } catch (err) {
      logger.error('Failed to dismiss alert:', err);
      toast({ title: 'Erro ao dispensar alerta', variant: 'destructive' });
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('insights')
        .update({ dismissed: true })
        .eq('id', insightId);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        insights: prev.insights.filter(i => i.id !== insightId),
      }));

      toast({
        title: 'Insight dispensado',
      });
    } catch (err) {
      logger.error('Failed to dismiss insight:', err);
      toast({ title: 'Erro ao dispensar insight', variant: 'destructive' });
    }
  };

  return {
    ...data,
    loading,
    error,
    refetch: fetchContactDetail,
    updateContact,
    updateBehavior,
    addInteraction,
    dismissAlert,
    dismissInsight,
  };
}
