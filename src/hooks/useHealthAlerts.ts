import { useState, useEffect, useCallback } from 'react';
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

const defaultSettings: Omit<HealthAlertSettings, 'id' | 'user_id'> = {
  email_notifications: false,
  push_notifications: true,
  critical_threshold: 30,
  warning_threshold: 50,
  check_frequency_hours: 24,
  notify_on_critical: true,
  notify_on_warning: false,
  email_address: null
};

export function useHealthAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [settings, setSettings] = useState<HealthAlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('health_alerts')
        .select(`
          *,
          contact:contacts(first_name, last_name)
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setAlerts((data || []) as unknown as HealthAlert[]);
    } catch (error) {
      logger.error('Error fetching health alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('health_alert_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data as HealthAlertSettings | null);
    } catch (error) {
      logger.error('Error fetching health alert settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
  }, [fetchAlerts, fetchSettings]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!user) return;

    const previousAlerts = alerts;
    setAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const { error } = await supabase
        .from('health_alerts')
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
    if (!user) return;

    const previousAlerts = alerts;
    setAlerts([]);

    try {
      const { error } = await supabase
        .from('health_alerts')
        .update({ dismissed: true })
        .eq('user_id', user.id)
        .eq('dismissed', false);

      if (error) throw error;
      toast.success('Todos os alertas foram dispensados');
    } catch (error) {
      setAlerts(previousAlerts);
      logger.error('Error dismissing all alerts:', error);
      toast.error('Erro ao dispensar alertas');
    }
  }, [user, alerts]);

  const saveSettings = useCallback(async (newSettings: Partial<HealthAlertSettings>) => {
    if (!user) return;

    try {
      const settingsToSave = {
        ...defaultSettings,
        ...settings,
        ...newSettings,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('health_alert_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(data as HealthAlertSettings);
      toast.success('Configurações salvas');
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [user, settings]);

  const checkHealthNow = useCallback(async () => {
    try {
      toast.info('Verificando saúde dos clientes...');
      
      const { data, error } = await supabase.functions.invoke('check-health-alerts');
      
      if (error) throw error;

      if (data.alertsCreated > 0) {
        toast.success(`${data.alertsCreated} novo(s) alerta(s) criado(s)!`);
        fetchAlerts();
      } else {
        toast.info('Nenhum cliente com saúde crítica encontrado');
      }
    } catch (error) {
      logger.error('Error checking health:', error);
      toast.error('Erro ao verificar saúde dos clientes');
    }
  }, [fetchAlerts]);

  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical');
  const warningAlerts = alerts.filter(a => a.alert_type === 'warning');

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
    refreshAlerts: fetchAlerts
  };
}
