import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData } from '@/lib/externalData';
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

  const fetchContactDetail = useCallback(async () => {
    if (!user || !contactId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch contact with specific fields for performance
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          whatsapp,
          linkedin,
          instagram,
          twitter,
          avatar_url,
          birthday,
          role,
          role_title,
          relationship_score,
          relationship_stage,
          sentiment,
          behavior,
          notes,
          personal_notes,
          family_info,
          hobbies,
          interests,
          tags,
          life_events,
          company_id,
          user_id,
          created_at,
          updated_at
        `)
        .eq('id', contactId)
        .single();

      if (contactError) {
        if (contactError.code === 'PGRST116') {
          setError('Contato não encontrado');
        } else {
          throw contactError;
        }
        setLoading(false);
        return;
      }

      // Fetch company if contact has one
      let companyData: Company | null = null;
      if (contactData?.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', contactData.company_id)
          .single();

        if (!companyError) {
          companyData = company;
        }
      }

      // Fetch interactions for this contact
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('id, type, title, content, sentiment, tags, duration, attachments, audio_url, transcription, key_insights, initiated_by, response_time, follow_up_required, follow_up_date, emotion_analysis, created_at, contact_id, company_id, user_id')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
      }

      // Fetch insights for this contact
      const { data: insightsData, error: insightsError } = await supabase
        .from('insights')
        .select('id, category, title, description, confidence, source, actionable, action_suggestion, expires_at, dismissed, created_at, contact_id, user_id')
        .eq('contact_id', contactId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (insightsError) {
        console.error('Error fetching insights:', insightsError);
      }

      // Fetch alerts for this contact
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('id, type, priority, title, description, action_url, dismissed, expires_at, created_at, contact_id, user_id')
        .eq('contact_id', contactId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
      }

      setData({
        contact: contactData,
        company: companyData,
        interactions: interactionsData || [],
        insights: insightsData || [],
        alerts: alertsData || [],
      });
    } catch (err) {
      console.error('Error fetching contact detail:', err);
      setError('Erro ao carregar dados do contato');
      toast({
        title: 'Erro ao carregar contato',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, contactId, toast]);

  useEffect(() => {
    fetchContactDetail();
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
            setData(prev => ({
              ...prev,
              interactions: [payload.new as Interaction, ...prev.interactions],
            }));
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
            setData(prev => ({
              ...prev,
              insights: [payload.new as Insight, ...prev.insights],
            }));
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
            setData(prev => ({
              ...prev,
              alerts: [payload.new as Alert, ...prev.alerts],
            }));
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
    } catch (err) {
      console.error('Error updating contact:', err);
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
    } catch (err) {
      console.error('Error adding interaction:', err);
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
      console.error('Error dismissing alert:', err);
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
      console.error('Error dismissing insight:', err);
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
