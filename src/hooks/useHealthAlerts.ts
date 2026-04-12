import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

export interface HealthAlert {
  id: string;
  user_id: string;
  contact_id: string;
  alert_type: 'critical' | 'warning';
  health_score: number;
  previous_score: number | null;
  title: string;
  description: string | null;
  factors: {
    interactionFrequency: number;
    sentimentScore: number;
    engagementLevel: number;
    lastInteractionDays: number;
  } | null;
  dismissed: boolean;
  notified_via: string[];
  created_at: string;
  contact?: {
    first_name: string;
    last_name: string;
  };
}

export interface HealthAlertSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  critical_threshold: number;
  warning_threshold: number;
  check_frequency_hours: number;
  notify_on_critical: boolean;
  notify_on_warning: boolean;
  email_address: string | null;
}

const DEFAULT_SETTINGS: Omit<HealthAlertSettings, 'id' | 'user_id'> = {
  email_notifications: false,
  push_notifications: true,
  critical_threshold: 30,
  warning_threshold: 50,
  check_frequency_hours: 24,
  notify_on_critical: true,
  notify_on_warning: false,
  email_address: null,
};

export function useHealthAlerts() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // ─── Alerts query ───
  const { data: alerts = [], isLoading: loading } = useQuery({
    queryKey: ['health-alerts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_alerts')
        .select('*, contact:contacts(first_name, last_name)')
        .eq('user_id', userId!)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as HealthAlert[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // ─── Settings query ───
  const { data: settings = null, isLoading: settingsLoading } = useQuery({
    queryKey: ['health-alert-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_alert_settings')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as HealthAlertSettings | null);
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const invalidateAlerts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['health-alerts', userId] });
  }, [queryClient, userId]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!userId) return;
    // Optimistic update
    queryClient.setQueryData<HealthAlert[]>(['health-alerts', userId], old => (old || []).filter(a => a.id !== alertId));
    try {
      const { error } = await supabase
        .from('health_alerts')
        .update({ dismissed: true })
        .eq('id', alertId)
        .eq('user_id', userId);
      if (error) throw error;
      toast.success('Alerta dispensado');
    } catch (error) {
      invalidateAlerts();
      logger.error('Error dismissing alert:', error);
      toast.error('Erro ao dispensar alerta');
    }
  }, [userId, queryClient, invalidateAlerts]);

  const dismissAllAlerts = useCallback(async () => {
    if (!userId) return;
    queryClient.setQueryData<HealthAlert[]>(['health-alerts', userId], () => []);
    try {
      const { error } = await supabase
        .from('health_alerts')
        .update({ dismissed: true })
        .eq('user_id', userId)
        .eq('dismissed', false);
      if (error) throw error;
      toast.success('Todos os alertas foram dispensados');
    } catch (error) {
      invalidateAlerts();
      logger.error('Error dismissing all alerts:', error);
      toast.error('Erro ao dispensar alertas');
    }
  }, [userId, queryClient, invalidateAlerts]);

  const saveSettings = useCallback(async (newSettings: Partial<HealthAlertSettings>) => {
    if (!userId) return;
    try {
      const toSave = { ...DEFAULT_SETTINGS, ...settings, ...newSettings, user_id: userId };
      const { data, error } = await supabase
        .from('health_alert_settings')
        .upsert(toSave, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      queryClient.setQueryData(['health-alert-settings', userId], data);
      toast.success('Configurações salvas');
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [userId, settings, queryClient]);

  const checkHealthNow = useCallback(async () => {
    try {
      toast.info('Verificando saúde dos clientes...');
      const { data, error } = await supabase.functions.invoke('check-health-alerts');
      if (error) throw error;
      if (data.alertsCreated > 0) {
        toast.success(`${data.alertsCreated} novo(s) alerta(s) criado(s)!`);
        invalidateAlerts();
      } else {
        toast.info('Nenhum cliente com saúde crítica encontrado');
      }
    } catch (error) {
      logger.error('Error checking health:', error);
      toast.error('Erro ao verificar saúde dos clientes');
    }
  }, [invalidateAlerts]);

  const criticalAlerts = useMemo(() => alerts.filter(a => a.alert_type === 'critical'), [alerts]);
  const warningAlerts = useMemo(() => alerts.filter(a => a.alert_type === 'warning'), [alerts]);

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    settings,
    loading,
    settingsLoading,
    dismissAlert,
    dismissAllAlerts,
    saveSettings,
    checkHealthNow,
    refreshAlerts: invalidateAlerts,
  };
}
