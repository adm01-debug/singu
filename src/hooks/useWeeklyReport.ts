import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface WeeklyReportSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  send_day: string;
  send_time: string;
  email_address: string | null;
  include_portfolio_summary: boolean;
  include_at_risk_clients: boolean;
  include_health_alerts: boolean;
  include_upcoming_dates: boolean;
  include_recommendations: boolean;
  include_performance_metrics: boolean;
  last_sent_at: string | null;
}

export interface WeeklyReportData {
  id: string;
  user_id: string;
  report_data: {
    generatedAt: string;
    period: { start: string; end: string };
    portfolioSummary: {
      totalContacts: number;
      totalCompanies: number;
      totalInteractions: number;
      avgHealthScore: number;
      healthyClients: number;
      warningClients: number;
      criticalClients: number;
    };
    atRiskClients: Array<{
      id: string;
      name: string;
      healthScore: number;
      daysSinceContact: number;
      reason: string;
    }>;
    upcomingDates: Array<{
      id: string;
      contactName: string;
      type: string;
      date: string;
      daysUntil: number;
    }>;
    recommendations: string[];
    performanceMetrics: {
      interactionsThisWeek: number;
      interactionsLastWeek: number;
      newContacts: number;
      completedFollowUps: number;
      pendingFollowUps: number;
    };
  };
  sent_via: string[];
  created_at: string;
}

const defaultSettings: Omit<WeeklyReportSettings, 'id' | 'user_id' | 'last_sent_at'> = {
  enabled: true,
  send_day: 'monday',
  send_time: '09:00',
  email_address: null,
  include_portfolio_summary: true,
  include_at_risk_clients: true,
  include_health_alerts: true,
  include_upcoming_dates: true,
  include_recommendations: true,
  include_performance_metrics: true
};

export function useWeeklyReport() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WeeklyReportSettings | null>(null);
  const [reports, setReports] = useState<WeeklyReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weekly_report_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as WeeklyReportSettings | null);
    } catch (error) {
      logger.error('Error fetching weekly report settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchReports = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports((data || []) as unknown as WeeklyReportData[]);
    } catch (error) {
      logger.error('Error fetching weekly reports:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
    fetchReports();
  }, [fetchSettings, fetchReports]);

  const saveSettings = useCallback(async (newSettings: Partial<WeeklyReportSettings>) => {
    if (!user) return;

    try {
      const settingsToSave = {
        ...defaultSettings,
        ...settings,
        ...newSettings,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('weekly_report_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(data as WeeklyReportSettings);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [user, settings]);

  const generateReport = useCallback(async () => {
    if (!user) return null;

    setGenerating(true);
    try {
      toast.info('Gerando relatório semanal...');
      
      const { data, error } = await supabase.functions.invoke('weekly-digest', {
        body: { userId: user.id, generateOnly: true }
      });
      
      if (error) throw error;

      // Find the user's digest in the response
      const userDigest = data.digests?.find((d: { userId: string }) => d.userId === user.id);
      
      if (userDigest) {
        toast.success('Relatório gerado com sucesso!');
        fetchReports();
        return userDigest;
      }

      toast.info('Relatório gerado - verifique seu email se configurado');
      return data;
    } catch (error) {
      logger.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [user, fetchReports]);

  const sendTestEmail = useCallback(async () => {
    if (!user || !settings?.email_address) {
      toast.error('Configure um email primeiro');
      return;
    }

    try {
      toast.info('Enviando email de teste...');
      
      const { error } = await supabase.functions.invoke('weekly-digest', {
        body: { 
          userId: user.id, 
          sendEmail: true,
          testMode: true 
        }
      });
      
      if (error) throw error;

      toast.success('Email de teste enviado!');
    } catch (error) {
      logger.error('Error sending test email:', error);
      toast.error('Erro ao enviar email. Verifique se o Resend está configurado.');
    }
  }, [user, settings]);

  const dayOptions = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  return {
    settings,
    reports,
    loading,
    generating,
    saveSettings,
    generateReport,
    sendTestEmail,
    dayOptions,
    refreshSettings: fetchSettings,
    refreshReports: fetchReports
  };
}
