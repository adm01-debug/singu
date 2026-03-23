import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface ScoreChange {
  contactId: string;
  contactName: string;
  previousProbability: 'high' | 'medium' | 'low' | 'very_low' | null;
  currentProbability: 'high' | 'medium' | 'low' | 'very_low';
  previousScore: number | null;
  currentScore: number;
  changeType: 'improved_to_high' | 'dropped_to_very_low';
}

interface ClosingScoreAlert {
  id: string;
  contact_id: string;
  contact_name: string;
  previous_probability: string | null;
  current_probability: string;
  previous_score: number | null;
  current_score: number;
  change_type: string;
  created_at: string;
  dismissed: boolean;
}

const PROBABILITY_LABELS: Record<string, string> = {
  'high': 'Alta',
  'medium': 'Média',
  'low': 'Baixa',
  'very_low': 'Muito Baixa'
};

export function useClosingScoreAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ClosingScoreAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing alerts
  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'closing_score_change')
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse the alerts data
      const parsedAlerts = (data || []).map(alert => {
        const description = alert.description || '';
        const parts = description.split('|');
        
        return {
          id: alert.id,
          contact_id: alert.contact_id || '',
          contact_name: parts[0] || 'Contato',
          previous_probability: parts[1] || null,
          current_probability: parts[2] || '',
          previous_score: parts[3] ? parseInt(parts[3]) : null,
          current_score: parts[4] ? parseInt(parts[4]) : 0,
          change_type: parts[5] || '',
          created_at: alert.created_at,
          dismissed: alert.dismissed || false
        };
      });

      setAlerts(parsedAlerts);
    } catch (error) {
      logger.error('Error fetching closing score alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Check for score changes and create alerts
  const checkScoreChange = useCallback(async (
    contactId: string,
    contactName: string,
    currentScore: number,
    currentProbability: 'high' | 'medium' | 'low' | 'very_low'
  ) => {
    if (!user) return null;

    try {
      // Get the last stored score for this contact
      const { data: lastAlert } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .eq('type', 'closing_score_change')
        .order('created_at', { ascending: false })
        .limit(1);

      let previousProbability: string | null = null;
      let previousScore: number | null = null;

      if (lastAlert && lastAlert.length > 0) {
        const parts = (lastAlert[0].description || '').split('|');
        previousProbability = parts[2] || null;
        previousScore = parts[4] ? parseInt(parts[4]) : null;
      }

      // Check for significant changes
      let changeType: 'improved_to_high' | 'dropped_to_very_low' | null = null;

      // Improved to high (from any other state)
      if (currentProbability === 'high' && previousProbability !== 'high') {
        changeType = 'improved_to_high';
      }
      // Dropped to very low (from any other state)
      else if (currentProbability === 'very_low' && previousProbability !== 'very_low' && previousProbability !== null) {
        changeType = 'dropped_to_very_low';
      }

      if (changeType) {
        // Create alert
        const title = changeType === 'improved_to_high'
          ? `🎯 ${contactName}: Score de Fechamento em ALTA!`
          : `⚠️ ${contactName}: Score de Fechamento caiu para MUITO BAIXA`;

        const priority = changeType === 'improved_to_high' ? 'high' : 'critical';

        // Store details in description for parsing
        const description = `${contactName}|${previousProbability || ''}|${currentProbability}|${previousScore || ''}|${currentScore}|${changeType}`;

        const { data: newAlert, error } = await supabase
          .from('alerts')
          .insert({
            user_id: user.id,
            contact_id: contactId,
            type: 'closing_score_change',
            title,
            description,
            priority,
            action_url: `/contatos/${contactId}`,
            dismissed: false
          })
          .select()
          .single();

        if (error) throw error;

        // Show toast notification
        if (changeType === 'improved_to_high') {
          toast.success(`🎯 ${contactName} está pronto para fechar!`, {
            description: `Score subiu para ${currentScore}% - Probabilidade Alta`,
            duration: 8000,
            action: {
              label: 'Ver Contato',
              onClick: () => window.location.href = `/contatos/${contactId}`
            }
          });
        } else {
          toast.warning(`⚠️ Atenção: ${contactName} esfriando!`, {
            description: `Score caiu para ${currentScore}% - Ação necessária`,
            duration: 8000,
            action: {
              label: 'Ver Contato',
              onClick: () => window.location.href = `/contatos/${contactId}`
            }
          });
        }

        // Refresh alerts
        await fetchAlerts();

        return {
          contactId,
          contactName,
          previousProbability,
          currentProbability,
          previousScore,
          currentScore,
          changeType
        } as ScoreChange;
      }

      return null;
    } catch (error) {
      logger.error('Error checking score change:', error);
      return null;
    }
  }, [user, fetchAlerts]);

  // Dismiss an alert
  const dismissAlert = useCallback(async (alertId: string) => {
    if (!user) return;

    const previousAlerts = alerts;
    setAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Alerta dispensado');
    } catch (error) {
      setAlerts(previousAlerts);
      logger.error('Error dismissing alert:', error);
      toast.error('Erro ao dispensar alerta');
    }
  }, [user, alerts]);

  const dismissAllAlerts = useCallback(async () => {
    if (!user || alerts.length === 0) return;

    const previousAlerts = alerts;
    setAlerts([]);

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('user_id', user.id)
        .eq('type', 'closing_score_change')
        .eq('dismissed', false);

      if (error) throw error;
      toast.success('Todos os alertas dispensados');
    } catch (error) {
      setAlerts(previousAlerts);
      logger.error('Error dismissing all alerts:', error);
      toast.error('Erro ao dispensar alertas');
    }
  }, [user, alerts]);

  return {
    alerts,
    loading,
    checkScoreChange,
    dismissAlert,
    dismissAllAlerts,
    refreshAlerts: fetchAlerts,
    probabilityLabels: PROBABILITY_LABELS
  };
}
