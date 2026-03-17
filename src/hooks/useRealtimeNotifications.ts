import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeNotification {
  id: string;
  type: 'alert' | 'insight' | 'health_alert' | 'interaction' | 'contact';
  title: string;
  description?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

interface AlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  created_at: string;
  action_url: string | null;
}

interface InsightPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
}

interface HealthAlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
  alert_type: string;
}

interface StakeholderAlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
  severity: string;
  recommended_action: string | null;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle new alert
  const handleNewAlert = useCallback((payload: RealtimePostgresChangesPayload<AlertPayload>) => {
    const alert = payload.new as AlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id || undefined,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    toast(alert.title, {
      description: alert.description || undefined,
      action: {
        label: 'Ver',
        onClick: () => {
          if (alert.action_url) {
            window.location.href = alert.action_url;
          }
        },
      },
    });
  }, []);

  // Handle new insight
  const handleNewInsight = useCallback((payload: RealtimePostgresChangesPayload<InsightPayload>) => {
    const insight = payload.new as InsightPayload;
    if (!insight || !insight.id) return;
    
    const notification: RealtimeNotification = {
      id: insight.id,
      type: 'insight',
      title: insight.title,
      description: insight.description || undefined,
      entityId: insight.contact_id,
      entityType: 'contact',
      createdAt: insight.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    toast.info(`💡 ${insight.title}`, {
      description: insight.description || undefined,
    });
  }, []);

  // Handle new health alert
  const handleNewHealthAlert = useCallback((payload: RealtimePostgresChangesPayload<HealthAlertPayload>) => {
    const alert = payload.new as HealthAlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'health_alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    const icon = alert.alert_type === 'critical' ? '🚨' : '⚠️';
    toast.warning(`${icon} ${alert.title}`, {
      description: alert.description || undefined,
    });
  }, []);

  // Handle new stakeholder alert
  const handleNewStakeholderAlert = useCallback((payload: RealtimePostgresChangesPayload<StakeholderAlertPayload>) => {
    const alert = payload.new as StakeholderAlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    const icon = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : 'ℹ️';
    toast(`${icon} ${alert.title}`, {
      description: alert.recommended_action || alert.description || undefined,
    });
  }, []);

  // Subscribe to realtime changes - use user.id to stabilize dependency
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        handleNewAlert
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insights',
          filter: `user_id=eq.${userId}`,
        },
        handleNewInsight
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_alerts',
          filter: `user_id=eq.${userId}`,
        },
        handleNewHealthAlert
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stakeholder_alerts',
          filter: `user_id=eq.${userId}`,
        },
        handleNewStakeholderAlert
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime notifications channel error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, handleNewAlert, handleNewInsight, handleNewHealthAlert, handleNewStakeholderAlert]);

  // Load initial notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: insights } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: healthAlerts } = await supabase
        .from('health_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const allNotifications: RealtimeNotification[] = [
        ...(alerts || []).map(a => ({
          id: a.id,
          type: 'alert' as const,
          title: a.title,
          description: a.description || undefined,
          entityId: a.contact_id || undefined,
          entityType: 'contact',
          createdAt: a.created_at,
        })),
        ...(insights || []).map(i => ({
          id: i.id,
          type: 'insight' as const,
          title: i.title,
          description: i.description || undefined,
          entityId: i.contact_id,
          entityType: 'contact',
          createdAt: i.created_at,
        })),
        ...(healthAlerts || []).map(h => ({
          id: h.id,
          type: 'health_alert' as const,
          title: h.title,
          description: h.description || undefined,
          entityId: h.contact_id,
          entityType: 'contact',
          createdAt: h.created_at,
        })),
      ].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 50);

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    };

    loadNotifications();
  }, [user]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const dismissNotification = useCallback(async (notification: RealtimeNotification) => {
    const tableMap = {
      alert: 'alerts',
      insight: 'insights',
      health_alert: 'health_alerts',
    } as const;

    const table = tableMap[notification.type as keyof typeof tableMap];
    if (!table) return;

    await supabase
      .from(table)
      .update({ dismissed: true })
      .eq('id', notification.id);

    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }, []);

  return {
    notifications,
    unreadCount,
    clearUnread,
    dismissNotification,
  };
}
